import { Component } from '@angular/core';
import { SECCIONES, REVISTA } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-moda',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Aún no hay firmas publicadas" texto="Todavía no hay diseñadores ni firmas de moda flamenca publicados." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class ModaPage {
  readonly seccion = SECCIONES.moda;
  readonly grupo = REVISTA;
  readonly enlaces = [{ texto: 'Hazte miembro', ruta: SECCIONES.membresias.ruta }];
}
