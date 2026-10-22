import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECCIONES } from '../../navegacion';

@Component({
  selector: 'csf-pagina-no-encontrada',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="pag-404" aria-labelledby="titulo-404">
      <p class="pag-404__codigo" aria-hidden="true">404</p>
      <h1 id="titulo-404" class="pag-404__titulo">Página no encontrada</h1>
      <p>La dirección no existe o ha cambiado. Puedes volver a la portada o ir a una de estas secciones:</p>
      <ul class="pag-404__enlaces">
        <li><a routerLink="/" class="gold-btn">Ir a la portada</a></li>
        @for (s of sugeridas; track s.ruta) { <li><a [routerLink]="s.ruta">{{ s.menu }}</a></li> }
      </ul>
    </section>
  `
})
export class NoEncontradaPage {
  readonly sugeridas = [SECCIONES.artistas, SECCIONES.historia, SECCIONES.eventos, SECCIONES.contacto];
}
