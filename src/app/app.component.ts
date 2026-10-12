import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Artista, ArtistasService } from './artistas.service';
@Component({selector:'app-root',standalone:true,imports:[CommonModule],templateUrl:'./app.component.html'})
export class AppComponent {
 readonly artistas = signal<Artista[]>([]);
 readonly cargando = signal(true);
 readonly error = signal(false);
 constructor() {
   inject(ArtistasService).listar().subscribe({
     next: pagina => {this.artistas.set(pagina.content);this.cargando.set(false);},
     error: () => {this.error.set(true);this.cargando.set(false);}
   });
 }
}
