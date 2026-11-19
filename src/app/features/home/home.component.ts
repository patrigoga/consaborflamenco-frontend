import { Component, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MEMBRESIA, SECCIONES } from '../../navegacion';
import { Artista, ArtistasService } from '../../artistas.service';
import { PortadaDemo, FuentesPortadaService } from './fuentes-portada';
import { HttpClient } from '@angular/common/http';
import { Protagonista, ProtagonistasService } from './protagonistas.service';
import { EventoPublico, EventosService } from '../eventos/eventos.service';

@Component({selector:'app-home',standalone:true,imports:[CommonModule, RouterLink],templateUrl:'./home.component.html',styleUrl:'./home.component.css'})
export class HomeComponent {
  readonly rutas = {
    artistas: SECCIONES.artistas.ruta, eventos: SECCIONES.eventos.ruta, academias: SECCIONES.academias.ruta,
    historia: SECCIONES.historia.ruta, palos: SECCIONES.palos.ruta, llaves: SECCIONES.llaves.ruta, membresias: MEMBRESIA.ruta
  };
  readonly artistas = signal<Artista[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly fuentes = inject(FuentesPortadaService);
  readonly demo = signal<PortadaDemo | null>(null);
  readonly protagonistas = signal<Protagonista[]>([]);
  readonly eventos = signal<EventoPublico[]>([]);
  readonly eventosCargando = signal(true);
  readonly eventosError = signal(false);
  readonly slideActivo = signal(0);
  private readonly protagonistasApi = inject(ProtagonistasService);
  private readonly eventosApi = inject(EventosService);
  siguienteSlide(): void { const n = this.protagonistas().length; if (n) this.slideActivo.set((this.slideActivo()+1)%n); }
  anteriorSlide(): void { const n = this.protagonistas().length; if (n) this.slideActivo.set((this.slideActivo()+n-1)%n); }
  private readonly http = inject(HttpClient);
  private readonly artistasService = inject(ArtistasService);

  constructor() {
    // No hacemos peticiones a la API durante el prerender/SSR.
    // La consulta se ejecuta solo en el navegador tras el renderizado.
    afterNextRender(() => {
      this.fuentes.cargar().subscribe({ error: () => this.fuentes.error.set('No se pudo cargar la configuración pública.') });
      this.protagonistasApi.listar().subscribe({next: items => {this.protagonistas.set(items);this.slideActivo.set(0);}, error:()=>this.protagonistas.set([])});
      this.http.get<PortadaDemo>('/data/portada-demo.json').subscribe({next: data => this.demo.set(data), error: () => this.demo.set(null)});
      this.eventosApi.proximos(0, 3).subscribe({
        next: pagina => { this.eventos.set(pagina.content); this.eventosCargando.set(false); },
        error: () => { this.eventosError.set(true); this.eventosCargando.set(false); }
      });
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
