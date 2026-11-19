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
    .compartir-evento { margin-top:32px; padding:20px; border:1px solid #d6d6d6; border-radius:12px; }
    .compartir-acciones { display:flex; flex-wrap:wrap; gap:10px; }
    .compartir-acciones a, .compartir-acciones button { display:inline-flex; align-items:center; padding:10px 14px; border:1px solid currentColor; border-radius:8px; background:transparent; color:inherit; font:inherit; cursor:pointer; text-decoration:none; }
    .compartir-acciones a:focus-visible, .compartir-acciones button:focus-visible { outline:3px solid currentColor; outline-offset:3px; }
    .compartir-ayuda { font-size:.9rem; }
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
          <section class="compartir-evento" aria-labelledby="compartir-titulo">
            <h2 id="compartir-titulo">Comparte este evento</h2>
            <div class="compartir-acciones">
              <a [href]="facebookUrl(e)" target="_blank" rel="noopener noreferrer" aria-label="Compartir evento en Facebook">Facebook</a>
              <a [href]="whatsappUrl(e)" target="_blank" rel="noopener noreferrer" aria-label="Compartir evento en WhatsApp">WhatsApp</a>
              <a [href]="telegramUrl(e)" target="_blank" rel="noopener noreferrer" aria-label="Compartir evento en Telegram">Telegram</a>
              <button type="button" (click)="compartirDispositivo(e)">Instagram / TikTok / otras apps</button>
              <button type="button" (click)="copiarEnlace(e)">Copiar enlace</button>
            </div>
            <p class="compartir-ayuda">Instagram y TikTok no permiten compartir directamente un evento web mediante un enlace de publicación universal. Puedes usar el menú de compartir de tu dispositivo o copiar el enlace para preparar tu publicación.</p>
            @if (avisoCompartir()) { <p role="status">{{ avisoCompartir() }}</p> }
          </section>
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
  readonly avisoCompartir = signal<string | null>(null);

  private urlEvento(): string {
    // En SSR no se accede al objeto window; la acción de compartir solo se ejecuta en navegador.
    const slug = this.ruta.snapshot.paramMap.get('slug') || '';
    return new URL('/eventos/' + encodeURIComponent(slug), window.location.origin).href;
  }

  facebookUrl(e: EventoPublico): string {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(this.urlEvento());
  }

  whatsappUrl(e: EventoPublico): string {
    return 'https://api.whatsapp.com/send?text=' + encodeURIComponent(e.titulo + ' — ' + this.urlEvento());
  }

  telegramUrl(e: EventoPublico): string {
    return 'https://t.me/share/url?url=' + encodeURIComponent(this.urlEvento())
      + '&text=' + encodeURIComponent(e.titulo);
  }

  async copiarEnlace(e: EventoPublico): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.urlEvento());
      this.avisoCompartir.set('Enlace copiado. Puedes pegarlo en tus redes sociales.');
    } catch {
      this.avisoCompartir.set('No se pudo copiar automáticamente. Copia la dirección desde tu navegador.');
    }
  }

  async compartirDispositivo(e: EventoPublico): Promise<void> {
    if (!navigator.share) {
      await this.copiarEnlace(e);
      return;
    }
    try {
      await navigator.share({ title: e.titulo, text: e.titulo, url: this.urlEvento() });
      this.avisoCompartir.set(null);
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        this.avisoCompartir.set('No se pudo abrir el menú para compartir.');
      }
    }
  }
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
