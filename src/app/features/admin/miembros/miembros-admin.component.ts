import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmacionService } from '../core/confirmacion.service';
import { AvisosService } from '../core/avisos.service';
import { mensajeDe } from '../core/errores';
import { generarPassword } from '../ui/password';
import { MiembroAdmin, MiembrosAdminService, PerfilMiembro, PermisosMiembro, RegistroAuditoriaMiembro } from './miembros-admin.service';

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
            <input id="miembro-email" formControlName="email" type="email" maxlength="254" readonly>
            <p class="adm-ayuda">El correo actual no se cambia hasta que se confirme desde la dirección nueva.</p>
          </div>
          <div class="adm-campo">
            <label for="nuevo-email">Solicitar cambio de correo</label>
            <input id="nuevo-email" type="email" maxlength="254" autocomplete="off"
                   [value]="nuevoEmail()" (input)="nuevoEmail.set($any($event.target).value)"
                   placeholder="nuevo@ejemplo.com">
            <button type="button" class="adm-btn adm-btn--quieto"
                    [disabled]="procesando() || !nuevoEmail().includes('@')"
                    (click)="solicitarNuevoCorreo(u)">Enviar verificación</button>
            <p class="adm-ayuda">Necesita SMTP configurado. El enlace caduca a las 24 horas y solo funciona una vez.</p>
          </div>
          <button type="submit" class="adm-btn adm-btn--oro" [disabled]="procesando() || form.invalid">Guardar datos</button>
        </form>
        <div class="adm-pila">
          <button type="button" class="adm-btn adm-btn--quieto" [disabled]="procesando()" (click)="restablecer(u)">Generar nueva contraseña</button>
          @if (u.activo) {
            <div class="adm-campo">
              <label for="motivo-suspension">Motivo de suspensión (obligatorio, entre 5 y 500 caracteres)</label>
              <textarea id="motivo-suspension" maxlength="500" rows="3" [value]="motivo()"
                        (input)="motivo.set($any($event.target).value)"></textarea>
              <button type="button" class="adm-btn adm-btn--quieto"
                      [disabled]="procesando() || motivo().trim().length < 5"
                      (click)="cambiarBloqueo(u, true)">Suspender miembro</button>
            </div>
          } @else {
            <button type="button" class="adm-btn adm-btn--quieto" [disabled]="procesando()" (click)="cambiarBloqueo(u, false)">Desbloquear y activar</button>
          }
          <button type="button" class="adm-btn adm-btn--quieto" (click)="seleccionado.set(null)">Cerrar ficha</button>
          <section class="adm-panel">
            <h3>Zona de eliminación definitiva</h3>
            <p class="adm-ayuda">Esta operación es irreversible. Solo podrá eliminarse la cuenta si no tiene eventos ni perfiles públicos o profesionales aprobados vinculados. Se eliminarán también sus registros de prueba dependientes.</p>
            <label for="confirmar-eliminar">Escribe ELIMINAR para habilitar el borrado</label>
            <input id="confirmar-eliminar" [value]="textoEliminacion()"
                   (input)="textoEliminacion.set($any($event.target).value)"
                   autocomplete="off" maxlength="8">
            <button type="button" class="adm-btn adm-btn--quieto"
                    [disabled]="procesando() || textoEliminacion() !== 'ELIMINAR'"
                    (click)="eliminarMiembro(u)">Eliminar definitivamente esta cuenta</button>
          </section>
        </div>
        @if (u.suspensionMotivo) {
          <p class="adm-franja"><strong>Motivo de suspensión:</strong> {{ u.suspensionMotivo }}
            @if (u.suspensionEn) { · {{ u.suspensionEn | date:'dd/MM/yyyy HH:mm' }} }
          </p>
        }
        <section class="adm-panel permisos-panel" aria-labelledby="permisos-titulo">
          <div class="permisos-encabezado">
            <h3 id="permisos-titulo">Permisos de contenido</h3>
            <p class="adm-ayuda">Configura lo que puede gestionar este miembro. Todas las publicaciones seguirán sujetas a moderación.</p>
          </div>
          <div class="permisos-lista">
            <label class="permiso-fila">
              <span class="permiso-info">
                <strong>Crear eventos</strong>
                <small>Enviar eventos a revisión.</small>
              </span>
              <input class="permiso-check" type="checkbox" [checked]="permisos().crearEventos"
                     (change)="marcarPermiso('crearEventos', $any($event.target).checked)">
            </label>
            <label class="permiso-fila">
              <span class="permiso-info">
                <strong>Crear cursos</strong>
                <small>Proponer cursos y talleres.</small>
              </span>
              <input class="permiso-check" type="checkbox" [checked]="permisos().crearCursos"
                     (change)="marcarPermiso('crearCursos', $any($event.target).checked)">
            </label>
            <label class="permiso-fila">
              <span class="permiso-info">
                <strong>Enviar artículos</strong>
                <small>Preparar contenidos para revisión.</small>
              </span>
              <input class="permiso-check" type="checkbox" [checked]="permisos().publicarArticulos"
                     (change)="marcarPermiso('publicarArticulos', $any($event.target).checked)">
            </label>
            <label class="permiso-fila">
              <span class="permiso-info">
                <strong>Editar biografía</strong>
                <small>Actualizar los datos del perfil autorizado.</small>
              </span>
              <input class="permiso-check" type="checkbox" [checked]="permisos().editarBiografia"
                     (change)="marcarPermiso('editarBiografia', $any($event.target).checked)">
            </label>
          </div>
          <div class="permisos-acciones">
            <button type="button" class="adm-btn adm-btn--oro" [disabled]="procesando()"
                    (click)="guardarPermisos(u)">Guardar permisos</button>
          </div>
        </section>
        <section class="adm-panel">
          <h3>Perfiles profesionales</h3>
          <p class="adm-ayuda">El perfil es una solicitud revisable. No vincula automáticamente fichas públicas ya existentes.</p>
          <div class="adm-form-linea">
            <div class="adm-campo">
              <label for="tipo-perfil">Tipo</label>
              <select id="tipo-perfil" [value]="tipoPerfil()" (change)="tipoPerfil.set($any($event.target).value)">
                <option value="ARTISTA">Artista</option>
                <option value="ACADEMIA">Academia</option>
                <option value="PENA">Peña</option>
                <option value="ASOCIACION">Asociación</option>
                <option value="TIENDA">Tienda</option>
                <option value="ORGANIZADOR">Organizador</option>
              </select>
            </div>
            <div class="adm-campo">
              <label for="nombre-perfil">Nombre profesional</label>
              <input id="nombre-perfil" [value]="nombrePerfil()" maxlength="160" (input)="nombrePerfil.set($any($event.target).value)">
            </div>
            <button type="button" class="adm-btn" [disabled]="procesando() || nombrePerfil().trim().length < 2"
                    (click)="crearPerfil(u)">Añadir perfil</button>
          </div>
          <ul>
            @for (p of perfiles(); track p.id) {
              <li>{{ p.nombre }} · {{ p.tipo }} · {{ p.estado }}
                @if (p.estado === 'PENDIENTE') {
                  <button type="button" class="adm-btn adm-btn--peq" [disabled]="procesando()" (click)="revisarPerfil(u, p, 'APROBADO')">Aprobar</button>
                  <button type="button" class="adm-btn adm-btn--peq" [disabled]="procesando()" (click)="revisarPerfil(u, p, 'RECHAZADO')">Rechazar</button>
                }
              </li>
            } @empty { <li>Sin perfiles profesionales asignados.</li> }
          </ul>
        </section>
        <section class="adm-panel">
          <h3>Historial administrativo</h3>
          <p class="adm-ayuda">Últimas 200 acciones registradas. Incluye la identidad de quien efectuó cada cambio.</p>
          <ul>
            @for (a of historial(); track a.id) {
              <li><strong>{{ a.fecha | date:'dd/MM/yyyy HH:mm' }}</strong> · {{ a.accion }} · Admin ID {{ a.administradorId }}
                @if (a.detalle) { — {{ a.detalle }} }
              </li>
            } @empty { <li>Sin acciones registradas desde la activación de esta función.</li> }
          </ul>
        </section>
        @if (passwordTemporal(); as p) {
          <div class="adm-franja adm-franja--oro" role="status">
            <p>Contraseña temporal: <code class="adm-codigo">{{ p }}</code>. Muéstrala al usuario por un canal seguro; no se enviará por email.</p>
            <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="copiar(p)">Copiar contraseña</button>
            <button type="button" class="adm-btn adm-btn--quieto adm-btn--peq" (click)="passwordTemporal.set(null)">Ocultar</button>
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .permisos-panel { padding: 24px; }
    .permisos-encabezado h3 { margin: 0 0 6px; font-size: 1.13rem; }
    .permisos-encabezado .adm-ayuda { margin: 0 0 18px; line-height: 1.5; }
    .permisos-lista { max-width: 720px; border: 1px solid #e7dfd3; border-radius: 10px; overflow: hidden; background: #fff; }
    .permiso-fila { display: grid; grid-template-columns: minmax(0, 1fr) 22px; gap: 20px; align-items: center; padding: 13px 18px; cursor: pointer; min-height: 60px; }
    .permiso-fila + .permiso-fila { border-top: 1px solid #eee8df; }
    .permiso-fila:hover { background: #fcfaf6; }
    .permiso-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .permiso-info strong { font-size: .93rem; line-height: 1.3; font-weight: 600; }
    .permiso-info small { font-size: .8rem; line-height: 1.4; color: #6c6258; font-weight: 400; }
    .permisos-lista .permiso-check { appearance: auto !important; width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; max-width: 18px !important; margin: 0 !important; padding: 0 !important; border-radius: 3px; accent-color: #a67a3a; justify-self: end; cursor: pointer; box-shadow: none; }
    .permisos-lista .permiso-check:focus-visible { outline: 2px solid #a67a3a; outline-offset: 3px; }
    .permisos-acciones { display: flex; justify-content: flex-end; margin-top: 18px; }
    .permisos-acciones .adm-btn { width: auto; min-width: 172px; padding: 10px 22px; }
    @media (max-width: 600px) {
      .permisos-panel { padding: 16px; }
      .permiso-fila { gap: 12px; padding: 12px; }
      .permisos-acciones .adm-btn { width: 100%; }
    }
  `]
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
  readonly motivo = signal('');
  readonly textoEliminacion = signal('');
  readonly nuevoEmail = signal('');
  readonly perfiles = signal<PerfilMiembro[]>([]);
  readonly historial = signal<RegistroAuditoriaMiembro[]>([]);
  readonly tipoPerfil = signal('ARTISTA');
  readonly nombrePerfil = signal('');
  readonly permisos = signal<PermisosMiembro>({
    crearEventos: false, crearCursos: false, publicarArticulos: false, editarBiografia: false
  });
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
    this.motivo.set('');
    this.textoEliminacion.set('');
    this.nuevoEmail.set('');
    this.permisos.set({
      crearEventos: u.puedeCrearEventos, crearCursos: u.puedeCrearCursos,
      publicarArticulos: u.puedePublicarArticulos, editarBiografia: u.puedeEditarBiografia
    });
    this.actualizarListas(u.id);
  }
  private actualizar(u: MiembroAdmin): void {
    this.miembros.update(xs => xs.map(x => x.id === u.id ? u : x));
    this.seleccionado.set(u);
  }
  private actualizarListas(id: number): void {
    this.api.perfiles(id).subscribe({
      next: datos => this.perfiles.set(datos),
      error: e => this.avisos.error(mensajeDe(e))
    });
    this.api.historial(id).subscribe({
      next: datos => this.historial.set(datos),
      error: e => this.avisos.error(mensajeDe(e))
    });
  }
  marcarPermiso(clave: keyof PermisosMiembro, valor: boolean): void {
    this.permisos.update(p => ({ ...p, [clave]: valor }));
  }
  guardarPermisos(u: MiembroAdmin): void {
    if (this.procesando()) return;
    this.procesando.set(true);
    this.api.actualizarPermisos(u.id, this.permisos()).subscribe({
      next: actualizado => {
        this.procesando.set(false);
        this.actualizar(actualizado);
        this.actualizarListas(u.id);
        this.avisos.ok('Permisos actualizados.');
      },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  crearPerfil(u: MiembroAdmin): void {
    if (this.procesando()) return;
    this.procesando.set(true);
    this.api.crearPerfil(u.id, this.tipoPerfil(), this.nombrePerfil()).subscribe({
      next: () => {
        this.procesando.set(false);
        this.nombrePerfil.set('');
        this.actualizarListas(u.id);
        this.avisos.ok('Perfil creado y pendiente de revisión.');
      },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  revisarPerfil(u: MiembroAdmin, p: PerfilMiembro, estado: 'APROBADO' | 'RECHAZADO'): void {
    if (this.procesando()) return;
    this.procesando.set(true);
    this.api.revisarPerfil(u.id, p.id, estado).subscribe({
      next: () => {
        this.procesando.set(false);
        this.actualizarListas(u.id);
        this.avisos.ok('Estado del perfil actualizado.');
      },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  solicitarNuevoCorreo(u: MiembroAdmin): void {
    if (this.procesando()) return;
    this.procesando.set(true);
    this.api.solicitarCambioCorreo(u.id, this.nuevoEmail()).subscribe({
      next: () => {
        this.procesando.set(false);
        this.nuevoEmail.set('');
        this.actualizarListas(u.id);
        this.avisos.ok('Enlace de verificación enviado. El correo actual seguirá activo hasta la confirmación.');
      },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  guardar(): void {
    const u = this.seleccionado();
    if (!u || this.form.invalid || this.procesando()) return;
    this.procesando.set(true);
    const { nombre, email } = this.form.getRawValue();
    this.api.editar(u.id, nombre, email).subscribe({
      next: actualizado => { this.procesando.set(false); this.actualizar(actualizado); this.actualizarListas(u.id); this.avisos.ok('Datos actualizados.'); },
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
    const accion = bloquear ? this.api.bloquear(u.id, this.motivo()) : this.api.desbloquear(u.id);
    accion.subscribe({
      next: actualizado => { this.procesando.set(false); this.actualizar(actualizado); this.actualizarListas(u.id); this.avisos.ok(bloquear ? 'Miembro suspendido.' : 'Miembro reactivado.'); },
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
        this.actualizarListas(u.id);
        this.passwordTemporal.set(password);
        this.avisos.ok('Contraseña restablecida.');
      },
      error: e => { this.procesando.set(false); this.avisos.error(mensajeDe(e)); }
    });
  }
  async eliminarMiembro(u: MiembroAdmin): Promise<void> {
    if (this.procesando() || this.textoEliminacion() !== 'ELIMINAR') return;
    const confirmado = await this.confirmar.pedir({
      titulo: 'Eliminar definitivamente a ' + u.nombre,
      mensaje: 'Se borrará permanentemente la cuenta ' + u.email
        + ' (ID ' + u.id + ') y sus registros de prueba dependientes. Esta acción no se puede deshacer.',
      aceptar: 'Eliminar definitivamente',
      peligro: true
    });
    if (!confirmado) return;
    this.procesando.set(true);
    this.api.eliminar(u.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.miembros.update(xs => xs.filter(x => x.id !== u.id));
        this.seleccionado.set(null);
        this.textoEliminacion.set('');
        this.avisos.ok('Cuenta eliminada definitivamente.');
      },
      error: err => {
        this.procesando.set(false);
        this.avisos.error(mensajeDe(err));
      }
    });
  }
  copiar(valor: string): void {
    navigator.clipboard.writeText(valor).then(() => this.avisos.ok('Contraseña copiada.'), () => this.avisos.error('No se ha podido copiar.'));
  }
}
