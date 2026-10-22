import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GrupoNav, Seccion } from '../navegacion';

/**
 * Encabezado común de las páginas de sección: migas, H1 único, entradilla y, si la sección
 * pertenece a un grupo (Flamenco, Revista), un submenú para moverse entre sus páginas.
 */
@Component({
  selector: 'csf-pagina-seccion',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="pag-cab">
      <div class="pag-cab__dentro">
        <nav class="pag-migas" aria-label="Estás en">
          <ol>
            <li><a routerLink="/">Inicio</a></li>
            @if (grupo(); as g) { <li><span>{{ g.texto }}</span></li> }
            <li aria-current="page">{{ seccion().menu }}</li>
          </ol>
        </nav>
        <h1 class="pag-cab__titulo">{{ seccion().h1 }}</h1>
        <p class="pag-cab__entradilla">{{ seccion().descripcion }}</p>
      </div>
    </header>
    @if (grupo(); as g) {
      <nav class="pag-sub" [attr.aria-label]="'Secciones de ' + g.texto">
        <ul>
          @for (h of g.hijos; track h.ruta) {
            <li><a [routerLink]="h.ruta" routerLinkActive="is-activo" ariaCurrentWhenActive="page">{{ h.texto }}</a></li>
          }
        </ul>
      </nav>
    }
    <div class="pag-cuerpo"><ng-content /></div>
  `
})
export class PaginaSeccionComponent {
  readonly seccion = input.required<Seccion>();
  readonly grupo = input<GrupoNav | null>(null);
}
