import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PerfilContenidoComponent } from './perfil-contenido.component';
import { FichaArtista } from './perfil-artista.resolver';
import { perfilDesdeArtista } from './perfil-artista.model';

@Component({
  selector: 'csf-perfil-artista', standalone: true, imports: [PerfilContenidoComponent, RouterLink],
  template: `
    @if (ficha(); as datos) {
      @if (datos.artista; as artista) {
        <csf-perfil-contenido [perfil]="perfilDesdeArtista(artista)" />
      } @else {
        <section class="ficha-estado" aria-labelledby="ficha-estado-titulo">
          <p class="eyebrow">COMUNIDAD FLAMENCA</p>
          <h1 id="ficha-estado-titulo">{{ datos.estado === 'no-encontrado' ? 'Perfil no disponible' : 'No podemos cargar este perfil' }}</h1>
          <p>{{ datos.estado === 'no-encontrado' ? 'Este artista no está publicado o la dirección ha cambiado.' : 'Inténtalo de nuevo dentro de unos momentos.' }}</p>
          <a routerLink="/revista/artistas">Volver a artistas →</a>
        </section>
      }
    }
  `,
  styles: [`:host{display:block;background:#100f0e;color:#f5ead8}.ficha-estado{max-width:760px;margin:auto;padding:80px 24px 100px;min-height:420px}.ficha-estado h1{font:400 clamp(32px,5vw,50px) Georgia,serif}.ficha-estado p{color:#ccbaa0;line-height:1.7}.ficha-estado a{display:inline-flex;align-items:center;min-height:48px;color:#edc786}`]
})
export class PerfilArtistaPage {
  readonly ficha = toSignal(inject(ActivatedRoute).data.pipe(map(data => data['ficha'] as FichaArtista)));
  readonly perfilDesdeArtista = perfilDesdeArtista;
}
