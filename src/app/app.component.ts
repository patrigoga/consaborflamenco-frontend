import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationError, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Reconoce los errores propios de imports JS obsoletos tras un despliegue.
 * No confundir con un 404 de API, ni recargar ante errores normales de rutas. */
export function esErrorDeChunk(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically imported module|ChunkLoadError|Loading chunk [^ ]+ failed|Loading CSS chunk [^ ]+ failed|Failed to load resource: .*\.js/i.test(mensaje);
}

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
export class AppComponent {
  private readonly router = inject(Router);
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (!this.navegador) return;
    this.router.events.pipe(
      filter((e): e is NavigationError => e instanceof NavigationError),
      takeUntilDestroyed()
    ).subscribe(evento => {
      if (!esErrorDeChunk(evento.error)) return;
      // Una sola recarga por ruta en 60 segundos: si el servidor falla de verdad,
      // no someter al visitante a un bucle infinito.
      const clave = 'csf:recarga-chunk:' + evento.url;
      try {
        const ultima = Number(window.sessionStorage.getItem(clave) || '0');
        if (Date.now() - ultima < 60_000) return;
        window.sessionStorage.setItem(clave, String(Date.now()));
      } catch {
        // Al bloquear sessionStorage, no provocar bucles de recarga.
        return;
      }
      window.location.reload();
    });
  }
}
