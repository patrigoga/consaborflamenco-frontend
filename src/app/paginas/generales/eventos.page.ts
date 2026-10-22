import { Component } from '@angular/core';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-eventos',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <csf-en-preparacion titulo="Aún no hay eventos en la agenda" texto="Publicaremos aquí los próximos eventos verificados: espectáculos, recitales y festivales." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class EventosPage {
  readonly seccion = SECCIONES.eventos;
  readonly enlaces = [{ texto: 'Ver festivales', ruta: SECCIONES.festivales.ruta }, { texto: 'Ver tablaos', ruta: SECCIONES.tablaos.ruta }];
}
