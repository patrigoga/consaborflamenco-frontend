import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FLAMENCO, MEMBRESIA, REVISTA, SECCIONES } from '../navegacion';

@Component({
  selector: 'csf-pie',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="pie">
      <div class="pie__dentro">
        <div class="pie__marca">
          <a routerLink="/" class="pie__logo">Con<span>Sabor</span>Flamenco</a>
          <p>Flamenco, cultura y comunidad.</p>
          <a [routerLink]="membresia.ruta" class="pie__miembro">{{ membresia.texto }}</a>
        </div>
        <nav class="pie__columnas" aria-label="Mapa de la web">
          <div>
            <h2>{{ flamenco.texto }}</h2>
            <ul>@for (h of flamenco.hijos; track h.ruta) { <li><a [routerLink]="h.ruta">{{ h.texto }}</a></li> }</ul>
          </div>
          <div>
            <h2>{{ revista.texto }}</h2>
            <ul>@for (h of revista.hijos; track h.ruta) { <li><a [routerLink]="h.ruta">{{ h.texto }}</a></li> }</ul>
          </div>
          <div>
            <h2>ConSaborFlamenco</h2>
            <ul>@for (h of otros; track h.ruta) { <li><a [routerLink]="h.ruta">{{ h.menu }}</a></li> }</ul>
          </div>
        </nav>
      </div>
      <p class="pie__legal">© {{ anio }} ConSaborFlamenco</p>
    </footer>
  `,
  styles: [`
    :host { display: block; }
    .pie { background: #111; color: #cfc8bc; padding: 56px 0 28px; }
    .pie__dentro { max-width: 1140px; width: calc(100% - 2 * max(20px, 3vw)); margin: 0 auto; display: grid; grid-template-columns: minmax(220px, 1fr) 2.2fr; gap: 40px; }
    .pie__logo { font-family: Georgia, serif; font-weight: bold; font-size: 22px; color: #fff; text-decoration: none; }
    .pie__logo span { color: #dfb66a; }
    .pie__marca p { margin: 10px 0 20px; color: #9d958a; font-size: 14px; }
    .pie__miembro { display: inline-block; border: 1px solid #cda15c; color: #fff; padding: 9px 16px; border-radius: 4px; font-size: 13.5px; text-decoration: none; }
    .pie__miembro:hover { background: #cda15c; color: #1c1b19; }
    .pie__columnas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; }
    .pie h2 { font-family: Georgia, serif; font-weight: normal; font-size: 17px; color: #fff; margin: 0 0 12px; }
    .pie ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .pie ul a { color: #b5ada1; font-size: 14px; text-decoration: none; }
    .pie ul a:hover { color: #dfb66a; }
    .pie a:focus-visible { outline: 2px solid #cda15c; outline-offset: 2px; }
    .pie__legal { max-width: 1140px; width: calc(100% - 2 * max(20px, 3vw)); margin: 44px auto 0; padding-top: 20px; border-top: 1px solid #2a2622; font-size: 12.5px; color: #7f786e; }
    @media (max-width: 860px) { .pie__dentro { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .pie__columnas { grid-template-columns: 1fr 1fr; } }
  `]
})
export class PieComponent {
  readonly flamenco = FLAMENCO;
  readonly revista = REVISTA;
  readonly membresia = MEMBRESIA;
  readonly otros = [SECCIONES.eventos, SECCIONES.servicios, SECCIONES.contacto];
  readonly anio = new Date().getFullYear();
}
