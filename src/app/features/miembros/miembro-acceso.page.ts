import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MiembroAuthService } from './miembro-auth.service';

@Component({
  selector: 'csf-miembro-acceso',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="acceso">
      <p class="etiqueta">COMUNIDAD CONSABORFLAMENCO</p>
      <h1>Acceso de miembros</h1>
      <p>Entra con tu correo y contraseña para consultar tu espacio privado.</p>
      <form [formGroup]="form" (ngSubmit)="entrar()" novalidate>
        <label for="miembro-email">Correo electrónico</label>
        <input id="miembro-email" type="email" formControlName="email" autocomplete="username">
        <label for="miembro-password">Contraseña</label>
        <input id="miembro-password" type="password" formControlName="password" autocomplete="current-password">
        @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
        <button type="submit" [disabled]="enviando()">{{ enviando() ? 'Accediendo…' : 'Entrar en mi cuenta' }}</button>
      </form>
      <p>¿Todavía no eres miembro? <a routerLink="/registro">Consulta el registro</a>.</p>
      <p class="nota">El alta de nuevas cuentas estará disponible cuando activemos la verificación por correo. Este acceso es para cuentas de miembros ya habilitadas.</p>
    </main>
  `,
  styles: [`
    .acceso{width:min(100% - 32px,520px);margin:56px auto 80px;padding:clamp(22px,4vw,42px);background:#fff;color:#272119;border-radius:14px;border:1px solid #decfb8}
    h1{font-size:clamp(1.8rem,4vw,2.5rem);margin:8px 0 14px}
    .etiqueta{font-weight:700;color:#946b36;letter-spacing:.12em;font-size:.75rem}
    form{display:grid;gap:12px;margin:22px 0}
    label{font-weight:600;margin-top:4px}
    input{padding:12px;border:1px solid #9c8c79;border-radius:6px;font:inherit;width:100%;box-sizing:border-box}
    button{background:#282018;color:white;border:0;border-radius:6px;padding:14px;font:inherit;font-weight:650;cursor:pointer}
    button:disabled{opacity:.6;cursor:wait}.error{color:#a71f1f}.nota{color:#675c50;font-size:.9rem}
    a{color:#815a23;text-decoration:underline}
  `]
})
export class MiembroAccesoPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(MiembroAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(128)]]
  });

  entrar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Introduce un correo y contraseña válidos.');
      return;
    }
    this.enviando.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.entrar(email, password).subscribe({
      next: () => {
        this.enviando.set(false);
        const volver=this.route.snapshot.queryParamMap.get('volver')||'';
        this.router.navigateByUrl(/^\/promocion\?municipio=\d+&posicion=[12]$/.test(volver)?volver:'/mi-cuenta');
      },
      error: () => {
        this.enviando.set(false);
        this.form.controls.password.reset();
        this.error.set('No se ha podido iniciar sesión. Comprueba tus credenciales o la activación de tu cuenta.');
      }
    });
  }
}
