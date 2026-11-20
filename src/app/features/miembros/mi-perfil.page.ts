import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MiembroAuthService } from './miembro-auth.service';
import { MiPerfilService, PerfilBasicoMiembro } from './mi-perfil.service';

@Component({
  selector: 'csf-mi-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="perfil">
      <a routerLink="/mi-cuenta" class="volver">← Mi espacio</a>
      <div class="cabecera">
        <p class="etiqueta">TU IDENTIDAD FLAMENCA</p>
        <h1>Mi perfil</h1>
        <p>Preséntate a la comunidad con una ficha breve y auténtica.</p>
      </div>
      @if (cargando()) {
        <p role="status">Cargando tu perfil…</p>
      } @else if (error()) {
        <p role="alert" class="alerta">{{ error() }}</p>
        <button type="button" (click)="cargar()">Reintentar</button>
      } @else {
        <div class="tarjeta">
          <section class="fotografia" aria-labelledby="titulo-foto">
            <div class="avatar">
              @if (fotoUrl()) {
                <img [src]="fotoUrl()!" alt="Fotografía actual de perfil">
              } @else {
                <span aria-hidden="true">{{ form.controls.nombre.value.charAt(0).toUpperCase() || '♫' }}</span>
              }
            </div>
            <div>
              <h2 id="titulo-foto">Tu fotografía</h2>
              <p class="ayuda">JPEG, PNG o WebP. Máximo 5 MB. Se recortará visualmente en círculo.</p>
              <label class="subir" for="foto-miembro">Seleccionar imagen</label>
              <input id="foto-miembro" type="file" accept="image/png,image/jpeg,image/webp"
                     (change)="subirFoto($event)" [disabled]="subiendo()">
              @if (subiendo()) { <p role="status">Guardando fotografía…</p> }
            </div>
          </section>
          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="campo">
              <label for="perfil-nombre">Nombre <span aria-hidden="true">*</span></label>
              <input id="perfil-nombre" formControlName="nombre" maxlength="120" autocomplete="name">
            </div>
            <div class="campo">
              <label for="perfil-artistico">Nombre artístico <span class="opcional">(opcional)</span></label>
              <input id="perfil-artistico" formControlName="nombreArtistico" maxlength="160"
                     placeholder="Cómo te conoce el público">
            </div>
            <div class="campo">
              <label for="perfil-descripcion">Descripción breve <span class="opcional">(opcional)</span></label>
              <textarea id="perfil-descripcion" formControlName="descripcionBreve" rows="4" maxlength="300"
                        placeholder="Cuéntanos qué haces en el mundo del flamenco"></textarea>
              <p class="ayuda">{{ form.controls.descripcionBreve.value.length }}/300 caracteres</p>
            </div>
            <div class="dos-columnas">
              <div class="campo">
                <label for="perfil-localidad">Localidad <span class="opcional">(opcional)</span></label>
                <input id="perfil-localidad" formControlName="localidad" maxlength="120">
              </div>
              <div class="campo">
                <label for="perfil-provincia">Provincia <span class="opcional">(opcional)</span></label>
                <input id="perfil-provincia" formControlName="provincia" maxlength="100">
              </div>
            </div>
            <p class="ayuda">Por ahora esta ficha es privada. La futura página pública necesitará su propia revisión.</p>
            @if (mensaje()) { <p class="correcto" role="status">{{ mensaje() }}</p> }
            @if (errorGuardar()) { <p class="alerta" role="alert">{{ errorGuardar() }}</p> }
            <div class="acciones">
              <button type="submit" [disabled]="guardando() || form.invalid || !form.dirty">
                {{ guardando() ? 'Guardando…' : 'Guardar perfil' }}
              </button>
              <a routerLink="/mi-cuenta">Volver a mi espacio</a>
            </div>
          </form>
        </div>
      }
    </main>
  `,
  styles: [`
    .perfil{max-width:880px;margin:42px auto 90px;padding:0 20px;color:inherit}
    .volver{text-decoration:underline;font-size:.9rem}
    .cabecera{margin:24px 0}
    .etiqueta{font-size:.77rem;letter-spacing:.12em;font-weight:700;color:#b88b51}
    h1{font-size:clamp(2rem,4vw,2.7rem);margin:8px 0}
    .tarjeta{border:1px solid #cfc1ad;border-radius:14px;padding:clamp(18px,4vw,34px)}
    .fotografia{display:flex;align-items:center;gap:22px;padding-bottom:24px;margin-bottom:26px;border-bottom:1px solid #d9ccba}
    .fotografia h2{font-size:1.25rem;margin:0 0 8px}
    .avatar{width:100px;height:100px;border-radius:50%;background:#d4ad74;color:#271c10;flex:none;display:grid;place-items:center;overflow:hidden;font-size:2.7rem}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .subir{display:inline-block;padding:9px 14px;border:1px solid #a67a3a;border-radius:7px;cursor:pointer;font-weight:600}
    input[type=file]{display:block;max-width:100%;margin-top:8px;font-size:.78rem}
    form{display:grid;gap:19px}
    .campo{display:flex;flex-direction:column;gap:7px;min-width:0}
    .campo label{font-weight:650;font-size:.92rem}
    .campo input,.campo textarea{width:100%;box-sizing:border-box;border:1px solid #b6a995;border-radius:8px;background:#fff;color:#272119;padding:12px;font:inherit}
    .campo :is(input,textarea):focus-visible{outline:2px solid #a67a3a;outline-offset:2px}
    .opcional,.ayuda{font-size:.82rem;color:#776c5f;font-weight:400}
    .ayuda{margin:0;line-height:1.5}
    .dos-columnas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .acciones{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
    .acciones button,.perfil>button{background:#cda261;color:#20170e;border:0;border-radius:7px;padding:12px 21px;font:inherit;font-weight:700;cursor:pointer}
    button:disabled{opacity:.5;cursor:not-allowed}
    .acciones a{text-decoration:underline}
    .alerta{color:#a52828}.correcto{color:#27623d;font-weight:600}
    @media(max-width:540px){.fotografia{align-items:flex-start;flex-direction:column}.dos-columnas{grid-template-columns:1fr}.avatar{width:82px;height:82px}}
  `]
})
export class MiPerfilPage implements OnInit {
  private readonly api = inject(MiPerfilService);
  private readonly auth = inject(MiembroAuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly subiendo = signal(false);
  readonly fotoUrl = signal<string | null>(null);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly errorGuardar = signal('');
  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    nombreArtistico: ['', Validators.maxLength(160)],
    descripcionBreve: ['', Validators.maxLength(300)],
    localidad: ['', Validators.maxLength(120)],
    provincia: ['', Validators.maxLength(100)]
  });

  ngOnInit(): void {
    this.auth.comprobar().subscribe({
      next: sesion => { if (!sesion) this.router.navigateByUrl('/acceso'); else this.cargar(); },
      error: () => { this.cargando.set(false); this.error.set('No se pudo comprobar la sesión.'); }
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.consultar().subscribe({
      next: perfil => { this.actualizar(perfil); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set('No se ha podido cargar el perfil.'); }
    });
  }

  private actualizar(datos: PerfilBasicoMiembro): void {
    this.fotoUrl.set(datos.fotoUrl);
    this.form.reset({
      nombre: datos.nombre,
      nombreArtistico: datos.nombreArtistico ?? '',
      descripcionBreve: datos.descripcionBreve ?? '',
      localidad: datos.localidad ?? '',
      provincia: datos.provincia ?? ''
    });
  }

  guardar(): void {
    if (this.form.invalid || !this.form.dirty || this.guardando()) return;
    this.guardando.set(true);
    this.errorGuardar.set('');
    this.mensaje.set('');
    const datos = this.form.getRawValue();
    this.api.guardar(datos).subscribe({
      next: perfil => { this.actualizar(perfil); this.guardando.set(false); this.mensaje.set('Perfil guardado correctamente.'); },
      error: () => { this.guardando.set(false); this.errorGuardar.set('No se pudo guardar el perfil. Comprueba los campos e inténtalo de nuevo.'); }
    });
  }

  subirFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo || this.subiendo()) return;
    if (archivo.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.errorGuardar.set('Elige una imagen JPEG, PNG o WebP de menos de 5 MB.');
      input.value = '';
      return;
    }
    this.subiendo.set(true);
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.api.subirFoto(archivo).subscribe({
      next: perfil => {
        this.fotoUrl.set(perfil.fotoUrl);
        this.subiendo.set(false);
        this.mensaje.set('Fotografía actualizada.');
        input.value = '';
      },
      error: () => {
        this.subiendo.set(false);
        this.errorGuardar.set('No se pudo subir la fotografía. Comprueba su formato y dimensiones.');
        input.value = '';
      }
    });
  }
}
