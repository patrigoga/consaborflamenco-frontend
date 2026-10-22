import { Component } from '@angular/core';
import { SECCIONES, FLAMENCO } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-palos',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Contenido en preparación" texto="Muy pronto encontrarás aquí cada palo con su compás, su origen y su carácter." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class PalosPage {
  readonly seccion = SECCIONES.palos;
  readonly grupo = FLAMENCO;
  readonly enlaces = [{ texto: 'Historia del flamenco', ruta: SECCIONES.historia.ruta }];
}
