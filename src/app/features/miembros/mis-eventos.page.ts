import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MiembroAuthService } from './miembro-auth.service';
import { EventoMiembro, MisEventosService } from './mis-eventos.service';

@Component({
  selector: 'csf-mis-eventos',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <main class="zona">
      <a routerLink="/mi-cuenta" class="volver">← Mi espacio</a>
      <header class="cabecera">
        <div>
          <p class="etiqueta">MI ACTIVIDAD</p>
          <h1>Mis eventos</h1>
          <p>Crea tus anuncios, prepara borradores y conoce el estado de revisión.</p>
        </div>
        <a class="nuevo" routerLink="/mi-cuenta/eventos/nuevo">+ Crear evento</a>
      </header>

      @if (cargando()) {
        <p role="status">Consultando tus eventos…</p>
      } @else if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
        <button type="button" (click)="cargar()">Reintentar</button>
      } @else {
        <section class="resumen" aria-label="Resumen de eventos">
          <div><strong>{{ misEventos().length }}</strong><span>Eventos</span></div>
          <div><strong>{{ borradores() }}</strong><span>Borradores</span></div>
          <div><strong>{{ pendientes() }}</strong><span>Pendientes</span></div>
          <div><strong>{{ publicados() }}</strong><span>Publicados</span></div>
        </section>
        @if (!misEventos().length) {
          <div class="vacio">
            <h2>Aún no has creado ningún evento</h2>
            <p>Comparte tus espectáculos, cursos y actividades con la comunidad flamenca.</p>
            <a class="nuevo" routerLink="/mi-cuenta/eventos/nuevo">Crear mi primer evento</a>
          </div>
        } @else {
          <section class="listado" aria-label="Listado de mis eventos">
            @for (e of misEventos(); track e.id) {
              <article class="evento">
                <div class="cartel">
                  @if (e.cartelUrl) { <img [src]="e.cartelUrl" alt=""> }
                  @else { <span aria-hidden="true">♫</span> }
                </div>
                <div class="datos">
                  <div class="titular"><h2>{{ e.titulo }}</h2><span class="estado">{{ etiquetaEstado(e) }}</span></div>
                  <p>{{ e.fechaInicio | date:'dd/MM/yyyy HH:mm' }} · {{ e.localidad || e.lugar || 'Lugar sin especificar' }}</p>
                  @if (e.fechaPublicacionDeseada) {
                    <p>Publicación solicitada: {{ e.fechaPublicacionDeseada | date:'dd/MM/yyyy HH:mm' }}</p>
                  }
                  <div class="acciones">
                    @if (editable(e)) {
                      <a [routerLink]="['/mi-cuenta/eventos', e.id, 'editar']">Editar</a>
                      @if (e.miembroBorrador) {
                        <button type="button" [disabled]="enviandoId() === e.id" (click)="enviar(e)">
                          {{ enviandoId() === e.id ? 'Enviando…' : 'Enviar a revisión' }}
                        </button>
                      }
                    }
                    @if (e.publicado) {
                      <a [routerLink]="['/eventos', e.slug]">Ver publicado</a>
                    }
                  </div>
                </div>
              </article>
            }
          </section>
        }
        @if (mensaje()) { <p role="status" class="mensaje">{{ mensaje() }}</p> }
      }
    </main>
  `,
  styles: [`
    .zona{max-width:1020px;padding:0 22px;margin:42px auto 85px}
    .volver{text-decoration:underline}
    .cabecera{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin:20px 0 27px}
    .etiqueta{font-size:.77rem;letter-spacing:.13em;color:#a87a40;font-weight:700}
    h1{font-size:clamp(2rem,4vw,2.8rem);margin:8px 0}
    .nuevo{display:inline-flex;align-items:center;border-radius:8px;background:#cda261;color:#20170e;padding:12px 18px;text-decoration:none;font-weight:700}
    .resumen{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:24px}
    .resumen>div{display:flex;flex-direction:column;gap:5px;padding:16px;border-radius:10px;border:1px solid #ccbdab}
    .resumen strong{font-size:1.8rem}.resumen span{font-size:.83rem}
    .listado{display:grid;gap:14px}
    .evento{display:flex;gap:18px;padding:15px;border:1px solid #c9bba9;border-radius:12px}
    .cartel{width:96px;height:122px;flex:none;display:grid;place-items:center;overflow:hidden;background:#e7d5b6;border-radius:8px;color:#45341d;font-size:2.2rem}
    .cartel img{width:100%;height:100%;object-fit:cover}
    .datos{flex:1;min-width:0}.titular{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
    .titular h2{font-size:1.12rem;margin:0}
    .estado{padding:5px 10px;background:#f1e8d8;color:#4a3823;border-radius:99px;font-size:.78rem;font-weight:700}
    .datos p{margin:8px 0;font-size:.9rem;opacity:.8}
    .acciones{display:flex;align-items:center;flex-wrap:wrap;gap:15px;margin-top:15px}
    .acciones a{text-decoration:underline}
    .acciones button{padding:8px 12px;background:#cda261;border:0;border-radius:6px;cursor:pointer}
    .acciones button:disabled{opacity:.6;cursor:wait}
    .vacio{text-align:center;border:1px dashed #bbaa95;border-radius:12px;padding:35px}
    .vacio h2{font-size:1.35rem}
    .vacio .nuevo{margin-top:10px}
    .mensaje{color:#27623d}.error{color:#a52828}
    @media(max-width:600px){.resumen{grid-template-columns:repeat(2,1fr)}.evento{gap:12px}.cartel{width:72px;height:94px}.estado{font-size:.71rem}}
  `]
})
export class MisEventosPage implements OnInit {
  private readonly api = inject(MisEventosService);
  private readonly auth = inject(MiembroAuthService);
  private readonly router = inject(Router);
  readonly misEventos = signal<EventoMiembro[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly enviandoId = signal<number | null>(null);
  readonly borradores = () => this.misEventos().filter(e => e.miembroBorrador).length;
  readonly pendientes = () => this.misEventos().filter(e => !e.miembroBorrador && e.estadoRevision === 'PENDIENTE').length;
  readonly publicados = () => this.misEventos().filter(e => e.publicado).length;

  ngOnInit(): void {
    this.auth.comprobar().subscribe({
      next: sesion => { if (!sesion) this.router.navigateByUrl('/acceso'); else this.cargar(); },
      error: () => { this.cargando.set(false); this.error.set('No se pudo comprobar la sesión.'); }
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.listar().subscribe({
      next: lista => { this.misEventos.set(lista); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set('No se pudieron cargar tus eventos.'); }
    });
  }
  editable(e: EventoMiembro): boolean {
    return !e.archivado && !e.publicado && !e.programacionAutorizada
      && (e.miembroBorrador || e.estadoRevision === 'RECHAZADO');
  }
  etiquetaEstado(e: EventoMiembro): string {
    if (e.archivado) return 'Archivado';
    if (e.miembroBorrador) return 'Borrador';
    if (e.publicado) return 'Publicado';
    if (e.estadoRevision === 'RECHAZADO') return 'Rechazado · editable';
    if (e.estadoRevision === 'APROBADO') return e.programacionAutorizada ? 'Programado' : 'Aprobado';
    return 'Pendiente de revisión';
  }
  enviar(e: EventoMiembro): void {
    if (this.enviandoId() !== null || !e.miembroBorrador) return;
    this.mensaje.set('');
    this.enviandoId.set(e.id);
    this.api.enviarRevision(e.id).subscribe({
      next: actualizado => {
        this.misEventos.update(xs => xs.map(x => x.id === e.id ? actualizado : x));
        this.enviandoId.set(null);
        this.mensaje.set('Tu evento ha sido enviado a revisión administrativa.');
      },
      error: () => {
        this.enviandoId.set(null);
        this.error.set('No se pudo enviar el evento. Comprueba tus permisos e inténtalo de nuevo.');
      }
    });
  }
}
