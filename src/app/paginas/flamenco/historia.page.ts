import { Component } from '@angular/core';
import { SECCIONES, FLAMENCO } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-historia',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Artículos en preparación" texto="Estamos preparando los primeros artículos sobre la historia del flamenco." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class HistoriaPage {
  readonly seccion = SECCIONES.historia;
  readonly grupo = FLAMENCO;
  readonly enlaces = [{ texto: 'Los palos del flamenco', ruta: SECCIONES.palos.ruta }, { texto: 'Llaves de Oro', ruta: SECCIONES.llaves.ruta }];
}
