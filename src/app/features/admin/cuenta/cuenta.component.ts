import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe, problemaDe } from '../core/errores';

function coinciden(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('nueva')?.value === grupo.get('repetir')?.value ? null : { distintas: true };
}

@Component({
  selector: 'adm-cuenta',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Mi cuenta</h1>
        <p class="adm-subtitulo">{{ auth.sesion()?.email }}</p>
      </div>
    </header>
    <section class="adm-panel adm-panel--estrecho">
      <h2 class="adm-panel__titulo">Cambiar la contraseña</h2>
      <p class="adm-ayuda">Usa al menos 12 caracteres. Una frase que recuerdes es más segura que una palabra con símbolos. Al cambiarla se cierran tus otras sesiones.</p>
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <div class="adm-campo">
          <label for="actual">Contraseña actual</label>
          <input id="actual" type="password" formControlName="actual" autocomplete="current-password">
          @if (errores()['actual']) { <p class="adm-campo__error">{{ errores()['actual'] }}</p> }
        </div>
        <div class="adm-campo">
          <label for="nueva">Nueva contraseña</label>
          <input id="nueva" type="password" formControlName="nueva" autocomplete="new-password" minlength="12">
          @if (form.controls.nueva.touched && form.controls.nueva.invalid) { <p class="adm-campo__error">Mínimo 12 caracteres.</p> }
          @if (errores()['nueva']) { <p class="adm-campo__error">{{ errores()['nueva'] }}</p> }
        </div>
        <div class="adm-campo">
          <label for="repetir">Repite la nueva contraseña</label>
          <input id="repetir" type="password" formControlName="repetir" autocomplete="new-password">
          @if (form.controls.repetir.touched && form.hasError('distintas')) { <p class="adm-campo__error">Las contraseñas no coinciden.</p> }
        </div>
        <button type="submit" class="adm-btn adm-btn--oro" [disabled]="enviando()">{{ enviando() ? 'Guardando…' : 'Cambiar contraseña' }}</button>
      </form>
    </section>
  `
})
export class CuentaComponent {
  readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(FormBuilder);
  readonly enviando = signal(false);
  readonly errores = signal<Record<string, string>>({});

  readonly form = this.fb.nonNullable.group({
    actual: ['', Validators.required],
    nueva: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
    repetir: ['', Validators.required]
  }, { validators: coinciden });

  guardar(): void {
    this.form.markAllAsTouched();
    this.errores.set({});
    if (this.form.invalid) return;
    const { actual, nueva } = this.form.getRawValue();
    this.enviando.set(true);
    this.auth.cambiarPassword(actual, nueva).subscribe({
      next: () => { this.enviando.set(false); this.form.reset(); this.avisos.ok('Contraseña cambiada.'); },
      error: e => {
        this.enviando.set(false);
        const p = problemaDe(e);
        if (p.errores) this.errores.set(p.errores); else this.avisos.error(mensajeDe(e));
      }
    });
  }
}
