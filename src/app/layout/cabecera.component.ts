import { Component, DestroyRef, ElementRef, HostListener, PLATFORM_ID, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MenuPublicoService, MENU_INICIAL, construirMenu } from '../menu-publico.service';
import { ElementoNav, GrupoNav, MEMBRESIA, esGrupo } from '../navegacion';

@Component({
  selector: 'csf-cabecera',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './cabecera.component.html',
  styleUrl: './cabecera.component.css'
})
export class CabeceraComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly menuPublico = inject(MenuPublicoService);
  readonly navegacion = signal<ElementoNav[]>(MENU_INICIAL);
  readonly membresia = MEMBRESIA;
  readonly esGrupo = esGrupo;
  /** Menú completo abierto (móvil y tablet). */
  readonly menuAbierto = signal(false);
  /** Grupo desplegado (Flamenco o Revista). */
  readonly grupoAbierto = signal<string | null>(null);
  /** Grupo que contiene la página actual, para marcarlo como activo. */
  readonly grupoActivo = signal<string | null>(null);
  private abiertoPorRaton: string | null = null;

  constructor() {
    // En SSR/prerender no se consulta una API relativa. El navegador sí carga
    // la configuración persistente tras la hidratación.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.menuPublico.publico().subscribe({
        next: items => { this.navegacion.set(construirMenu(items)); this.actualizarActivo(this.router.url); },
        error: () => this.navegacion.set(MENU_INICIAL)
      });
    }
    this.actualizarActivo(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(e => {
        this.menuAbierto.set(false);
        this.grupoAbierto.set(null);
        this.abiertoPorRaton = null;
        this.actualizarActivo((e as NavigationEnd).urlAfterRedirects);
      });
  }

  alternarMenu(): void {
    this.menuAbierto.update(v => !v);
    if (!this.menuAbierto()) this.grupoAbierto.set(null);
  }

  alternarGrupo(grupo: GrupoNav): void {
    // Si el ratón acaba de abrirlo, el clic lo deja abierto en lugar de cerrarlo.
    if (this.abiertoPorRaton === grupo.texto) {
      this.abiertoPorRaton = null;
      return;
    }
    this.grupoAbierto.update(g => (g === grupo.texto ? null : grupo.texto));
  }

  /** En escritorio con ratón, pasar por encima abre el submenú; salir lo cierra. */
  alPasar(grupo: GrupoNav, dentro: boolean): void {
    if (typeof matchMedia === 'undefined' || !matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;
    if (dentro) {
      if (this.grupoAbierto() !== grupo.texto) this.abiertoPorRaton = grupo.texto;
      this.grupoAbierto.set(grupo.texto);
    } else {
      this.abiertoPorRaton = null;
      if (this.grupoAbierto() === grupo.texto) this.grupoAbierto.set(null);
    }
  }

  idGrupo(e: ElementoNav): string { return 'submenu-' + e.texto.toLowerCase(); }
  comoGrupo(e: ElementoNav): GrupoNav { return e as GrupoNav; }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.grupoAbierto() || this.menuAbierto()) {
      this.grupoAbierto.set(null);
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  clicFuera(evento: MouseEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) this.grupoAbierto.set(null);
  }

  private actualizarActivo(url: string): void {
    const path = url.split(/[?#]/)[0];
    const grupo = this.navegacion().filter(esGrupo).find(g => path === g.base || path.startsWith(g.base + '/'));
    this.grupoActivo.set(grupo?.texto ?? null);
  }
}
