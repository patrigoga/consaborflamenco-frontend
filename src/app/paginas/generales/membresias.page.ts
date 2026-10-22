import { Component } from '@angular/core';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EnPreparacionComponent } from '../../compartido/en-preparacion.component';

@Component({
  selector: 'csf-pagina-membresias',
  standalone: true,
  imports: [PaginaSeccionComponent, EnPreparacionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <csf-en-preparacion titulo="Muy pronto" texto="Muy pronto podrás publicar tu perfil y tu actividad como profesional del flamenco." [enlaces]="enlaces" />
    </csf-pagina-seccion>
  `
})
export class MembresiasPage {
  readonly seccion = SECCIONES.membresias;
  readonly enlaces = [{ texto: 'Ver artistas', ruta: SECCIONES.artistas.ruta }, { texto: 'Ver academias', ruta: SECCIONES.academias.ruta }];
}
