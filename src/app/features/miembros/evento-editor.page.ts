import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MiembroAuthService } from './miembro-auth.service';
import { EventoMiembro, EventoMiembroDatos, MisEventosService } from './mis-eventos.service';

@Component({
  selector: 'csf-evento-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="editor">
      <a routerLink="/mi-cuenta/eventos" class="volver">← Mis eventos</a>
      <div class="cabecera">
        <p class="etiqueta">MI AGENDA FLAMENCA</p>
        <h1>{{ id() === null ? 'Crear evento' : 'Editar evento' }}</h1>
        <p>Completa los datos esenciales y guarda el borrador. Podrás enviarlo a revisión cuando esté listo.</p>
      </div>

      @if (cargando()) { <p role="status">Preparando el formulario…</p> }
      @else if (errorCarga()) {
        <p role="alert" class="error">{{ errorCarga() }}</p>
        <a routerLink="/mi-cuenta/eventos">Volver a mis eventos</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="tarjeta">
          <div class="campo">
            <label for="e-titulo">Título del evento *</label>
            <input id="e-titulo" formControlName="titulo" maxlength="200" placeholder="Ej. Festival flamenco de primavera">
          </div>
          <div class="dos">
            <div class="campo">
              <label for="e-tipo">Tipo de actividad</label>
              <select id="e-tipo" formControlName="tipo">
                @for (tipo of tipos; track tipo.valor) { <option [value]="tipo.valor">{{ tipo.etiqueta }}</option> }
              </select>
            </div>
            <div class="campo">
              <label for="e-inicio">Fecha y hora del evento *</label>
              <input id="e-inicio" type="datetime-local" formControlName="fechaInicio">
            </div>
          </div>
          <div class="dos">
            <div class="campo">
              <label for="e-fin">Fecha de finalización (opcional)</label>
              <input id="e-fin" type="datetime-local" formControlName="fechaFin">
            </div>
            <div class="campo">
              <label for="e-publicacion">Cuándo te gustaría publicarlo (opcional)</label>
              <input id="e-publicacion" type="datetime-local" formControlName="fechaPublicacionDeseada">
              <small>La publicación necesita aprobación administrativa. Si se programa, aparecerá en la fecha indicada.</small>
            </div>
          </div>
          <div class="campo">
            <label for="e-descripcion">Descripción (opcional)</label>
            <textarea id="e-descripcion" rows="4" formControlName="descripcion" maxlength="10000"
                      placeholder="¿Qué encontrará el público en este evento?"></textarea>
          </div>
          <div class="dos">
            <div class="campo">
              <label for="e-lugar">Lugar (opcional)</label>
              <input id="e-lugar" formControlName="lugar" maxlength="200" placeholder="Ej. Teatro Garnelo">
            </div>
            <div class="campo">
              <label for="e-localidad">Localidad (opcional)</label>
              <input id="e-localidad" formControlName="localidad" maxlength="120">
            </div>
          </div>
          <div class="dos">
            <div class="campo">
              <label for="e-provincia">Provincia (opcional)</label>
              <input id="e-provincia" formControlName="provincia" maxlength="100">
            </div>
            <div class="campo">
              <label for="e-cartel">Enlace HTTPS del cartel (opcional)</label>
              <input id="e-cartel" formControlName="cartelUrl" type="url" maxlength="1024"
                     placeholder="https://…">
            </div>
          </div>

          <details class="extra">
            <summary>Más información (opcional)</summary>
            <div class="detalles">
              <div class="campo"><label for="e-direccion">Dirección</label>
                <input id="e-direccion" formControlName="direccion" maxlength="255"></div>
              <div class="campo"><label for="e-organizador">Organizador</label>
                <input id="e-organizador" formControlName="organizador" maxlength="200"></div>
              <div class="campo"><label for="e-entradas">Enlace de entradas</label>
                <input id="e-entradas" type="url" formControlName="entradaUrl" maxlength="1024"></div>
              <div class="campo"><label for="e-artistas">Artistas anunciados en el cartel</label>
                <textarea id="e-artistas" rows="2" formControlName="artistasTexto" maxlength="5000"></textarea></div>
              <div class="dos">
                <div class="campo"><label for="e-fuente-nombre">Nombre de la fuente</label>
                  <input id="e-fuente-nombre" formControlName="fuenteNombre" maxlength="200"></div>
                <div class="campo"><label for="e-fuente-url">Enlace a la fuente</label>
                  <input id="e-fuente-url" type="url" formControlName="fuenteUrl" maxlength="1024"></div>
              </div>
            </div>
          </details>
          <p class="nota">El cartel se añade por enlace HTTPS en esta primera versión. El siguiente paso será habilitar su subida directa desde el dispositivo.</p>
          @if (errorGuardar()) { <p role="alert" class="error">{{ errorGuardar() }}</p> }
          <div class="acciones">
            <button type="submit" [disabled]="guardando() || form.invalid">{{ guardando() ? 'Guardando…' : 'Guardar borrador' }}</button>
            <a routerLink="/mi-cuenta/eventos">Cancelar</a>
          </div>
        </form>
      }
    </main>
  `,
  styles: [`
    .editor{max-width:910px;margin:38px auto 85px;padding:0 20px}
    .volver{text-decoration:underline}.cabecera{margin:24px 0}
    .etiqueta{font-weight:700;color:#ae814b;letter-spacing:.12em;font-size:.76rem}
    h1{font-size:clamp(2rem,4vw,2.7rem);margin:8px 0}
    .tarjeta{border:1px solid #cbbba4;border-radius:14px;padding:clamp(18px,4vw,34px);display:grid;gap:19px}
    .campo{display:flex;flex-direction:column;gap:8px;min-width:0}
    .campo label{font-weight:650;font-size:.91rem}
    .campo :is(input,select,textarea){width:100%;box-sizing:border-box;border:1px solid #b7a894;border-radius:8px;background:#fff;color:#251e16;padding:12px;font:inherit}
    .campo :is(input,select,textarea):focus-visible{outline:2px solid #aa7d43;outline-offset:2px}
    .campo small,.nota{color:#756a5d;font-size:.81rem;line-height:1.5}
    .dos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}
    .extra{border:1px solid #d3c5b2;border-radius:8px;padding:14px}
    .extra summary{cursor:pointer;font-weight:650}
    .detalles{display:grid;gap:17px;padding-top:17px}
    .acciones{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
    .acciones button{background:#cda261;border:0;border-radius:7px;color:#21170f;padding:12px 23px;font:inherit;font-weight:700;cursor:pointer}
    .acciones button:disabled{opacity:.55;cursor:not-allowed}.acciones a{text-decoration:underline}
    .error{color:#a32828}
    @media(max-width:620px){.dos{grid-template-columns:1fr}.tarjeta{padding:17px}}
  `]
})
export class EventoEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MisEventosService);
  private readonly auth = inject(MiembroAuthService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly id = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorCarga = signal('');
  readonly errorGuardar = signal('');
  readonly tipos = [
    {valor:'ESPECTACULO',etiqueta:'Espectáculo'}, {valor:'FESTIVAL',etiqueta:'Festival'},
    {valor:'RECITAL',etiqueta:'Recital'}, {valor:'CURSO',etiqueta:'Curso'},
    {valor:'TALLER',etiqueta:'Taller'}, {valor:'CONCURSO',etiqueta:'Concurso'},
    {valor:'ZAMBOMBA',etiqueta:'Zambombada'}, {valor:'CONFERENCIA',etiqueta:'Conferencia'},
    {valor:'ENCUENTRO',etiqueta:'Encuentro'}, {valor:'CONCIERTO',etiqueta:'Concierto'},
    {valor:'ACTIVIDAD',etiqueta:'Actividad'}, {valor:'OTRO',etiqueta:'Otro'}
  ];
  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    tipo: ['ESPECTACULO', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: [''],
    fechaPublicacionDeseada: [''],
    descripcion: ['', Validators.maxLength(10000)],
    lugar: ['', Validators.maxLength(200)],
    localidad: ['', Validators.maxLength(120)],
    provincia: ['', Validators.maxLength(100)],
    cartelUrl: ['', Validators.maxLength(1024)],
    direccion: ['', Validators.maxLength(255)],
    organizador: ['', Validators.maxLength(200)],
    entradaUrl: ['', Validators.maxLength(1024)],
    artistasTexto: ['', Validators.maxLength(5000)],
    fuenteNombre: ['', Validators.maxLength(200)],
    fuenteUrl: ['', Validators.maxLength(1024)]
  });

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');
    if (id !== null) {
      const parsed = Number(id);
      if (!Number.isSafeInteger(parsed) || parsed < 1) {
        this.errorCarga.set('El evento solicitado no es válido.');
        this.cargando.set(false);
        return;
      }
      this.id.set(parsed);
    }
    this.auth.comprobar().subscribe({
      next: sesion => {
        if (!sesion) { this.router.navigateByUrl('/acceso'); return; }
        if (this.id() === null) { this.cargando.set(false); return; }
        this.api.detalle(this.id()!).subscribe({
          next: e => {
            if (!e.miembroBorrador && e.estadoRevision !== 'RECHAZADO') {
              this.errorCarga.set('Este evento está en revisión o publicado y no admite edición directa.');
            } else if (e.publicado || e.programacionAutorizada || e.archivado) {
              this.errorCarga.set('El evento no puede editarse en este estado.');
            } else this.rellenar(e);
            this.cargando.set(false);
          },
          error: () => { this.errorCarga.set('No se encontró un evento editable de tu cuenta.'); this.cargando.set(false); }
        });
      },
      error: () => { this.errorCarga.set('No se pudo validar tu sesión.'); this.cargando.set(false); }
    });
  }

  private rellenar(e: EventoMiembro): void {
    this.form.reset({
      titulo: e.titulo, tipo: e.tipo, fechaInicio: this.local(e.fechaInicio),
      fechaFin: this.local(e.fechaFin), fechaPublicacionDeseada: this.local(e.fechaPublicacionDeseada),
      descripcion: e.descripcion || '', lugar: e.lugar || '', localidad: e.localidad || '',
      provincia: e.provincia || '', cartelUrl: e.cartelUrl || '',
      direccion: e.direccion || '', organizador: e.organizador || '',
      entradaUrl: e.entradaUrl || '', artistasTexto: e.artistasTexto || '',
      fuenteNombre: e.fuenteNombre || '', fuenteUrl: e.fuenteUrl || ''
    });
  }
  private local(fecha: string | null): string {
    return fecha ? fecha.slice(0, 16) : '';
  }
  guardar(): void {
    if (this.guardando() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorGuardar.set('');
    const v = this.form.getRawValue();
    if (v.fechaFin && v.fechaFin < v.fechaInicio) {
      this.errorGuardar.set('La fecha final debe ser posterior a la inicial.');
      return;
    }
    if (v.fechaPublicacionDeseada && v.fechaPublicacionDeseada > v.fechaInicio) {
      this.errorGuardar.set('La fecha de publicación debe ser anterior al inicio del evento.');
      return;
    }
    const opt = (x: string) => x.trim() || null;
    const evento: EventoMiembroDatos = {
      titulo: v.titulo.trim(), descripcion: opt(v.descripcion), tipo: v.tipo,
      fechaInicio: v.fechaInicio, fechaFin: opt(v.fechaFin), zonaHoraria: 'Europe/Madrid',
      lugar: opt(v.lugar), localidad: opt(v.localidad), provincia: opt(v.provincia),
      cartelUrl: opt(v.cartelUrl), direccion: opt(v.direccion), organizador: opt(v.organizador),
      entradaUrl: opt(v.entradaUrl), artistasTexto: opt(v.artistasTexto),
      fuenteNombre: opt(v.fuenteNombre), fuenteUrl: opt(v.fuenteUrl),
      pais: 'España', gratuito: null, precioCentimos: null, artistaIds: [], slug: null
    };
    this.guardando.set(true);
    const pub = opt(v.fechaPublicacionDeseada);
    const id = this.id();
    const peticion = id === null ? this.api.crear(evento, pub) : this.api.editar(id, evento, pub);
    peticion.subscribe({
      next: () => this.router.navigateByUrl('/mi-cuenta/eventos'),
      error: err => {
        this.guardando.set(false);
        this.errorGuardar.set((err.error?.detail as string) || 'No se pudo guardar el evento. Comprueba los datos y tus permisos.');
      }
    });
  }
}
