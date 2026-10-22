import { Component } from '@angular/core';
import { SECCIONES, FLAMENCO } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-llavesdeoro',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Contenido en preparación" texto="Estamos documentando la historia de las Llaves de Oro y de quienes las han recibido." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class LlavesDeOroPage {
  readonly seccion = SECCIONES.llaves;
  readonly grupo = FLAMENCO;
  readonly enlaces = [{ texto: 'Historia del flamenco', ruta: SECCIONES.historia.ruta }];
}
