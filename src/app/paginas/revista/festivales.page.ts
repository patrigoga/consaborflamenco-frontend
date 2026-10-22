import { Component } from '@angular/core';
import { SECCIONES, REVISTA } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-festivales',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion" [grupo]="grupo">
      <csf-en-preparacion titulo="Aún no hay festivales publicados" texto="Todavía no hay festivales publicados. Cuando los haya, también aparecerán en la agenda." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class FestivalesPage {
  readonly seccion = SECCIONES.festivales;
  readonly grupo = REVISTA;
  readonly enlaces = [{ texto: 'Ver la agenda de eventos', ruta: SECCIONES.eventos.ruta }];
}
