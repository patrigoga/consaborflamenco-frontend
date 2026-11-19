import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventoPublico, EventosService } from '../../features/eventos/eventos.service';

@Component({
  selector: 'csf-evento-detalle',
  standalone: true,
  imports: [DatePipe, RouterLink],
  styles: [`
    .detalle-evento { max-width:950px; margin:48px auto; padding:0 22px 72px; }
    .detalle-evento h1 { font-size:clamp(28px,4vw,50px); line-height:1.12; margin:20px 0; }
    .detalle-evento img { width:100%; max-height:520px; object-fit:contain; margin:20px 0; }
    .detalle-evento p { line-height:1.7; }
    .detalle-evento .texto { white-space:pre-wrap; }
    .detalle-evento a { text-decoration:underline; }
  `],
  template: `
    <main class="detalle-evento">
      <a routerLink="/eventos">Volver a Eventos</a>
      @if (cargando()) { <p role="status">Cargando evento…</p> }
      @else if (error()) { <p role="alert">{{ error() }}</p> }
      @else {
        @if (evento(); as e) {
        <article>
          <h1>{{ e.titulo }}</h1>
          <p><strong>{{ e.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</strong>
             @if (e.fechaFin) { — {{ e.fechaFin | date:'dd/MM/yyyy HH:mm' }} }
          </p>
          <p>Zona horaria: {{ e.zonaHoraria }}</p>
          @if (e.cartelUrl) { <img [src]="e.cartelUrl" [alt]="'Cartel de ' + e.titulo"> }
          <p><strong>Lugar:</strong> {{ e.lugar || 'Por confirmar' }}
            @if (e.localidad) { — {{ e.localidad }} }
            @if (e.provincia) { ({{ e.provincia }}) }
          </p>
          @if (e.direccion) { <p><strong>Dirección:</strong> {{ e.direccion }}</p> }
          @if (e.organizador) { <p><strong>Organiza:</strong> {{ e.organizador }}</p> }
          @if (e.descripcion) { <p class="texto">{{ e.descripcion }}</p> }
          @if (e.artistasTexto) {
            <section>
              <h2>Artistas participantes</h2>
              <p class="texto">{{ e.artistasTexto }}</p>
            </section>
          }
          @if (e.gratuito === true) { <p><strong>Entrada gratuita</strong></p> }
          @else if (e.precioCentimos !== null) { <p>Precio: {{ e.precioCentimos / 100 }} €</p> }
          @if (e.entradaUrl) {
            <p><a [href]="e.entradaUrl" target="_blank" rel="noopener noreferrer">Información y entradas</a></p>
          }
        </article>
        }
      }
    </main>
  `
})
export class EventoDetallePage implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly servicio = inject(EventosService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly evento = signal<EventoPublico | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  ngOnInit(): void {
    // No consultar URLs relativas desde el servidor SSR: el navegador resuelve la API bajo /api.
    if (!isPlatformBrowser(this.platformId)) { this.cargando.set(false); return; }
    const slug = this.ruta.snapshot.paramMap.get('slug');
    if (!slug) { this.error.set('Evento no encontrado.'); this.cargando.set(false); return; }
    this.servicio.porSlug(slug).subscribe({
      next: evento => { this.evento.set(evento); this.cargando.set(false); },
      error: () => { this.error.set('Este evento no está disponible.'); this.cargando.set(false); }
    });
  }
}
