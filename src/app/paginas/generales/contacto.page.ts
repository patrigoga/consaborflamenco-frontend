import { Component } from '@angular/core';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-contacto',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <csf-en-preparacion titulo="Canales de contacto en preparación" texto="Muy pronto publicaremos aquí los canales de contacto de ConSaborFlamenco." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class ContactoPage {
  readonly seccion = SECCIONES.contacto;
  readonly enlaces = [];
}
