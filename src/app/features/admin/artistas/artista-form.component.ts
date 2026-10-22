import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AccionEditorial, AdminApiService } from '../core/admin-api.service';
import { AvisosService } from '../core/avisos.service';
import { ConfirmacionService } from '../core/confirmacion.service';
import { mensajeDe, problemaDe } from '../core/errores';
import { ConCambiosPendientes } from '../core/guards';
import { ArtistaAdmin, ArtistaPeticion, Catalogos } from '../core/modelos';
import { EstadoArtistaComponent } from '../ui/estado-artista.component';
import { FotoSubidaComponent } from './foto-subida.component';
import { MENSAJES_ACCION } from './artistas-lista.component';

export const BIOGRAFIA_MAX = 5000;
export const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugDesde(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 170);
}

type Campo = 'nombre' | 'slug' | 'disciplina' | 'provincia' | 'biografia';

@Component({
  selector: 'adm-artista-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, EstadoArtistaComponent, FotoSubidaComponent],
  template: `
    <nav class="adm-migas" aria-label="Ruta"><a routerLink="/admin/artistas">Artistas</a></nav>
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">{{ artista()?.nombre ?? 'Nuevo artista' }}</h1>
        @if (artista(); as a) {
          <p class="adm-subtitulo adm-subtitulo--estado"><adm-estado-artista [artista]="a" />
            @if (a.actualizadoEn) { <span>Editado el {{ a.actualizadoEn | date: "d 'de' MMMM, HH:mm" }}</span> }</p>
        } @else {
          <p class="adm-subtitulo">Se guarda como borrador; no aparece en la web hasta que lo publiques.</p>
        }
      </div>
    </header>

    @if (errorCarga()) {
      <p class="adm-alerta" role="alert">{{ errorCarga() }}</p>
    } @else {
      @if (artista()?.archivado) {
        <div class="adm-franja" role="status">
          <p>Esta ficha está archivada: no se ve en la web y no se puede editar.</p>
          <button type="button" class="adm-btn adm-btn--peq" (click)="accion('restaurar')">Restaurar como borrador</button>
        </div>
      }

      <div class="adm-ficha">
        <form [formGroup]="form" (ngSubmit)="guardar()" novalidate class="adm-ficha__datos" id="ficha-artista">
          <div class="adm-campo">
            <label for="nombre">Nombre artístico</label>
            <input id="nombre" formControlName="nombre" maxlength="160" autocomplete="off" [attr.aria-invalid]="!!error('nombre')" aria-describedby="nombre-error">
            @if (error('nombre')) { <p id="nombre-error" class="adm-campo__error">{{ error('nombre') }}</p> }
          </div>

          <div class="adm-campo">
            <label for="slug">Dirección en la web</label>
            <div class="adm-slug">
              <span aria-hidden="true">/artistas/</span>
              <input id="slug" formControlName="slug" maxlength="180" [placeholder]="slugSugerido() || 'se-genera-del-nombre'"
                     [attr.aria-invalid]="!!error('slug')" aria-describedby="slug-ayuda slug-error">
            </div>
            <p id="slug-ayuda" class="adm-ayuda">
              @if (artista()) { Cambiarla rompe los enlaces que ya se hayan compartido. }
              @else { Déjala vacía para generarla a partir del nombre. }
            </p>
            @if (error('slug')) { <p id="slug-error" class="adm-campo__error">{{ error('slug') }}</p> }
          </div>

          <div class="adm-campos-par">
            <div class="adm-campo">
              <label for="disciplina">Disciplina</label>
              <select id="disciplina" formControlName="disciplina" [attr.aria-invalid]="!!error('disciplina')" aria-describedby="disciplina-error">
                <option value="" disabled>Elige una disciplina</option>
                @for (d of catalogos()?.disciplinas ?? []; track d) { <option [value]="d">{{ d }}</option> }
                @if (valorFueraDeCatalogo('disciplina')) { <option [value]="form.controls.disciplina.value">{{ form.controls.disciplina.value }} (valor antiguo)</option> }
              </select>
              @if (error('disciplina')) { <p id="disciplina-error" class="adm-campo__error">{{ error('disciplina') }}</p> }
            </div>
            <div class="adm-campo">
              <label for="provincia">Provincia</label>
              <select id="provincia" formControlName="provincia" [attr.aria-invalid]="!!error('provincia')" aria-describedby="provincia-error">
                <option value="" disabled>Elige una provincia</option>
                @for (p of catalogos()?.provincias ?? []; track p) { <option [value]="p">{{ p }}</option> }
                @if (valorFueraDeCatalogo('provincia')) { <option [value]="form.controls.provincia.value">{{ form.controls.provincia.value }} (valor antiguo)</option> }
              </select>
              @if (error('provincia')) { <p id="provincia-error" class="adm-campo__error">{{ error('provincia') }}</p> }
            </div>
          </div>

          <div class="adm-campo">
            <label for="biografia">Biografía</label>
            <textarea id="biografia" formControlName="biografia" rows="10" [attr.maxlength]="biografiaMax"
                      [attr.aria-invalid]="!!error('biografia')" aria-describedby="biografia-contador biografia-error"></textarea>
            <p id="biografia-contador" class="adm-ayuda adm-contador" [class.is-limite]="longitudBio() > biografiaMax * 0.95">
              {{ longitudBio() }} / {{ biografiaMax }} caracteres. Texto plano; los saltos de línea se conservan.
            </p>
            @if (error('biografia')) { <p id="biografia-error" class="adm-campo__error">{{ error('biografia') }}</p> }
          </div>

          @if (errorGeneral()) { <p class="adm-alerta" role="alert">{{ errorGeneral() }}</p> }
        </form>

        <aside class="adm-ficha__lateral" aria-label="Fotografía y publicación">
          <section class="adm-panel">
            <h2 class="adm-panel__titulo">Fotografía</h2>
            <adm-foto-subida [artistaId]="artista()?.archivado ? null : (artista()?.id ?? null)" [fotoActual]="artista()?.fotoUrl ?? null"
                             [nombre]="artista()?.nombre ?? ''" (actualizado)="alActualizarFoto($event)" />
          </section>

          @if (artista(); as a) {
            @if (!a.archivado) {
              <section class="adm-panel">
                <h2 class="adm-panel__titulo">Publicación</h2>
                @if (a.publicado) {
                  <p class="adm-ayuda">Visible en la web pública.</p>
                  <div class="adm-pila">
                    <button type="button" class="adm-btn adm-btn--quieto" [disabled]="ocupado()" (click)="accion(a.destacado ? 'quitar-destacado' : 'destacar')">
                      {{ a.destacado ? 'Quitar de destacados' : 'Destacar en portada' }}
                    </button>
                    <button type="button" class="adm-btn adm-btn--quieto" [disabled]="ocupado()" (click)="accion('despublicar')">Retirar de la web</button>
                  </div>
                } @else {
                  <p class="adm-ayuda">Borrador: solo lo ve el equipo de administración.</p>
                  <button type="button" class="adm-btn adm-btn--ancho" [disabled]="ocupado() || form.dirty" (click)="accion('publicar')">Publicar en la web</button>
                  @if (form.dirty) { <p class="adm-ayuda">Guarda los cambios antes de publicar.</p> }
                }
              </section>
              <section class="adm-panel adm-panel--discreto">
                <h2 class="adm-panel__titulo">Archivar</h2>
                <p class="adm-ayuda">Retira la ficha de la web y del listado activo. No se borra nada y se puede restaurar.</p>
                <button type="button" class="adm-enlace adm-enlace--peligro" [disabled]="ocupado()" (click)="archivar()">Archivar artista</button>
              </section>
            }
          }
        </aside>
      </div>

      @if (!artista()?.archivado) {
        <div class="adm-barra-guardar">
          <a routerLink="/admin/artistas" class="adm-btn adm-btn--quieto">Volver</a>
          <button type="submit" form="ficha-artista" class="adm-btn adm-btn--oro" [disabled]="guardando() || (!!artista() && form.pristine)">
            {{ guardando() ? 'Guardando…' : (artista() ? 'Guardar cambios' : 'Crear borrador') }}
          </button>
        </div>
      }
    }
  `
})
export class ArtistaFormComponent implements OnInit, ConCambiosPendientes {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly router = inject(Router);

  /** Parámetro de ruta (withComponentInputBinding). Ausente en /artistas/nuevo. */
  readonly id = input<string>();
  readonly biografiaMax = BIOGRAFIA_MAX;

  readonly artista = signal<ArtistaAdmin | null>(null);
  readonly catalogos = signal<Catalogos | null>(null);
  readonly guardando = signal(false);
  readonly ocupado = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly errorGeneral = signal<string | null>(null);
  private readonly erroresServidor = signal<Partial<Record<Campo, string>>>({});
  private readonly bio = signal('');
  private readonly nombreActual = signal('');
  private intentado = signal(false);

  readonly longitudBio = computed(() => this.bio().length);
  readonly slugSugerido = computed(() => slugDesde(this.nombreActual()));

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    slug: ['', [Validators.maxLength(180), Validators.pattern(PATRON_SLUG)]],
    disciplina: ['', Validators.required],
    provincia: ['', Validators.required],
    biografia: ['', Validators.maxLength(BIOGRAFIA_MAX)]
  });

  constructor() {
    this.form.controls.biografia.valueChanges.subscribe(v => this.bio.set(v ?? ''));
    this.form.controls.nombre.valueChanges.subscribe(v => this.nombreActual.set(v ?? ''));
    for (const [nombre, control] of Object.entries(this.form.controls)) {
      control.valueChanges.subscribe(() => this.erroresServidor.update(e => ({ ...e, [nombre]: undefined })));
    }
  }

  ngOnInit(): void {
    this.api.catalogos().subscribe({ next: c => this.catalogos.set(c), error: e => this.errorCarga.set(mensajeDe(e)) });
    const id = Number(this.id());
    if (this.id() && Number.isInteger(id) && id > 0) {
      this.api.obtener(id).subscribe({
        next: a => this.cargar(a),
        error: e => this.errorCarga.set(problemaDe(e).status === 404 ? 'Este artista no existe o se ha eliminado.' : mensajeDe(e))
      });
    } else if (this.id()) {
      this.errorCarga.set('La dirección no corresponde a ningún artista.');
    }
  }

  hayCambiosSinGuardar(): boolean { return this.form.dirty && !this.guardando(); }

  error(campo: Campo): string | null {
    const servidor = this.erroresServidor()[campo];
    if (servidor) return servidor;
    const c = this.form.controls[campo];
    if (!c.invalid || !(c.touched || this.intentado())) return null;
    if (c.hasError('required')) {
      return { nombre: 'Indica el nombre artístico.', disciplina: 'Elige una disciplina.', provincia: 'Elige una provincia.' }[campo as 'nombre'] ?? 'Campo obligatorio.';
    }
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres.';
    if (c.hasError('maxlength')) return 'Has superado la longitud máxima.';
    if (c.hasError('pattern')) return 'Solo minúsculas sin acentos, números y guiones. Por ejemplo: paco-de-lucia.';
    return 'Revisa este campo.';
  }

  valorFueraDeCatalogo(campo: 'disciplina' | 'provincia'): boolean {
    const valor = this.form.controls[campo].value;
    const lista = campo === 'disciplina' ? this.catalogos()?.disciplinas : this.catalogos()?.provincias;
    return !!valor && !!lista && !lista.includes(valor);
  }

  guardar(): void {
    this.intentado.set(true);
    this.errorGeneral.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.valorFueraDeCatalogo('disciplina') || this.valorFueraDeCatalogo('provincia')) {
      if (this.valorFueraDeCatalogo('disciplina')) this.erroresServidor.update(e => ({ ...e, disciplina: 'Elige una disciplina de la lista actual.' }));
      if (this.valorFueraDeCatalogo('provincia')) this.erroresServidor.update(e => ({ ...e, provincia: 'Elige una provincia de la lista actual.' }));
      this.enfocarPrimerError();
      return;
    }
    const v = this.form.getRawValue();
    const datos: ArtistaPeticion = {
      nombre: v.nombre.trim(),
      slug: v.slug.trim() || null,
      disciplina: v.disciplina,
      provincia: v.provincia,
      biografia: v.biografia.trim() || null,
      fotoUrl: this.artista()?.fotoUrl ?? null
    };
    const actual = this.artista();
    this.guardando.set(true);
    (actual ? this.api.actualizar(actual.id, datos) : this.api.crear(datos)).subscribe({
      next: a => {
        this.guardando.set(false);
        this.cargar(a);
        if (actual) {
          this.avisos.ok('Cambios guardados.');
        } else {
          this.avisos.ok('Borrador creado. Ya puedes añadir la fotografía.');
          this.router.navigate(['/admin/artistas', a.id], { replaceUrl: true });
        }
      },
      error: e => {
        this.guardando.set(false);
        const p = problemaDe(e);
        if (p.errores) {
          this.erroresServidor.set(p.errores as Partial<Record<Campo, string>>);
          this.enfocarPrimerError();
        }
        this.errorGeneral.set(p.errores ? 'Revisa los campos marcados.' : mensajeDe(e, 'No se han podido guardar los cambios.'));
      }
    });
  }

  async archivar(): Promise<void> {
    const a = this.artista();
    if (!a) return;
    const ok = await this.confirmacion.pedir({
      titulo: `Archivar a ${a.nombre}`,
      mensaje: 'Dejará de verse en la web y saldrá de destacados. No se borra ningún dato: podrás restaurarla desde el listado de archivados.',
      aceptar: 'Archivar',
      peligro: true
    });
    if (ok) this.accion('archivar');
  }

  accion(accion: AccionEditorial): void {
    const a = this.artista();
    if (!a) return;
    this.ocupado.set(true);
    this.api.accion(a.id, accion).subscribe({
      next: actualizado => {
        this.ocupado.set(false);
        this.artista.set(actualizado);
        this.avisos.ok(`${actualizado.nombre}: ${MENSAJES_ACCION[accion]}.`);
      },
      error: e => { this.ocupado.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }

  alActualizarFoto(a: ArtistaAdmin): void { this.artista.set(a); }

  private cargar(a: ArtistaAdmin): void {
    this.artista.set(a);
    this.form.reset({
      nombre: a.nombre, slug: a.slug, disciplina: a.disciplina, provincia: a.provincia, biografia: a.biografia ?? ''
    });
    this.erroresServidor.set({});
    this.intentado.set(false);
    if (a.archivado) this.form.disable(); else this.form.enable();
  }

  private enfocarPrimerError(): void {
    setTimeout(() => (document.querySelector('.adm-ficha [aria-invalid="true"]') as HTMLElement | null)?.focus());
  }
}
