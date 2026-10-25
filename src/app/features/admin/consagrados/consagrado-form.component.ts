import { Component, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Consagrado, ConsagradosApiService } from './consagrados-api.service';
import { ConCambiosPendientes } from '../core/guards';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe, problemaDe } from '../core/errores';

@Component({
  standalone: true,
  selector: 'adm-consagrado-form',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './consagrado-form.component.html',
  styleUrl: './consagrados.css'
})
export class ConsagradoFormComponent implements OnInit, OnDestroy, ConCambiosPendientes {
  private readonly api = inject(ConsagradosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisosService);
  private peticion?: Subscription;
  private imagen: File | null = null;
  readonly id = input<string>();
  readonly ficha = signal<Consagrado | null>(null);
  readonly preview = signal<string | null>(null);
  readonly nombreArchivo = signal('');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly intentado = signal(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly errorCarga = signal<string | null>(null);
  readonly errorImagen = signal<string | null>(null);
  readonly errores = signal<Record<string, string>>({});
  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(160)]],
    descripcion: ['', [Validators.required, Validators.maxLength(20000)]],
    fuente: ['', Validators.maxLength(500)]
  });

  ngOnInit() {
    if (!this.id()) return;
    const id = Number(this.id());
    if (!Number.isSafeInteger(id) || id < 1) { this.errorCarga.set('La dirección de esta ficha no es válida.'); return; }
    this.cargando.set(true);
    this.peticion = this.api.obtener(id).subscribe({
      next: ficha => { this.cargar(ficha); this.cargando.set(false); },
      error: error => { this.errorCarga.set(mensajeDe(error, 'No se ha podido cargar la ficha.')); this.cargando.set(false); }
    });
  }

  ngOnDestroy() { this.peticion?.unsubscribe(); this.limpiarPreview(); }
  hayCambiosSinGuardar() { return (this.form.dirty || !!this.imagen) && !this.guardando(); }

  error(campo: 'titulo' | 'descripcion' | 'fuente'): string | null {
    if (this.errores()[campo]) return this.errores()[campo];
    const control = this.form.controls[campo];
    if (!control.invalid || !(control.touched || this.intentado())) return null;
    return control.hasError('required') ? 'Este campo es obligatorio.' : 'Has superado la longitud máxima.';
  }

  alElegir(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0]; input.value = '';
    if (!archivo) return;
    this.errorImagen.set(null);
    if (archivo.size === 0 || archivo.size > 5 * 1024 * 1024) {
      this.errorImagen.set(archivo.size === 0 ? 'El archivo está vacío.' : 'La imagen supera el máximo de 5 MB.'); return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.errorImagen.set('Selecciona una imagen JPEG, PNG o WebP.'); return;
    }
    this.limpiarPreview();
    this.imagen = archivo; this.nombreArchivo.set(archivo.name);
    this.preview.set(URL.createObjectURL(archivo));
  }

  guardar() {
    this.intentado.set(true); this.errorGeneral.set(null); this.errores.set({}); this.form.markAllAsTouched();
    const valores = this.form.getRawValue();
    const datos = { titulo: valores.titulo.trim(), descripcion: valores.descripcion.trim(), fuente: valores.fuente.trim() || null };
    if (!datos.titulo) this.errores.update(e => ({ ...e, titulo: 'Indica el título o nombre del artista.' }));
    if (!datos.descripcion) this.errores.update(e => ({ ...e, descripcion: 'Escribe la descripción.' }));
    if (!this.imagen && !this.ficha()?.fotoUrl) this.errorImagen.set('Selecciona la imagen del artista.');
    if (this.form.invalid || Object.keys(this.errores()).length || this.errorImagen()) {
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return;
    }
    this.guardando.set(true);
    this.peticion = this.api.guardar(datos, this.imagen, this.ficha()?.id).subscribe({
      next: ficha => {
        const nueva = !this.ficha(); this.cargar(ficha); this.guardando.set(false);
        this.avisos.ok(nueva ? 'Ficha del artista consagrado creada.' : 'Cambios guardados.');
        if (nueva) this.router.navigate(['/admin/consagrados', ficha.id], { replaceUrl: true });
      },
      error: error => {
        this.guardando.set(false);
        const problema = problemaDe(error); this.errores.set(problema.errores ?? {});
        if (problema.errores?.['archivo'] || problema.errores?.['imagen']) this.errorImagen.set(problema.errores['archivo'] ?? problema.errores['imagen']);
        this.errorGeneral.set(mensajeDe(error, 'No se ha podido guardar la ficha.'));
      }
    });
  }

  private cargar(ficha: Consagrado) {
    this.ficha.set(ficha); this.form.reset({ titulo: ficha.titulo, descripcion: ficha.descripcion, fuente: ficha.fuente ?? '' });
    this.imagen = null; this.nombreArchivo.set(''); this.errorImagen.set(null); this.errores.set({}); this.limpiarPreview();
  }
  private limpiarPreview() { const url = this.preview(); if (url) URL.revokeObjectURL(url); this.preview.set(null); }
}
