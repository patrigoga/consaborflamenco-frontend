import { Component, OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { AdminApiService } from '../core/admin-api.service';
import { AvisosService } from '../core/avisos.service';
import { ConfirmacionService } from '../core/confirmacion.service';
import { mensajeDe } from '../core/errores';
import { ArtistaAdmin } from '../core/modelos';

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FOTO = 5 * 1024 * 1024;

/** Validación previa en el navegador; el servidor vuelve a validar siempre. */
export function validarArchivoFoto(archivo: File, maxBytes = MAX_FOTO): string | null {
  if (!TIPOS_FOTO.includes(archivo.type)) return 'Formato no admitido. Usa una foto JPEG, PNG o WebP.';
  if (archivo.size > maxBytes) return `La foto pesa ${(archivo.size / 1048576).toFixed(1)} MB; el máximo es ${Math.round(maxBytes / 1048576)} MB.`;
  if (archivo.size === 0) return 'El archivo está vacío.';
  return null;
}

@Component({
  selector: 'adm-foto-subida',
  standalone: true,
  template: `
    <div class="adm-foto" [class.is-arrastrando]="arrastrando()"
         (dragover)="$event.preventDefault(); arrastrando.set(true)" (dragleave)="arrastrando.set(false)" (drop)="soltar($event)">
      <div class="adm-foto__marco">
        @if (vista()) {
          <img [src]="vista()" [alt]="'Fotografía de ' + nombre()">
        } @else {
          <span class="adm-foto__vacio">Sin fotografía</span>
        }
        @if (progreso() !== null) {
          <div class="adm-foto__progreso" role="progressbar" aria-label="Subiendo fotografía"
               [attr.aria-valuenow]="progreso()" aria-valuemin="0" aria-valuemax="100">
            <span [style.width.%]="progreso()"></span>
          </div>
        }
      </div>
      <div class="adm-foto__acciones">
        <label class="adm-btn adm-btn--quieto adm-btn--peq" [class.is-desactivado]="!artistaId() || progreso() !== null">
          {{ fotoActual() ? 'Cambiar foto' : 'Subir foto' }}
          <input type="file" class="adm-oculto" [attr.accept]="tipos" [disabled]="!artistaId() || progreso() !== null" (change)="elegir($event)">
        </label>
        @if (fotoActual() && artistaId()) {
          <button type="button" class="adm-enlace adm-enlace--peligro" [disabled]="progreso() !== null" (click)="quitar()">Quitar foto</button>
        }
      </div>
      <p class="adm-ayuda">
        @if (artistaId()) { JPEG, PNG o WebP de hasta 5 MB y al menos 200 px. Se eliminan los datos de ubicación de la foto. }
        @else { Guarda la ficha para poder añadir la fotografía. }
      </p>
      @if (error()) { <p class="adm-campo__error" role="alert">{{ error() }}</p> }
    </div>
  `
})
export class FotoSubidaComponent implements OnDestroy {
  private readonly api = inject(AdminApiService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);

  readonly artistaId = input<number | null>(null);
  readonly fotoActual = input<string | null>(null);
  readonly nombre = input('');
  readonly actualizado = output<ArtistaAdmin>();

  readonly tipos = TIPOS_FOTO.join(',');
  readonly previa = signal<string | null>(null);
  readonly progreso = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly arrastrando = signal(false);
  readonly vista = computed(() => this.previa() ?? this.fotoActual());

  elegir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (archivo) this.subir(archivo);
  }

  soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo && this.artistaId()) this.subir(archivo);
  }

  subir(archivo: File): void {
    const id = this.artistaId();
    if (!id) return;
    const problema = validarArchivoFoto(archivo);
    this.error.set(problema);
    if (problema) return;
    this.limpiarPrevia();
    this.previa.set(URL.createObjectURL(archivo));
    this.progreso.set(0);
    this.api.subirFoto(id, archivo).subscribe({
      next: e => {
        if (e.type === HttpEventType.UploadProgress && e.total) this.progreso.set(Math.round((e.loaded / e.total) * 100));
        if (e.type === HttpEventType.Response && e.body) {
          this.progreso.set(null);
          this.limpiarPrevia();
          this.actualizado.emit(e.body);
          this.avisos.ok('Fotografía actualizada.');
        }
      },
      error: e => {
        this.progreso.set(null);
        this.limpiarPrevia();
        this.error.set(mensajeDe(e, 'No se ha podido subir la foto.'));
      }
    });
  }

  async quitar(): Promise<void> {
    const id = this.artistaId();
    if (!id) return;
    const ok = await this.confirmacion.pedir({
      titulo: 'Quitar la fotografía',
      mensaje: 'La ficha se mostrará sin foto hasta que subas otra.',
      aceptar: 'Quitar foto',
      peligro: true
    });
    if (!ok) return;
    this.api.quitarFoto(id).subscribe({
      next: a => { this.actualizado.emit(a); this.avisos.ok('Fotografía eliminada.'); },
      error: e => this.error.set(mensajeDe(e))
    });
  }

  ngOnDestroy(): void { this.limpiarPrevia(); }

  private limpiarPrevia(): void {
    const url = this.previa();
    if (url) URL.revokeObjectURL(url);
    this.previa.set(null);
  }
}
