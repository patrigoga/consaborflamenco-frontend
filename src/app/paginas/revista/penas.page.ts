import { Component } from '@angular/core';
import { SECCIONES, REVISTA } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-penas',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Aún no hay peñas publicadas" texto="Todavía no hay peñas flamencas publicadas." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class PenasPage {
  readonly seccion = SECCIONES.penas;
  readonly grupo = REVISTA;
  readonly enlaces = [{ texto: 'Ver la agenda de eventos', ruta: SECCIONES.eventos.ruta }];
}
