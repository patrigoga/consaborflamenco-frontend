import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { BaseDatosAdminService, ColumnaSql, PaginaSql, TablaSql } from './base-datos-admin.service';

@Component({
  selector: 'adm-base-datos',
  standalone: true,
  template: `
    <header class="adm-cabecera">
      <div>
        <h1 class="adm-titulo">Base de datos</h1>
        <p class="adm-subtitulo">Consulta las tablas de ConSaborFlamenco sin modificar registros. Campos confidenciales ocultos.</p>
      </div>
    </header>
    <div class="explorador">
      <aside class="explorador__lateral" aria-label="Tablas disponibles">
        <label for="filtrar-tablas">Buscar tabla</label>
        <input id="filtrar-tablas" type="search" [value]="filtroTablas()"
               (input)="filtroTablas.set($any($event.target).value)" placeholder="Ej. captacion">
        <p class="explorador__contador">{{ tablasFiltradas().length }} tablas</p>
        @if (cargandoTablas()) { <p role="status">Cargando tablas…</p> }
        @else {
          <nav class="explorador__menu" aria-label="Seleccionar tabla">
            @for (t of tablasFiltradas(); track t.nombre) {
              <button type="button" [class.seleccionada]="seleccionada() === t.nombre"
                      [attr.aria-current]="seleccionada() === t.nombre ? 'page' : null"
                      (click)="abrir(t.nombre)">
                <span>{{ t.nombre }}</span><small>{{ t.grupo }}</small>
              </button>
            } @empty { <p>No hay tablas con ese nombre.</p> }
          </nav>
        }
      </aside>
      <section class="explorador__contenido" aria-label="Registros de la tabla">
        @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
        @if (!seleccionada()) {
          <div class="explorador__vacio">
            <h2>Selecciona una tabla</h2>
            <p>Verás sus columnas y registros con paginación. No se pueden ejecutar consultas SQL ni modificar datos desde aquí.</p>
          </div>
        } @else {
          <div class="explorador__cabecera">
            <div>
              <p class="explorador__eyebrow">TABLA SELECCIONADA</p>
              <h2>{{ seleccionada() }}</h2>
              @if (contenido()) {
                <p>{{ contenido()!.total }} registros · {{ visibles().length }} columnas visibles</p>
              }
            </div>
            <button type="button" class="adm-btn adm-btn--quieto" [disabled]="cargandoDatos()" (click)="recargar()">Actualizar</button>
          </div>
          <form class="explorador__filtros" (submit)="buscar($event)">
            <label for="buscar-registros">Filtrar registros</label>
            <input id="buscar-registros" type="search" [value]="textoBusqueda()"
                   (input)="textoBusqueda.set($any($event.target).value)"
                   placeholder="Buscar en columnas de texto">
            <button type="submit" class="adm-btn adm-btn--oro" [disabled]="cargandoDatos()">Buscar</button>
            <button type="button" class="adm-btn adm-btn--quieto" [disabled]="cargandoDatos()" (click)="limpiar()">Limpiar</button>
          </form>
          @if (cargandoDatos()) { <p role="status">Cargando registros…</p> }
          @if (contenido(); as datos) {
            @if (ocultas().length) {
              <p class="explorador__aviso">Ocultas por seguridad: {{ ocultas().join(', ') }}.</p>
            }
            @if (!datos.filas.length) {
              <div class="explorador__vacio"><p>Esta página no contiene registros.</p></div>
            } @else {
              <div class="explorador__tabla" tabindex="0" role="region" [attr.aria-label]="'Datos de la tabla ' + datos.tabla">
                <table>
                  <thead><tr>
                    @for (col of visibles(); track col.nombre) {
                      <th scope="col">{{ col.nombre }}<small>{{ col.tipo }}</small></th>
                    }
                  </tr></thead>
                  <tbody>
                    @for (fila of datos.filas; track $index) {
                      <tr>
                        @for (col of visibles(); track col.nombre) {
                          <td><span [title]="representar(fila[col.nombre])">{{ representar(fila[col.nombre]) }}</span></td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            <div class="explorador__paginacion">
              <span>Mostrando {{ datos.total ? datos.pagina * datos.limite + 1 : 0 }}–{{ Math.min((datos.pagina + 1) * datos.limite, datos.total) }} de {{ datos.total }}</span>
              <div>
                <button type="button" class="adm-btn adm-btn--quieto" [disabled]="datos.pagina === 0 || cargandoDatos()" (click)="cambiarPagina(-1)">Anterior</button>
                <span>Página {{ datos.pagina + 1 }}</span>
                <button type="button" class="adm-btn adm-btn--quieto" [disabled]="(datos.pagina + 1) * datos.limite >= datos.total || cargandoDatos()" (click)="cambiarPagina(1)">Siguiente</button>
              </div>
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .explorador{display:grid;grid-template-columns:minmax(210px,260px) minmax(0,1fr);gap:18px;align-items:start}
    .explorador__lateral,.explorador__contenido{background:var(--adm-fondo-tarjeta,#fff);border:1px solid #dfd7cb;border-radius:12px;padding:18px;min-width:0}
    .explorador__lateral label,.explorador__filtros label{display:block;font-weight:650;font-size:.87rem;margin-bottom:7px}
    .explorador__lateral input,.explorador__filtros input{width:100%;max-width:100%;padding:10px;border:1px solid #b9b0a4;border-radius:7px;background:white;color:#29231d;font:inherit;box-sizing:border-box}
    .explorador__contador{font-size:.78rem;opacity:.7;margin:9px 0}
    .explorador__menu{display:grid;gap:3px;max-height:65vh;overflow:auto}
    .explorador__menu button{text-align:left;border:0;border-radius:7px;background:transparent;padding:9px 10px;display:grid;gap:3px;cursor:pointer;min-width:0;color:inherit}
    .explorador__menu button span{font-weight:650;overflow-wrap:anywhere;font-size:.86rem}
    .explorador__menu button small{opacity:.64;font-size:.73rem}
    .explorador__menu button:hover,.explorador__menu button.seleccionada{background:#eee4d2}
    .explorador__cabecera{display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap}
    .explorador__cabecera h2{font-size:1.3rem;overflow-wrap:anywhere;margin:0}
    .explorador__cabecera p{margin:7px 0;font-size:.84rem;opacity:.7}
    .explorador__eyebrow{font-weight:700;letter-spacing:.12em;font-size:.72rem!important}
    .explorador__filtros{display:flex;gap:9px;align-items:end;flex-wrap:wrap;margin:20px 0}
    .explorador__filtros label{width:100%;margin:0}
    .explorador__filtros input{flex:1;min-width:160px}
    .explorador__tabla{width:100%;overflow:auto;border:1px solid #dfd7cb;border-radius:8px;max-height:68vh}
    .explorador__tabla table{border-collapse:collapse;width:max-content;min-width:100%;font-size:.8rem}
    .explorador__tabla th,.explorador__tabla td{padding:10px 12px;border-bottom:1px solid #eee8df;text-align:left;vertical-align:top;max-width:290px;white-space:nowrap}
    .explorador__tabla th{position:sticky;top:0;background:#f4eee5;z-index:1}
    .explorador__tabla th small{display:block;opacity:.55;font-weight:400}
    .explorador__tabla tr:nth-child(even){background:#fbf9f5}
    .explorador__tabla td span{display:block;max-width:270px;overflow:hidden;text-overflow:ellipsis}
    .explorador__aviso{font-size:.78rem;color:#78614b;margin:10px 0}
    .explorador__paginacion{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:18px;font-size:.85rem}
    .explorador__paginacion>div{display:flex;gap:10px;align-items:center}
    .explorador__vacio{padding:32px 16px;text-align:center;opacity:.8}
    .error{color:#a12b2b}
    @media(max-width:760px){.explorador{grid-template-columns:1fr}.explorador__menu{max-height:180px}.explorador__lateral,.explorador__contenido{padding:12px}}
  `]
})
export class BaseDatosAdminComponent implements OnInit {
  private readonly api = inject(BaseDatosAdminService);
  readonly Math = Math;
  readonly tablas = signal<TablaSql[]>([]);
  readonly filtroTablas = signal('');
  readonly seleccionada = signal<string | null>(null);
  readonly contenido = signal<PaginaSql | null>(null);
  readonly pagina = signal(0);
  readonly busqueda = signal('');
  readonly textoBusqueda = signal('');
  readonly cargandoTablas = signal(true);
  readonly cargandoDatos = signal(false);
  readonly error = signal('');
  readonly tablasFiltradas = computed(() => this.tablas().filter(t =>
    t.nombre.toLocaleLowerCase().includes(this.filtroTablas().toLocaleLowerCase())
    || t.grupo.toLocaleLowerCase().includes(this.filtroTablas().toLocaleLowerCase())));
  readonly visibles = computed(() => this.contenido()?.columnas.filter(c => !c.oculta) ?? []);
  readonly ocultas = computed(() => this.contenido()?.columnas.filter(c => c.oculta).map(c => c.nombre) ?? []);

  ngOnInit(): void {
    this.api.tablas().subscribe({
      next: tablas => {
        this.tablas.set(tablas);
        this.cargandoTablas.set(false);
        if (tablas.length) this.abrir(tablas.find(t => t.nombre === 'captacion')?.nombre || tablas[0].nombre);
      },
      error: () => { this.cargandoTablas.set(false); this.error.set('No fue posible cargar las tablas.'); }
    });
  }

  abrir(nombre: string): void {
    this.seleccionada.set(nombre);
    this.pagina.set(0);
    this.busqueda.set('');
    this.textoBusqueda.set('');
    this.cargar();
  }
  buscar(evento: Event): void {
    evento.preventDefault();
    this.pagina.set(0);
    this.busqueda.set(this.textoBusqueda().trim());
    this.cargar();
  }
  limpiar(): void {
    this.pagina.set(0); this.busqueda.set(''); this.textoBusqueda.set(''); this.cargar();
  }
  recargar(): void { this.cargar(); }
  cambiarPagina(delta: number): void { this.pagina.update(p => Math.max(0, p + delta)); this.cargar(); }

  private cargar(): void {
    const tabla = this.seleccionada();
    if (!tabla) return;
    this.cargandoDatos.set(true);
    this.contenido.set(null);
    this.error.set('');
    this.api.contenido(tabla, this.pagina(), 25, this.busqueda()).subscribe({
      next: datos => {
        if (this.seleccionada() !== tabla) return;
        this.contenido.set(datos);
        this.cargandoDatos.set(false);
      },
      error: err => {
        if (this.seleccionada() !== tabla) return;
        this.cargandoDatos.set(false);
        this.contenido.set(null);
        this.error.set(err.status === 403 ? 'No tienes acceso a esta sección.' : 'No se pudieron consultar los registros.');
      }
    });
  }
  representar(valor: unknown): string {
    if (valor === null || valor === undefined) return '—';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }
}
