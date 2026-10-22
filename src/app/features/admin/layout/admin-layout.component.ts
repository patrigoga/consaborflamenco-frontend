import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { AvisosService } from '../core/avisos.service';

@Component({
  selector: 'adm-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="adm-saltar" href="#adm-contenido">Saltar al contenido</a>
    <div class="adm-marco" [class.menu-abierto]="menuAbierto()">
      <header class="adm-barra">
        <button type="button" class="adm-barra__menu" (click)="menuAbierto.set(!menuAbierto())"
                [attr.aria-expanded]="menuAbierto()" aria-controls="adm-nav">
          <span class="adm-hamburguesa" aria-hidden="true"></span><span class="adm-oculto">Menú</span>
        </button>
        <a routerLink="/admin" class="adm-marca">Con<span>Sabor</span>Flamenco</a>
      </header>

      <nav id="adm-nav" class="adm-lateral" aria-label="Panel de administración">
        <a routerLink="/admin" class="adm-marca adm-lateral__marca">Con<span>Sabor</span>Flamenco</a>
        <p class="adm-lateral__sub">Panel de administración</p>
        <ul class="adm-nav">
          <li><a routerLink="/admin" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }">Inicio</a></li>
          <li><a routerLink="/admin/artistas" routerLinkActive="activo">Artistas</a></li>
          <li><a routerLink="/admin/destacados" routerLinkActive="activo">Destacados</a></li>
          @if (auth.esPrincipal()) {
            <li><a routerLink="/admin/cuentas" routerLinkActive="activo">Cuentas de acceso</a></li>
          }
        </ul>
        <a routerLink="/admin/artistas/nuevo" class="adm-btn adm-btn--oro adm-lateral__nuevo">Añadir artista</a>

        <div class="adm-lateral__pie">
          @if (auth.sesion(); as s) {
            <a routerLink="/admin/mi-cuenta" routerLinkActive="activo" class="adm-yo">
              <span class="adm-yo__inicial" aria-hidden="true">{{ s.nombre.charAt(0) }}</span>
              <span class="adm-yo__datos"><strong>{{ s.nombre }}</strong><small>{{ s.principal ? 'Administración principal' : 'Administración' }}</small></span>
            </a>
          }
          <a href="/" class="adm-lateral__web" target="_blank" rel="noopener">Ver la web pública</a>
          <button type="button" class="adm-lateral__salir" (click)="salir()">Cerrar sesión</button>
        </div>
      </nav>
      <div class="adm-velo" (click)="menuAbierto.set(false)" aria-hidden="true"></div>

      <main id="adm-contenido" class="adm-contenido" tabindex="-1">
        <router-outlet />
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  readonly menuAbierto = signal(false);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuAbierto.set(false));
  }

  salir(): void {
    this.auth.logout().subscribe(() => {
      this.avisos.ok('Sesión cerrada.');
      this.router.navigate(['/admin/login']);
    });
  }
}
