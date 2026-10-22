import { Component } from '@angular/core';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-servicios',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <csf-en-preparacion titulo="Información en preparación" texto="Estamos preparando la información de los servicios para artistas, academias y entidades del flamenco." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class ServiciosPage {
  readonly seccion = SECCIONES.servicios;
  readonly enlaces = [{ texto: 'Hazte miembro', ruta: SECCIONES.membresias.ruta }, { texto: 'Contacto', ruta: SECCIONES.contacto.ruta }];
}
