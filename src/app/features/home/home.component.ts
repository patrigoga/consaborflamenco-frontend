import { Component, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Artista, ArtistasService } from '../../artistas.service';

@Component({selector:'app-home',standalone:true,imports:[CommonModule],templateUrl:'./home.component.html'})
export class HomeComponent {
  readonly artistas = signal<Artista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);
  private readonly artistasService = inject(ArtistasService);

  constructor() {
    // No hacemos peticiones a la API durante el prerender/SSR.
    // La consulta se ejecuta solo en el navegador tras el renderizado.
    afterNextRender(() => {
      this.artistasService.listar().subscribe({
        next: pagina => {
          this.artistas.set(pagina.content);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        }
      });
    });
  }
}
