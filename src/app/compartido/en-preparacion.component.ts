import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface EnlaceSugerido { texto: string; ruta: string; }

/** Estado honesto para secciones sin contenido publicado todavía (no se inventan datos). */
@Component({
  selector: 'csf-en-preparacion',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="pag-vacio" [attr.aria-labelledby]="idTitulo">
      <h2 [id]="idTitulo" class="pag-vacio__titulo">{{ titulo() }}</h2>
      <p>{{ texto() }}</p>
      @if (enlaces().length) {
        <ul class="pag-vacio__enlaces">
          @for (e of enlaces(); track e.ruta) { <li><a [routerLink]="e.ruta">{{ e.texto }}</a></li> }
        </ul>
      }
    </section>
  `
})
export class EnPreparacionComponent {
  private static contador = 0;
  readonly titulo = input('Sección en preparación');
  readonly texto = input.required<string>();
  readonly enlaces = input<EnlaceSugerido[]>([]);
  readonly idTitulo = 'vacio-' + ++EnPreparacionComponent.contador;
}
