import { Component } from '@angular/core';
import { SECCIONES, REVISTA } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-academias',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Aún no hay academias publicadas" texto="Muy pronto podrás consultar aquí academias y escuelas de flamenco por provincia." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class AcademiasPage {
  readonly seccion = SECCIONES.academias;
  readonly grupo = REVISTA;
  readonly enlaces = [{ texto: 'Hazte miembro y da a conocer tu academia', ruta: SECCIONES.membresias.ruta }];
}
