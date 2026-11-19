import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminApiService } from '../core/admin-api.service';
import { ArtistaAdmin } from '../core/modelos';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe } from '../core/errores';
import { ConCambiosPendientes } from '../core/guards';
import { AccionEvento, EventoAdmin, EventoPeticion, EventosApiService } from './eventos-api.service';

function nulo(s: string): string | null { return s.trim() || null; }
function fechaFormulario(s: string | null): string { return s?.slice(0, 16) ?? ''; }

@Component({
  selector: 'adm-evento-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <nav class="adm-migas" aria-label="Ruta"><a routerLink="/admin/eventos">Eventos</a></nav>
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">{{ evento()?.titulo || 'Nuevo evento' }}</h1>
        <p class="adm-subtitulo">Los eventos se guardan pendientes de aprobación y no aparecen en la agenda hasta que los publiques.</p>
      </div>
      <a routerLink="/admin/eventos" class="adm-btn adm-btn--quieto">Volver al listado</a>
    </header>

    @if (errorCarga()) { <p class="adm-alerta" role="alert">{{ errorCarga() }}</p> }
    @else {
      @if (evento()?.archivado) {
        <p class="adm-franja">Este evento está archivado. Restáuralo antes de editarlo.</p>
        <button type="button" class="adm-btn" (click)="accion('restaurar')">Restaurar</button>
      }
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate class="adm-ficha__datos">
        <div class="adm-campo">
          <label for="evento-titulo">Título *</label>
          <input id="evento-titulo" formControlName="titulo" maxlength="200" required>
          @if (form.controls.titulo.touched && form.controls.titulo.invalid) {
            <p class="adm-campo__error">Indica un título de al menos dos caracteres.</p>
          }
        </div>

        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-tipo">Tipo de evento</label>
            <select id="evento-tipo" formControlName="tipo">
              <option value="ESPECTACULO">Espectáculo</option>
              <option value="FESTIVAL">Festival</option>
              <option value="RECITAL">Recital</option>
              <option value="ACTIVIDAD">Actividad cultural</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div class="adm-campo">
            <label for="evento-slug">Dirección web (opcional)</label>
            <input id="evento-slug" formControlName="slug" maxlength="220" placeholder="Se genera automáticamente">
          </div>
        </div>

        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-inicio">Inicio *</label>
            <input id="evento-inicio" type="datetime-local" formControlName="fechaInicio" required>
          </div>
          <div class="adm-campo">
            <label for="evento-fin">Fin (opcional)</label>
            <input id="evento-fin" type="datetime-local" formControlName="fechaFin">
          </div>
        </div>

        <div class="adm-campo">
          <label for="evento-zona">Zona horaria</label>
          <input id="evento-zona" formControlName="zonaHoraria" maxlength="64" placeholder="Europe/Madrid">
        </div>
        <div class="adm-campo">
          <label for="evento-descripcion">Descripción</label>
          <textarea id="evento-descripcion" formControlName="descripcion" rows="6" maxlength="10000"></textarea>
        </div>
        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-lugar">Lugar / recinto</label>
            <input id="evento-lugar" formControlName="lugar" maxlength="200">
          </div>
          <div class="adm-campo">
            <label for="evento-direccion">Dirección</label>
            <input id="evento-direccion" formControlName="direccion" maxlength="255">
          </div>
        </div>
        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-localidad">Localidad</label>
            <input id="evento-localidad" formControlName="localidad" maxlength="120">
          </div>
          <div class="adm-campo">
            <label for="evento-provincia">Provincia</label>
            <input id="evento-provincia" formControlName="provincia" maxlength="100">
          </div>
        </div>
        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-pais">País</label>
            <input id="evento-pais" formControlName="pais" maxlength="100">
          </div>
          <div class="adm-campo">
            <label for="evento-organizador">Organizador</label>
            <input id="evento-organizador" formControlName="organizador" maxlength="200">
          </div>
        </div>

        <div class="adm-campo">
          <label for="evento-cartel">URL del cartel (https:// o imagen propia /media/)</label>
          <input id="evento-cartel" type="text" formControlName="cartelUrl" maxlength="1024">
        </div>
        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-gratis">Acceso</label>
            <select id="evento-gratis" formControlName="gratuito">
              <option value="">Por confirmar</option>
              <option value="true">Gratuito</option>
              <option value="false">De pago</option>
            </select>
          </div>
          <div class="adm-campo">
            <label for="evento-precio">Precio en euros (opcional)</label>
            <input id="evento-precio" formControlName="precioEuros" type="number" min="0" step="0.01">
          </div>
        </div>
        <div class="adm-campo">
          <label for="evento-entradas">Enlace de entradas</label>
          <input id="evento-entradas" formControlName="entradaUrl" maxlength="1024" placeholder="https://">
        </div>
        <div class="adm-campos-par">
          <div class="adm-campo">
            <label for="evento-fuente-nombre">Nombre de la fuente</label>
            <input id="evento-fuente-nombre" formControlName="fuenteNombre" maxlength="200">
          </div>
          <div class="adm-campo">
            <label for="evento-fuente">Enlace a la fuente</label>
            <input id="evento-fuente" formControlName="fuenteUrl" maxlength="1024" placeholder="https://">
          </div>
        </div>

        <section class="adm-panel" aria-label="Artistas participantes">
          <h2 class="adm-panel__titulo">Artistas participantes</h2>
          <p class="adm-ayuda">Selecciona los artistas que ya están registrados en ConSaborFlamenco.</p>
          @if (artistas().length) {
            <div class="adm-pila">
              @for (a of artistas(); track a.id) {
                <label>
                  <input type="checkbox" [checked]="seleccionados().includes(a.id)"
                         (change)="marcarArtista(a.id, $any($event.target).checked)">
                  {{ a.nombre }} ({{ a.disciplina }})
                </label>
              }
            </div>
          } @else {
            <p class="adm-ayuda">No hay artistas disponibles para seleccionar. Puedes guardar el evento sin participantes asociados.</p>
          }
        </section>

        @if (errorGeneral()) { <p class="adm-alerta" role="alert">{{ errorGeneral() }}</p> }
        <button class="adm-btn adm-btn--oro" type="submit"
                [disabled]="guardando() || evento()?.archivado === true">
          {{ guardando() ? 'Guardando…' : 'Guardar evento' }}
        </button>
      </form>

      @if (evento(); as e) {
        <section class="adm-panel" aria-label="Publicación del evento">
          <h2 class="adm-panel__titulo">Publicación</h2>
          <p class="adm-ayuda">Estado: {{ e.estadoRevision }} · {{ e.publicado ? 'Público' : 'No publicado' }}</p>
          <div class="adm-pila">
            @if (!e.archivado) {
              @if (e.estadoRevision !== 'APROBADO') {
                <button class="adm-btn" type="button" (click)="accion('aprobar')">Aprobar</button>
              }
              @if (e.estadoRevision === 'APROBADO' && !e.publicado) {
                <button class="adm-btn adm-btn--oro" type="button" (click)="accion('publicar')">Publicar en la web</button>
              }
              @if (e.publicado) {
                <button class="adm-btn adm-btn--quieto" type="button" (click)="accion('despublicar')">Retirar de la web</button>
                <button class="adm-btn adm-btn--quieto" type="button" (click)="accion(e.destacado ? 'quitar-destacado' : 'destacar')">
                  {{ e.destacado ? 'Quitar de destacados' : 'Destacar evento' }}
                </button>
              }
              <button class="adm-btn adm-btn--quieto" type="button" (click)="accion('archivar')">Archivar evento</button>
            }
          </div>
        </section>
      }
    }
  `
})
export class EventoFormComponent implements OnInit, ConCambiosPendientes {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EventosApiService);
  private readonly artistasApi = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly avisos = inject(AvisosService);

  readonly evento = signal<EventoAdmin | null>(null);
  readonly artistas = signal<ArtistaAdmin[]>([]);
  readonly seleccionados = signal<number[]>([]);
  readonly guardando = signal(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly errorCarga = signal<string | null>(null);
  private artistasOriginales: number[] = [];

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    slug: [''],
    descripcion: [''],
    tipo: ['ESPECTACULO'],
    fechaInicio: ['', Validators.required],
    fechaFin: [''],
    zonaHoraria: ['Europe/Madrid'],
    lugar: [''],
    direccion: [''],
    localidad: [''],
    provincia: [''],
    pais: ['España'],
    cartelUrl: [''],
    organizador: [''],
    gratuito: [''],
    precioEuros: [''],
    entradaUrl: [''],
    fuenteNombre: [''],
    fuenteUrl: ['']
  });

  ngOnInit(): void {
    this.artistasApi.listar({ page: 0, size: 100, estado: 'ACTIVOS' }).subscribe({
      next: p => this.artistas.set(p.content),
      error: () => {}
    });
    const id = this.ruta.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.obtener(Number(id)).subscribe({
      next: e => {
        this.evento.set(e);
        this.seleccionados.set([...e.artistaIds]);
        this.artistasOriginales = [...e.artistaIds];
        this.form.patchValue({
          titulo: e.titulo, slug: e.slug, descripcion: e.descripcion ?? '', tipo: e.tipo,
          fechaInicio: fechaFormulario(e.fechaInicio), fechaFin: fechaFormulario(e.fechaFin),
          zonaHoraria: e.zonaHoraria, lugar: e.lugar ?? '', direccion: e.direccion ?? '',
          localidad: e.localidad ?? '', provincia: e.provincia ?? '', pais: e.pais,
          cartelUrl: e.cartelUrl ?? '', organizador: e.organizador ?? '',
          gratuito: e.gratuito === null ? '' : String(e.gratuito),
          precioEuros: e.precioCentimos === null ? '' : String(e.precioCentimos / 100),
          entradaUrl: e.entradaUrl ?? '', fuenteNombre: e.fuenteNombre ?? '',
          fuenteUrl: e.fuenteUrl ?? ''
        });
        this.form.markAsPristine();
      },
      error: err => this.errorCarga.set(mensajeDe(err, 'No se ha encontrado el evento.'))
    });
  }

  marcarArtista(id: number, marcado: boolean): void {
    this.seleccionados.update(ids => marcado ? [...ids.filter(i => i !== id), id] : ids.filter(i => i !== id));
  }

  hayCambiosSinGuardar(): boolean {
    return this.form.dirty ||
      JSON.stringify([...this.seleccionados()].sort()) !== JSON.stringify([...this.artistasOriginales].sort());
  }

  guardar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorGeneral.set('Revisa el título y la fecha de inicio.');
      return;
    }
    const v = this.form.getRawValue();
    const euros = String(v.precioEuros).trim().replace(',', '.');
    const cantidad = euros ? Number(euros) : null;
    if (cantidad !== null && (!Number.isFinite(cantidad) || cantidad < 0)) {
      this.errorGeneral.set('Indica un precio válido.');
      return;
    }
    const datos: EventoPeticion = {
      titulo: v.titulo, slug: nulo(v.slug), descripcion: nulo(v.descripcion), tipo: v.tipo,
      fechaInicio: v.fechaInicio, fechaFin: nulo(v.fechaFin),
      zonaHoraria: v.zonaHoraria || 'Europe/Madrid', lugar: nulo(v.lugar),
      direccion: nulo(v.direccion), localidad: nulo(v.localidad), provincia: nulo(v.provincia),
      pais: v.pais || 'España', cartelUrl: nulo(v.cartelUrl), organizador: nulo(v.organizador),
      gratuito: v.gratuito === '' ? null : v.gratuito === 'true',
      precioCentimos: cantidad === null ? null : Math.round(cantidad * 100),
      entradaUrl: nulo(v.entradaUrl), fuenteNombre: nulo(v.fuenteNombre),
      fuenteUrl: nulo(v.fuenteUrl), artistaIds: this.seleccionados()
    };
    this.guardando.set(true);
    const id = this.evento()?.id;
    const peticion = id ? this.api.actualizar(id, datos) : this.api.crear(datos);
    peticion.subscribe({
      next: e => {
        this.guardando.set(false);
        this.avisos.ok('Evento guardado correctamente.');
        this.artistasOriginales = [...this.seleccionados()];
        this.form.markAsPristine();
        this.router.navigate(['/admin/eventos', e.id]);
      },
      error: err => {
        this.guardando.set(false);
        this.errorGeneral.set(mensajeDe(err));
      }
    });
  }

  accion(accion: AccionEvento): void {
    const e = this.evento();
    if (!e || this.guardando()) return;
    this.guardando.set(true);
    this.api.accion(e.id, accion).subscribe({
      next: actualizado => {
        this.guardando.set(false);
        this.evento.set(actualizado);
        this.avisos.ok('Estado del evento actualizado.');
      },
      error: err => { this.guardando.set(false); this.avisos.error(mensajeDe(err)); }
    });
  }
}
