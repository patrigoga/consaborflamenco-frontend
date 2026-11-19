import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmacionService } from '../core/confirmacion.service';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe } from '../core/errores';
import { generarPassword } from '../ui/password';
import { MiembroAdmin, MiembrosAdminService } from './miembros-admin.service';

@Component({
  selector: 'adm-miembros',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Gestión de miembros</h1>
        <p class="adm-subtitulo">Consulta y administra cuentas de miembros. Las cuentas administrativas se gestionan por separado.</p>
      </div>
      <a routerLink="/admin/cuentas" class="adm-btn adm-btn--quieto">Cuentas administrativas</a>
    </header>
    @if (error()) { <p class="adm-alerta" role="alert">{{ error() }}</p> }
    <div class="adm-campo" style="max-width:420px">
      <label for="buscar-miembro">Buscar por nombre o correo</label>
      <input id="buscar-miembro" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" placeholder="Buscar miembro">
    </div>
    <p class="adm-ayuda">{{ filtrados().length }} miembros · {{ activos() }} activos · {{ bloqueados() }} bloqueados</p>
    <div class="adm-panel">
      @if (cargando()) { <p role="status">Cargando miembros…</p> }
      @else if (!filtrados().length) { <p>No hay miembros que coincidan con la búsqueda.</p> }
      @else {
        <ul class="adm-cuentas">
          @for (u of filtrados(); track u.id) {
            <li class="adm-cuentas__fila">
              <span class="adm-yo__inicial" aria-hidden="true">{{ u.nombre.charAt(0) }}</span>
              <span class="adm-cuentas__datos">
                <strong>{{ u.nombre }}</strong><small>{{ u.email }}</small>
                <small>Alta: {{ u.creadoEn ? (u.creadoEn | date:'dd/MM/yyyy') : 'Sin fecha' }}</small>
              </span>
              <span class="adm-cuentas__estado">
                @if (!u.activo) { <span class="adm-estado" data-estado="archivado">Bloqueado</span> }
                @else if (u.bloqueado) { <span class="adm-estado" data-estado="borrador">Bloqueo temporal</span> }
                @else { <span class="adm-estado">Activo</span> }
                <small>{{ u.ultimoAccesoEn ? 'Último acceso: ' + (u.ultimoAccesoEn | date:'dd/MM/yyyy HH:mm') : 'Sin accesos' }}</small>
              </span>
              <span class="adm-cuentas__acciones">
                <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="seleccionar(u)">Gestionar</button>
              </span>
            </li>
          }
        </ul>
      }
    </div>

    @if (seleccionado(); as u) {
      <section class="adm-panel" aria-labelledby="gestion-titulo">
        <h2 id="gestion-titulo" class="adm-panel__titulo">Gestionar {{ u.nombre }}</h2>
        <p class="adm-ayuda">ID: {{ u.id }} · Cuenta de miembro · {{ u.email }}</p>
        <form [formGroup]="form" (ngSubmit)="guardar()" class="adm-form-linea">
          <div class="adm-campo">
            <label for="miembro-nombre">Nombre</label>
            <input id="miembro-nombre" formControlName="nombre" maxlength="120">
          </div>
          <div class="adm-campo">
            <label for="miembro-email">Correo electrónico</label>
            <input id="miembro-email" formControlName="email" type="email" maxlength="254">
          </div>
          <button type="submit" class="adm-btn adm-btn--oro" [disabled]="procesando() || form.invalid">Guardar datos</button>
        </form>
        <div class="adm-pila">
          <button type="button" class="adm-btn adm-btn--quieto" [disabled]="procesando()" (click)="restablecer(u)">Generar nueva contraseña</button>
          @if (u.activo) {
            <button type="button" class="adm-btn adm-btn--quieto" [disabled]="procesando()" (click)="cambiarBloqueo(u, true)">Bloquear acceso</button>
          } @else {
            <button type="button" class="adm-btn adm-btn--quieto" [disabled]="procesando()" (click)="cambiarBloqueo(u, false)">Desbloquear y activar</button>
          }
          <button type="button" class="adm-btn adm-btn--quieto" (click)="seleccionado.set(null)">Cerrar ficha</button>
        </div>
        @if (passwordTemporal(); as p) {
          <div class="adm-franja adm-franja--oro" role="status">
            <p>Contraseña temporal: <code class="adm-codigo">{{ p }}</code>. Muéstrala al usuario por un canal seguro; no se enviará por email.</p>
            <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="copiar(p)">Copiar contraseña</button>
            <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="passwordTemporal.set(null)">Ocultar</button>
          </div>
        }
      </section>
    }
  `
})
export class MiembrosAdminComponent implements OnInit {
  private readonly api = inject(MiembrosAdminService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmar = inject(ConfirmacionService);
  private readonly fb = inject(FormBuilder);
  readonly miembros = signal<MiembroAdmin[]>([]);
  readonly seleccionado = signal<MiembroAdmin | null>(null);
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordTemporal = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]]
  });

  readonly filtrados = () => {
    const termino = this.busqueda().trim().toLocaleLowerCase();
    return this.miembros().filter(u => !termino || (u.nombre + ' ' + u.email).toLocaleLowerCase().includes(termino));
  };
  readonly activos = () => this.miembros().filter(u => u.activo && !u.bloqueado).length;
  readonly bloqueados = () => this.miembros().filter(u => !u.activo || u.bloqueado).length;

  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: datos => { this.miembros.set(datos); this.cargando.set(false); },
      error: e => { this.cargando.set(false); this.error.set(mensajeDe(e)); }
    });
  }
  seleccionar(u: MiembroAdmin): void {
    this.seleccionado.set(u);
    this.passwordTemporal.set(null);
    this.form.reset({ nombre: u.nombre, email: u.email });
  }
  private actualizar(u: MiembroAdmin): void {
    this.miembros.update(xs => xs.map(x => x.id === u.id ? u : x));
    this.seleccionado.set(u);
  }
  guardar(): void {
    const u = this.seleccionado();
    if (!u || this.form.invalid || this.procesando()) return;
    this.procesando.set(true);
    const { nombre, email } = this.form.getRawValue();
    this.api.editar(u.id, nombre, email).subscribe({
      next: actualizado => { this.procesando.set(false); this.actualizar(actualizado); this.avisos.ok('Datos actualizados.'); },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  async cambiarBloqueo(u: MiembroAdmin, bloquear: boolean): Promise<void> {
    const ok = await this.confirmar.pedir({
      titulo: bloquear ? 'Bloquear miembro' : 'Desbloquear miembro',
      mensaje: bloquear ? 'La cuenta perderá el acceso inmediatamente y sus sesiones quedarán invalidadas.' : 'La cuenta podrá volver a iniciar sesión.',
      aceptar: bloquear ? 'Bloquear acceso' : 'Desbloquear',
      peligro: bloquear
    });
    if (!ok) return;
    this.procesando.set(true);
    const accion = bloquear ? this.api.bloquear(u.id) : this.api.desbloquear(u.id);
    accion.subscribe({
      next: actualizado => { this.procesando.set(false); this.actualizar(actualizado); this.avisos.ok(bloquear ? 'Miembro bloqueado.' : 'Miembro reactivado.'); },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  async restablecer(u: MiembroAdmin): Promise<void> {
    const ok = await this.confirmar.pedir({
      titulo: 'Restablecer contraseña',
      mensaje: 'Se generará una nueva contraseña temporal y se invalidarán las sesiones actuales del miembro.',
      aceptar: 'Generar contraseña'
    });
    if (!ok) return;
    const password = generarPassword();
    this.procesando.set(true);
    this.api.cambiarPassword(u.id, password).subscribe({
      next: actualizado => {
        this.procesando.set(false);
        this.actualizar(actualizado);
        this.passwordTemporal.set(password);
        this.avisos.ok('Contraseña restablecida.');
      },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  copiar(valor: string): void {
    navigator.clipboard.writeText(valor).then(() => this.avisos.ok('Contraseña copiada.'), () => this.avisos.error('No se ha podido copiar.'));
  }
}
