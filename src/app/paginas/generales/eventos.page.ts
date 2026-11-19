import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';
import { EventoPublico, EventosService, PaginaEventos } from '../../features/eventos/eventos.service';

@Component({
  selector: 'csf-pagina-eventos',
  standalone: true,
  imports: [PaginaSeccionComponent, RouterLink, DatePipe],
  styles: [`
    .agenda-lista { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:24px; margin:28px 0; }
    .agenda-tarjeta { border:1px solid #ddd5c8; border-radius:8px; overflow:hidden; background:#fff; }
    .agenda-cartel { display:block; width:100%; height:210px; object-fit:cover; }
    .agenda-contenido { padding:20px; display:grid; gap:10px; }
    .agenda-contenido h2 { margin:0; font-size:21px; }
    .agenda-contenido p { margin:0; }
    .agenda-enlace { color:#7c4920; text-decoration:underline; }
    .agenda-paginas { display:flex; align-items:center; justify-content:center; gap:16px; margin:24px 0; }
    .agenda-paginas button { border:1px solid currentColor; border-radius:5px; background:transparent; padding:8px 14px; cursor:pointer; }
    .agenda-paginas button:disabled { opacity:.4; cursor:not-allowed; }
  `],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <p>Descubre los próximos espectáculos, festivales y encuentros flamencos publicados en ConSaborFlamenco.</p>
      @if (cargando()) {
        <p role="status">Cargando agenda…</p>
      } @else if (error()) {
        <p role="alert">{{ error() }} <button type="button" (click)="cargar(0)">Reintentar</button></p>
      } @else {
        @if (pagina(); as p) {
        @if (!p.content.length) {
          <p>Por el momento no hay próximos eventos publicados. La agenda se actualizará con los eventos verificados.</p>
        } @else {
          <div class="agenda-lista">
            @for (e of p.content; track e.id) {
              <article class="agenda-tarjeta">
                @if (e.cartelUrl) {
                  <img class="agenda-cartel" [src]="e.cartelUrl" [alt]="'Cartel de ' + e.titulo" loading="lazy">
                }
                <div class="agenda-contenido">
                  <h2><a class="agenda-enlace" [routerLink]="['/eventos',e.slug]">{{ e.titulo }}</a></h2>
                  <p><strong>{{ e.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</strong></p>
                  <p>{{ e.lugar || 'Lugar por confirmar' }}
                    @if (e.localidad) { · {{ e.localidad }} }
                    @if (e.provincia) { ({{ e.provincia }}) }
                  </p>
                  @if (e.gratuito === true) { <p>Entrada gratuita</p> }
                  @else if (e.precioCentimos !== null) {
                    <p>Desde {{ e.precioCentimos / 100 }} €</p>
                  }
                  <a class="agenda-enlace" [routerLink]="['/eventos',e.slug]">Ver detalles</a>
                </div>
              </article>
            }
          </div>
          @if (p.totalPages > 1) {
            <nav class="agenda-paginas" aria-label="Páginas de eventos">
              <button type="button" [disabled]="p.number === 0" (click)="cargar(p.number-1)">Anterior</button>
              <span>Página {{ p.number+1 }} de {{ p.totalPages }}</span>
              <button type="button" [disabled]="p.number+1 >= p.totalPages" (click)="cargar(p.number+1)">Siguiente</button>
            </nav>
          }
        }
        }
      }
    </csf-pagina-seccion>
  `
})
export class EventosPage implements OnInit {
  readonly seccion = SECCIONES.eventos;
  private readonly servicio = inject(EventosService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly pagina = signal<PaginaEventos | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  ngOnInit(): void {
    // La ruta /eventos se prerenderiza sin API; el navegador consulta la agenda actual.
    if (isPlatformBrowser(this.platformId)) this.cargar(0);
    else this.cargando.set(false);
  }
  cargar(page: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.proximos(page).subscribe({
      next: datos => { this.pagina.set(datos); this.cargando.set(false); },
      error: () => { this.error.set('No hemos podido recuperar la agenda.'); this.cargando.set(false); }
    });
  }
}
