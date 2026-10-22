import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../core/admin-api.service';
import { AuthService } from '../core/auth.service';
import { AvisosService } from '../core/avisos.service';
import { ConfirmacionService } from '../core/confirmacion.service';
import { mensajeDe, problemaDe } from '../core/errores';
import { UsuarioAdmin } from '../core/modelos';
import { generarPassword } from '../ui/password';

@Component({
  selector: 'adm-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Cuentas de acceso</h1>
        <p class="adm-subtitulo">Personas que pueden entrar en este panel. Solo tú, como administración principal, puedes gestionarlas.</p>
      </div>
    </header>

    @if (error()) { <p class="adm-alerta" role="alert">{{ error() }}</p> }

    <ul class="adm-cuentas">
      @for (u of usuarios(); track u.id) {
        <li class="adm-cuentas__fila" [class.is-inactiva]="!u.activo">
          <span class="adm-yo__inicial" aria-hidden="true">{{ u.nombre.charAt(0) }}</span>
          <span class="adm-cuentas__datos">
            <strong>{{ u.nombre }} @if (u.id === yo()) { <small>(tú)</small> }</strong>
            <small>{{ u.email }}</small>
          </span>
          <span class="adm-cuentas__rol">{{ u.rol === 'ADMIN_PRINCIPAL' ? 'Principal' : 'Administración' }}</span>
          <span class="adm-cuentas__estado">
            @if (!u.activo) { <span class="adm-estado" data-estado="archivado">Desactivada</span> }
            @else if (u.bloqueado) { <span class="adm-estado" data-estado="borrador">Bloqueo temporal</span> }
            @else { <span class="adm-cuentas__acceso">{{ u.ultimoAccesoEn ? 'Último acceso ' + (u.ultimoAccesoEn | date: 'd MMM, HH:mm') : 'Aún no ha entrado' }}</span> }
          </span>
          <span class="adm-cuentas__acciones">
            @if (u.rol !== 'ADMIN_PRINCIPAL') {
              <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="restablecer(u)">Nueva contraseña</button>
              @if (u.activo) {
                <button type="button" class="adm-enlace adm-enlace--peligro" (click)="cambiarEstado(u, false)">Desactivar</button>
              } @else {
                <button type="button" class="adm-enlace" (click)="cambiarEstado(u, true)">Reactivar</button>
              }
            }
          </span>
        </li>
      }
    </ul>

    @if (passwordMostrada(); as m) {
      <div class="adm-franja adm-franja--oro" role="status">
        <p>Contraseña temporal de <strong>{{ m.nombre }}</strong>: <code class="adm-codigo">{{ m.password }}</code>.
          Envíasela por un canal seguro; no volverá a mostrarse. Puede cambiarla en «Mi cuenta».</p>
        <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="copiar(m.password)">Copiar</button>
        <button type="button" class="adm-enlace" (click)="passwordMostrada.set(null)">Ocultar</button>
      </div>
    }

    <section class="adm-bloque adm-panel">
      <h2 class="adm-panel__titulo">Dar acceso a otra persona</h2>
      <form [formGroup]="form" (ngSubmit)="crear()" class="adm-form-linea" novalidate>
        <div class="adm-campo">
          <label for="u-nombre">Nombre</label>
          <input id="u-nombre" formControlName="nombre" maxlength="120" autocomplete="off">
          @if (errorCampo('nombre')) { <p class="adm-campo__error">{{ errorCampo('nombre') }}</p> }
        </div>
        <div class="adm-campo">
          <label for="u-email">Email</label>
          <input id="u-email" type="email" formControlName="email" maxlength="254" autocomplete="off">
          @if (errorCampo('email')) { <p class="adm-campo__error">{{ errorCampo('email') }}</p> }
        </div>
        <button type="submit" class="adm-btn adm-btn--oro" [disabled]="enviando()">{{ enviando() ? 'Creando…' : 'Crear cuenta' }}</button>
      </form>
      <p class="adm-ayuda">Se genera una contraseña temporal segura que verás una sola vez.</p>
    </section>
  `
})
export class UsuariosComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly fb = inject(FormBuilder);

  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly passwordMostrada = signal<{ nombre: string; password: string } | null>(null);
  private readonly erroresServidor = signal<Record<string, string>>({});
  readonly yo = () => this.auth.sesion()?.id;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]]
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.usuarios().subscribe({ next: l => this.usuarios.set(l), error: e => this.error.set(mensajeDe(e)) });
  }

  errorCampo(campo: 'nombre' | 'email'): string | null {
    if (this.erroresServidor()[campo]) return this.erroresServidor()[campo];
    const c = this.form.controls[campo];
    if (!c.invalid || !c.touched) return null;
    return campo === 'email' ? 'Introduce un email válido.' : 'Indica un nombre de 2 a 120 caracteres.';
  }

  crear(): void {
    this.form.markAllAsTouched();
    this.erroresServidor.set({});
    if (this.form.invalid) return;
    const { nombre, email } = this.form.getRawValue();
    const password = generarPassword();
    this.enviando.set(true);
    this.api.crearUsuario(email, nombre, password).subscribe({
      next: u => {
        this.enviando.set(false);
        this.form.reset();
        this.passwordMostrada.set({ nombre: u.nombre, password });
        this.avisos.ok(`Cuenta creada para ${u.nombre}.`);
        this.cargar();
      },
      error: e => {
        this.enviando.set(false);
        const p = problemaDe(e);
        if (p.errores) this.erroresServidor.set(p.errores); else this.avisos.error(mensajeDe(e));
      }
    });
  }

  async restablecer(u: UsuarioAdmin): Promise<void> {
    const ok = await this.confirmacion.pedir({
      titulo: `Nueva contraseña para ${u.nombre}`,
      mensaje: 'Se cerrarán sus sesiones abiertas y tendrá que entrar con la contraseña temporal que verás a continuación.',
      aceptar: 'Generar contraseña'
    });
    if (!ok) return;
    const password = generarPassword();
    this.api.restablecerPassword(u.id, password).subscribe({
      next: () => { this.passwordMostrada.set({ nombre: u.nombre, password }); this.cargar(); },
      error: e => this.avisos.error(mensajeDe(e))
    });
  }

  async cambiarEstado(u: UsuarioAdmin, activar: boolean): Promise<void> {
    if (!activar) {
      const ok = await this.confirmacion.pedir({
        titulo: `Desactivar la cuenta de ${u.nombre}`,
        mensaje: 'Perderá el acceso al panel de inmediato, incluso si tiene una sesión abierta. Podrás reactivarla más tarde.',
        aceptar: 'Desactivar',
        peligro: true
      });
      if (!ok) return;
    }
    this.api.cambiarEstadoUsuario(u.id, activar).subscribe({
      next: r => { this.avisos.ok(activar ? `${r.nombre} puede volver a entrar.` : `${r.nombre} ya no tiene acceso.`); this.cargar(); },
      error: e => this.avisos.error(mensajeDe(e))
    });
  }

  copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).then(() => this.avisos.ok('Contraseña copiada.'), () => this.avisos.error('No se ha podido copiar.'));
  }
}
