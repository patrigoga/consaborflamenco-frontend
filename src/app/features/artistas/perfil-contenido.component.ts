import { Component, Input, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PerfilArtista, enlaceSeguro, idYoutube, imagenSegura } from './perfil-artista.model';

@Component({
  selector: 'csf-perfil-contenido', standalone: true, imports: [RouterLink, DatePipe],
  templateUrl: './perfil-contenido.component.html', styleUrl: './perfil-contenido.component.css'
})
export class PerfilContenidoComponent {
  @Input({ required: true }) perfil!: PerfilArtista;
  @Input() muestra = false;
  readonly enlaceSeguro = enlaceSeguro;
  readonly imagenSegura = imagenSegura;
  readonly idYoutube = idYoutube;
  private readonly sanitizer = inject(DomSanitizer);
  readonly reproductores = new Map<string, SafeResourceUrl>();

  reproducir(url: string): void {
    const id = idYoutube(url);
    // La única parte variable es un identificador validado, nunca una URL libre.
    if (id) this.reproductores.set(id, this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`));
  }
}
