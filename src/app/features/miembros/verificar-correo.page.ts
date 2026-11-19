import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

@Component({
  selector: 'csf-verificar-correo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="verificacion">
      <h1>Verificación de correo electrónico</h1>
      @if (procesando()) {
        <p role="status">Comprobando tu enlace de confirmación…</p>
      } @else if (correcto()) {
        <p role="status">Tu nueva dirección de correo ha sido verificada. Ya puedes iniciar sesión con ella.</p>
        <a routerLink="/acceso">Acceder como miembro</a>
      } @else {
        <p role="alert">{{ error() || 'El enlace no es válido.' }}</p>
        <a routerLink="/acceso">Ir al acceso de miembros</a>
      }
    </main>
  `,
  styles: [`
    .verificacion{max-width:650px;margin:64px auto;padding:25px;min-height:280px}
    h1{font-size:clamp(1.7rem,4vw,2.5rem)}
    a{text-decoration:underline}
  `]
})
export class VerificarCorreoPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  readonly procesando = signal(true);
  readonly correcto = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const token = this.ruta.snapshot.queryParamMap.get('token');
    this.router.navigate([], { relativeTo: this.ruta, queryParams: {}, replaceUrl: true });
    if (!token) {
      this.procesando.set(false);
      this.error.set('El enlace no contiene un token de verificación.');
      return;
    }
    this.http.get<void>('/api/v1/miembros/auth/csrf').pipe(
      switchMap(() => this.http.post<void>('/api/v1/miembros/verificar-email', { token }))
    ).subscribe({
      next: () => { this.procesando.set(false); this.correcto.set(true); },
      error: () => {
        this.procesando.set(false);
        this.error.set('El enlace ha caducado, ya se ha utilizado o no se ha podido verificar.');
      }
    });
  }
}
