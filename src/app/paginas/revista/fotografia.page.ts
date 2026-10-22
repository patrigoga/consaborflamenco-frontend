import { Component } from '@angular/core';
import { SECCIONES, REVISTA } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-fotografia',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Aún no hay trabajos publicados" texto="Todavía no hay trabajos de fotografía flamenca publicados." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class FotografiaPage {
  readonly seccion = SECCIONES.fotografia;
  readonly grupo = REVISTA;
  readonly enlaces = [{ texto: 'Ver artistas', ruta: SECCIONES.artistas.ruta }];
}
