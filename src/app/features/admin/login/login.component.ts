import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { mensajeDe, problemaDe } from '../core/errores';

@Component({
  selector: 'adm-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="adm-acceso">
      <div class="adm-acceso__escena" aria-hidden="true"><p class="adm-acceso__lema">El flamenco vive aquí.<small>Cuida desde este panel las fichas de artistas que se publican en la web.</small></p></div>
      <section class="adm-acceso__tarjeta" aria-labelledby="titulo-acceso">
        <a href="/" class="adm-marca adm-marca--grande">Con<span>Sabor</span>Flamenco</a>
        <h1 id="titulo-acceso" class="adm-acceso__titulo">Panel de administración</h1>

        @if (motivo() === 'caducada') {
          <p class="adm-nota" role="status">Tu sesión ha terminado. Vuelve a entrar para continuar.</p>
        }

        <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
          <div class="adm-campo">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="username" autofocus
                   [attr.aria-invalid]="invalido('email')" aria-describedby="email-error">
            @if (invalido('email')) { <p id="email-error" class="adm-campo__error">Introduce tu email.</p> }
          </div>
          <div class="adm-campo">
            <label for="password">Contraseña</label>
            <div class="adm-campo__con-boton">
              <input id="password" [type]="verPassword() ? 'text' : 'password'" formControlName="password"
                     autocomplete="current-password" [attr.aria-invalid]="invalido('password')" aria-describedby="password-error">
              <button type="button" class="adm-campo__boton" (click)="verPassword.set(!verPassword())"
                      [attr.aria-pressed]="verPassword()">{{ verPassword() ? 'Ocultar' : 'Mostrar' }}</button>
            </div>
            @if (invalido('password')) { <p id="password-error" class="adm-campo__error">Introduce tu contraseña.</p> }
          </div>

          @if (error()) { <p class="adm-alerta" role="alert">{{ error() }}</p> }

          <button type="submit" class="adm-btn adm-btn--oro adm-btn--ancho" [disabled]="enviando()">
            {{ enviando() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
        <p class="adm-acceso__ayuda">¿Has olvidado la contraseña? Pide al administrador principal que la restablezca.</p>
      </section>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly motivo = input<string>();
  readonly volver = input<string>();
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly verPassword = signal(false);
  private intentado = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(128)]]
  });

  invalido(campo: 'email' | 'password'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.intentado);
  }

  entrar(): void {
    this.intentado = true;
    this.error.set(null);
    if (this.form.invalid) return;
    this.enviando.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const destino = this.volver();
        // Solo se vuelve a rutas internas del panel (evita redirecciones abiertas).
        this.router.navigateByUrl(destino && destino.startsWith('/admin') && !destino.startsWith('/admin/login') ? destino : '/admin');
      },
      error: e => {
        this.enviando.set(false);
        this.form.controls.password.reset();
        const p = problemaDe(e);
        this.error.set(p.status === 401 ? 'Email o contraseña incorrectos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.'
          : mensajeDe(e, 'No se ha podido iniciar sesión.'));
      }
    });
  }
}
