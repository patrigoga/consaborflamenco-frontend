import { Component } from '@angular/core';
import { SECCIONES, REVISTA } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-tablaos',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Aún no hay tablaos publicados" texto="Todavía no hay tablaos publicados." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class TablaosPage {
  readonly seccion = SECCIONES.tablaos;
  readonly grupo = REVISTA;
  readonly enlaces = [{ texto: 'Ver la agenda de eventos', ruta: SECCIONES.eventos.ruta }];
}
