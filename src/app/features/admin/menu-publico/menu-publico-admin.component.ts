import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MenuItem, MenuPublicoService } from '../../../menu-publico.service';

@Component({
  selector: 'adm-menu-publico',
  standalone: true,
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Gestión del menú público</h1>
        <p class="adm-subtitulo">Activa únicamente los apartados con contenido publicado.
          Las páginas y los datos no se borran cuando ocultas un enlace.</p>
      </div>
    </header>
    <section class="panel">
      @if (cargando()) { <p role="status">Cargando configuración…</p> }
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (exito()) { <p class="exito" role="status">{{ exito() }}</p> }
      @for (padre of padres(); track padre.clave) {
        <div class="item">
          <div class="fila">
            <div class="nombre">
              <strong>{{ padre.texto }}</strong>
              @if (padre.fijo) { <small>Enlace fijo · siempre visible</small> }
              @else if (hijos(padre.clave).length && !algunoVisible(padre.clave)) {
                <small>Sin submenús activos: se oculta automáticamente</small>
              }
            </div>
            <label class="selector">
              <input type="checkbox" [checked]="estado()[padre.clave]" [disabled]="padre.fijo || guardando()"
                     (change)="cambiar(padre.clave, $any($event.target).checked)">
              <span>{{ estado()[padre.clave] ? 'Activo' : 'Oculto' }}</span>
            </label>
          </div>
          @if (hijos(padre.clave).length) {
            <div class="submenus">
              @for (hijo of hijos(padre.clave); track hijo.clave) {
                <div class="fila secundaria">
                  <span>{{ hijo.texto }}</span>
                  <label class="selector">
                    <input type="checkbox" [checked]="estado()[hijo.clave]"
                           [disabled]="!estado()[padre.clave] || guardando()"
                           (change)="cambiar(hijo.clave, $any($event.target).checked)">
                    <span>{{ estado()[hijo.clave] ? 'Activo' : 'Oculto' }}</span>
                  </label>
                </div>
              }
            </div>
          }
        </div>
      }
      <div class="acciones">
        <button type="button" class="adm-btn adm-btn--oro" [disabled]="!hayCambios() || guardando() || cargando()"
                (click)="guardar()">{{ guardando() ? 'Guardando…' : 'Guardar configuración' }}</button>
        <button type="button" class="adm-btn adm-btn--quieto" [disabled]="!hayCambios() || guardando()"
                (click)="descartar()">Descartar cambios</button>
      </div>
      <p class="nota">Inicio, Acceso miembros y Hazte miembro no se pueden desactivar.
        Los cambios se aplican a los visitantes al cargar la página. Los enlaces ocultos no eliminan las rutas.</p>
    </section>
  `,
  styles: [`
    .panel{max-width:920px;background:var(--adm-fondo-tarjeta,#fff);border:1px solid #ddd3c4;
      border-radius:12px;padding:24px}
    .item{border-bottom:1px solid #e5dbcf;padding:12px 0}
    .fila{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px}
    .nombre{display:grid;gap:5px}.nombre small{color:#746858;font-size:.78rem}
    .selector{display:flex;align-items:center;gap:8px;white-space:nowrap;cursor:pointer}
    .selector input{width:18px;height:18px;accent-color:#b78a4b}
    .submenus{border-left:2px solid #d0b183;margin:9px 0 3px 16px;padding:0 0 0 16px}
    .secundaria{font-size:.91rem;padding:5px 0}
    .acciones{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0 12px}
    .error{color:#a12b2b}.exito{color:#176c39}.nota{font-size:.83rem;color:#746858;line-height:1.6}
  `]
})
export class MenuPublicoAdminComponent implements OnInit {
  private readonly api = inject(MenuPublicoService);
  readonly items = signal<MenuItem[]>([]);
  readonly estado = signal<Record<string, boolean>>({});
  readonly original = signal<Record<string, boolean>>({});
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');
  readonly padres = computed(() => this.items().filter(x => !x.padre)
    .sort((a,b) => a.posicion - b.posicion));
  readonly hayCambios = computed(() => Object.keys(this.estado())
    .some(k => this.estado()[k] !== this.original()[k]));

  ngOnInit():void {
    this.api.administrar().subscribe({
      next:items => {
        this.items.set(items);
        const estado = Object.fromEntries(items.map(x => [x.clave, x.activo]));
        this.estado.set(estado); this.original.set({...estado}); this.cargando.set(false);
      },
      error:() => { this.cargando.set(false); this.error.set('No se pudo cargar la configuración del menú.'); }
    });
  }
  hijos(clave:string):MenuItem[] {
    return this.items().filter(x => x.padre === clave).sort((a,b) => a.posicion - b.posicion);
  }
  algunoVisible(clave:string):boolean {
    return this.hijos(clave).some(x => this.estado()[x.clave]);
  }
  cambiar(clave:string, activo:boolean):void {
    const actual = this.items().find(x => x.clave === clave);
    if (!actual || actual.fijo || (actual.padre && !this.estado()[actual.padre])) return;
    this.estado.update(s => ({ ...s, [clave]: activo }));
    this.error.set('');this.exito.set('');
  }
  descartar():void { this.estado.set({...this.original()});this.error.set('');this.exito.set(''); }
  guardar():void {
    if(!this.hayCambios() || this.guardando())return;
    this.guardando.set(true);this.error.set('');this.exito.set('');
    const cambios = Object.entries(this.estado()).filter(([clave,activo]) =>
      activo !== this.original()[clave]).map(([clave,activo]) => ({clave,activo}));
    this.api.guardar(cambios).subscribe({
      next:items => {
        this.items.set(items);
        const estado = Object.fromEntries(items.map(x => [x.clave, x.activo]));
        this.estado.set(estado); this.original.set({...estado});
        this.guardando.set(false); this.exito.set('Menú público actualizado correctamente.');
      },
      error:()=> {
        this.guardando.set(false);
        this.error.set('No se pudo guardar. Comprueba tu sesión y vuelve a intentarlo.');
      }
    });
  }
}
