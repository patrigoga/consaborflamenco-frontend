import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MiembroAuthService } from './miembro-auth.service';

@Component({
  selector: 'csf-mi-cuenta',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="cuenta">
      <p class="etiqueta">ÁREA PRIVADA</p>
      <h1>Mi espacio en ConSaborFlamenco</h1>
      @if (cargando()) {
        <p role="status">Comprobando sesión…</p>
      } @else if (auth.sesion()) {
        <p>Bienvenido, <strong>{{ auth.sesion()!.nombre }}</strong>.</p>
        <p class="email">{{ auth.sesion()!.email }}</p>
        <section class="tarjetas">
          <article>
            <h2>Mi perfil</h2>
            <p>Añade tu imagen, nombre artístico, descripción breve y localidad.</p>
            <a routerLink="/mi-cuenta/perfil">Editar mi perfil</a>
          </article>
          <article>
            <h2>Mis eventos</h2>
            <p>Crea tus eventos, guarda borradores y envíalos a revisión.</p>
            <a routerLink="/mi-cuenta/eventos">Gestionar mis eventos</a>
          </article>
          <article>
            <h2>Publicaciones y difusión</h2>
            <p>Próximamente podrás compartir tus eventos en redes sociales desde aquí.</p>
          </article>
        </section>
        @if (error()) { <p role="alert">{{ error() }}</p> }
        <button type="button" [disabled]="saliendo()" (click)="salir()">Cerrar sesión</button>
      } @else {
        <p>Necesitas iniciar sesión para acceder a este espacio.</p>
        <a routerLink="/acceso">Acceder como miembro</a>
      }
    </main>
  `,
  styles: [`
    .cuenta{max-width:1050px;margin:42px auto 90px;padding:0 24px}
    h1{font-size:clamp(1.9rem,4vw,2.7rem)}
    .etiqueta{font-weight:700;color:#cba565;letter-spacing:.12em;font-size:.8rem}
    .email{opacity:.75}.tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:16px;margin:28px 0}
    article{border:1px solid #786d5d;padding:22px;border-radius:12px}
    article h2{font-size:1.25rem;margin-top:0}
    button{padding:12px 20px;background:#cba565;border:0;border-radius:6px;color:#17130e;font:inherit;cursor:pointer}
    a{text-decoration:underline}
  `]
})
export class MiCuentaPage implements OnInit {
  readonly auth = inject(MiembroAuthService);
  private readonly router = inject(Router);
  readonly cargando = signal(true);
  readonly saliendo = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.comprobar().subscribe({
      next: sesion => {
        this.cargando.set(false);
        if (!sesion) this.router.navigate(['/acceso']);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo comprobar tu sesión. Inténtalo de nuevo.');
      }
    });
  }

  salir(): void {
    this.saliendo.set(true);
    this.error.set(null);
    this.auth.salir().subscribe({
      next: () => this.router.navigateByUrl('/acceso'),
      error: () => {
        this.saliendo.set(false);
        this.error.set('No se ha podido cerrar la sesión. Vuelve a intentarlo.');
      }
    });
  }
}
