import { Component, computed, input } from '@angular/core';
import { ArtistaAdmin } from '../core/modelos';

@Component({
  selector: 'adm-estado-artista',
  standalone: true,
  template: `
    <span class="adm-estado" [attr.data-estado]="estado().clave">{{ estado().texto }}</span>
    @if (artista().destacado) { <span class="adm-estado adm-estado--destacado">Destacado</span> }
  `
})
export class EstadoArtistaComponent {
  readonly artista = input.required<Pick<ArtistaAdmin, 'publicado' | 'archivado' | 'destacado'>>();
  readonly estado = computed(() => {
    const a = this.artista();
    if (a.archivado) return { clave: 'archivado', texto: 'Archivado' };
    if (a.publicado) return { clave: 'publicado', texto: 'Publicado' };
    return { clave: 'borrador', texto: 'Borrador' };
  });
}
