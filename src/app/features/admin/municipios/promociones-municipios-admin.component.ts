import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface Municipio { id: number; nombre: string; provincia: string; }
interface Promocion {
  tipo: 'HERO' | 'BANNER'; posicion: number; titulo: string; subtitulo: string | null;
  descripcion: string | null; imagen_url: string | null; cta_texto: string | null;
  cta_url: string | null; anunciante: string | null; es_publicidad: boolean;
  activo: boolean; visible_desde: string | null; visible_hasta: string | null;
}
interface Formulario {
  titulo: string; subtitulo: string; descripcion: string; imagenUrl: string;
  ctaTexto: string; ctaUrl: string; anunciante: string; esPublicidad: boolean;
  activo: boolean; visibleDesde: string; visibleHasta: string;
}
function formularioVacio(): Formulario {
  return { titulo:'', subtitulo:'', descripcion:'', imagenUrl:'', ctaTexto:'', ctaUrl:'',
    anunciante:'', esPublicidad:false, activo:true, visibleDesde:'', visibleHasta:'' };
}

/** Edición administrativa de los seis espacios comerciales/culturales de un municipio. */
@Component({
  selector: 'adm-promociones-municipios',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="gestor">
      <header><h1>Destacados y publicidad municipal</h1>
        <p>Configura tres cabeceras y tres banners por municipio. Los anuncios se identificarán como publicidad.</p></header>

      <form class="localizador" (submit)="buscarMunicipios($event)">
        <label for="buscar-municipio">Buscar municipio</label>
        <div><input id="buscar-municipio" name="buscar" [(ngModel)]="consulta" (ngModelChange)="programarBusqueda()" maxlength="100" placeholder="Montilla, Utrera…">
        <button type="submit">Buscar</button></div>
      </form>
      <label for="elegir-municipio">Seleccionar municipio</label>
      @if (buscando()) { <p class="nota" role="status">Buscando municipios…</p> }
      @else if (consulta.trim() && municipios().length === 0 && !error()) { <p class="nota" role="status">No se encontraron municipios. Comprueba la búsqueda.</p> }
      @else if (consulta.trim() && municipios().length > 1) { <p class="nota">Hay {{ municipios().length }} coincidencias; selecciona la correcta indicando su provincia.</p> }
      <select id="elegir-municipio" [value]="municipioId()" (change)="elegirMunicipio(+$any($event.target).value)" name="municipio">
        <option value="0">Seleccionar…</option>
        @for (m of municipios(); track m.id) {
          <option [value]="m.id">{{ m.nombre }} ({{ m.provincia }})</option>
        }
      </select>
      @if (municipioId() > 0) {
        <p><a [routerLink]="['/municipios', municipioId()]" target="_blank" rel="noopener">Ver portada pública ↗</a></p>
        <div class="posiciones">
          <label>Formato
            <select [(ngModel)]="tipo" (ngModelChange)="cambiarEspacio()">
              <option value="HERO">Cabecera grande</option><option value="BANNER">Banner pequeño</option>
            </select>
          </label>
          <label>Posición
            <select [(ngModel)]="posicion" (ngModelChange)="cambiarEspacio()">
              <option [ngValue]="1">1</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option>
            </select>
          </label>
        </div>
        <p class="nota">Espacio {{ posicion }} de 3 · {{ tipo === 'HERO' ? 'Slider municipal' : 'Publicidad compacta' }}</p>
        <form class="campos" (ngSubmit)="guardar()">
          <label>Título * <input name="titulo" [(ngModel)]="datos.titulo" maxlength="180" required></label>
          <label>Subtítulo <input name="subtitulo" [(ngModel)]="datos.subtitulo" maxlength="180"></label>
          <label>Descripción breve <textarea name="descripcion" [(ngModel)]="datos.descripcion" rows="3" maxlength="350"></textarea></label>
          <label>URL de la imagen (HTTPS o ruta interna)
            <input name="imagenUrl" [(ngModel)]="datos.imagenUrl" maxlength="1024" placeholder="https://…">
          </label>
          <div class="dos">
            <label>Texto del botón
              <input name="ctaTexto" [(ngModel)]="datos.ctaTexto" maxlength="80" placeholder="Conocer más"></label>
            <label>URL del botón
              <input name="ctaUrl" [(ngModel)]="datos.ctaUrl" maxlength="1024" placeholder="https://… o /revista/…"></label>
          </div>
          <label class="casilla"><input type="checkbox" name="publicidad" [(ngModel)]="datos.esPublicidad">
            Es un anuncio de pago (se etiquetará «Publicidad»)</label>
          @if (datos.esPublicidad) {
            <label>Anunciante * <input name="anunciante" [(ngModel)]="datos.anunciante" maxlength="180" required></label>
          }
          <div class="dos">
            <label>Visible desde (opcional) <input type="datetime-local" name="desde" [(ngModel)]="datos.visibleDesde"></label>
            <label>Visible hasta (opcional) <input type="datetime-local" name="hasta" [(ngModel)]="datos.visibleHasta"></label>
          </div>
          <label class="casilla"><input type="checkbox" name="activo" [(ngModel)]="datos.activo"> Espacio activo</label>
          @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
          @if (exito()) { <p role="status" class="exito">{{ exito() }}</p> }
          <div class="acciones">
            <button type="submit" [disabled]="guardando() || !datos.titulo.trim()">Guardar espacio</button>
            <button type="button" (click)="desactivar()" [disabled]="guardando() || !espacioGuardado()">Desactivar</button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    .gestor{max-width:1000px;padding:20px 24px 60px;margin:auto;color:inherit}
    header{margin-bottom:32px}h1{font-size:clamp(1.6rem,3vw,2.2rem)}header p{max-width:700px;line-height:1.5}
    .localizador{margin:10px 0 20px}.localizador div{display:flex;gap:10px}
    .localizador input{flex:1}.posiciones,.dos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    label{display:flex;flex-direction:column;gap:7px;font-weight:650;margin:12px 0}
    input,select,textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #a99d8c;border-radius:7px;background:#fff;color:#211b14;font:inherit}
    .casilla{flex-direction:row;align-items:center;font-weight:450}
    .casilla input{width:auto}
    .nota{font-size:.84rem;color:#88745f}
    .campos{margin-top:16px;padding:20px;border:1px solid #c7b9a6;border-radius:12px}
    .acciones{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
    button{padding:10px 18px;border:1px solid #a77c43;border-radius:7px;background:#d2a15f;color:#20170c;font:inherit;font-weight:700;cursor:pointer}
    button:disabled{opacity:.55;cursor:not-allowed}.error{color:#a52d2d}.exito{color:#216d42}
    @media(max-width:650px){.dos,.posiciones{grid-template-columns:1fr}.localizador div{flex-direction:column}}
  `]
})
export class PromocionesMunicipiosAdminComponent implements OnInit, OnDestroy {
  private readonly http=inject(HttpClient);
  consulta='';
  readonly municipios=signal<Municipio[]>([]);
  readonly buscando=signal(false);
  private busquedaActual=0;
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  private cargaActual=0;
  readonly municipioId=signal(0);
  readonly error=signal('');
  readonly exito=signal('');
  readonly guardando=signal(false);
  readonly espacioGuardado=signal(false);
  readonly filas=signal<Promocion[]>([]);
  tipo: 'HERO' | 'BANNER'='HERO';
  posicion=1;
  datos: Formulario=formularioVacio();

  ngOnInit(): void { this.cargarMunicipios(); }
  ngOnDestroy(): void {
    clearTimeout(this.temporizadorBusqueda);
    ++this.busquedaActual;
    ++this.cargaActual;
  }
  /** Evita consultar el backend por cada tecla y descarta búsquedas anteriores. */
  programarBusqueda(): void {
    clearTimeout(this.temporizadorBusqueda);
    ++this.busquedaActual;
    this.buscando.set(true);
    this.temporizadorBusqueda = setTimeout(() => this.cargarMunicipios(), 300);
  }
  buscarMunicipios(e: Event): void {
    e.preventDefault();
    clearTimeout(this.temporizadorBusqueda);
    this.cargarMunicipios();
  }
  cargarMunicipios(): void {
    clearTimeout(this.temporizadorBusqueda);
    const busqueda = this.consulta.trim();
    const revision = ++this.busquedaActual;
    this.buscando.set(true);
    this.error.set('');
    this.http.get<Municipio[]>('/api/v1/territorio/municipios',
      {params:new HttpParams().set('q',busqueda)}).subscribe({
      next: res => {
        if (revision !== this.busquedaActual) return;
        this.buscando.set(false);
        this.municipios.set(res);
        // Si la búsqueda devuelve un único municipio, elegirlo también carga sus espacios.
        if (busqueda && res.length === 1) {
          this.elegirMunicipio(res[0].id);
        } else if (!res.some(m => m.id === this.municipioId())) {
          // Evitar mostrar anuncios del municipio anterior cuando deja de estar en resultados.
          this.elegirMunicipio(0);
        }
      },
      error: () => {
        if (revision !== this.busquedaActual) return;
        this.buscando.set(false);
        this.municipios.set([]);
        this.elegirMunicipio(0);
        this.error.set('No se han podido cargar los municipios.');
      }
    });
  }
  elegirMunicipio(id:number):void {
    if (id === this.municipioId() && id !== 0) return;
    const revision = ++this.cargaActual;
    this.municipioId.set(id);
    this.filas.set([]);
    this.cambiarEspacio();
    if (!id) return;
    this.http.get<Promocion[]>('/api/v1/admin/territorio/municipios/'+id+'/promociones').subscribe({
      next:res=>{
        if (revision !== this.cargaActual) return;
        this.filas.set(res);
        this.cambiarEspacio();
      },
      error:()=>{
        if (revision !== this.cargaActual) return;
        this.error.set('No se han podido cargar los espacios del municipio.');
      }
    });
  }
  cambiarEspacio():void {
    this.error.set('');this.exito.set('');
    const actual=this.filas().find(x=>x.tipo===this.tipo&&x.posicion===this.posicion);
    this.espacioGuardado.set(!!actual);
    this.datos=actual?{
      titulo:actual.titulo,subtitulo:actual.subtitulo??'',descripcion:actual.descripcion??'',
      imagenUrl:actual.imagen_url??'',ctaTexto:actual.cta_texto??'',ctaUrl:actual.cta_url??'',
      anunciante:actual.anunciante??'',esPublicidad:actual.es_publicidad,activo:actual.activo,
      visibleDesde:actual.visible_desde?.slice(0,16)??'',visibleHasta:actual.visible_hasta?.slice(0,16)??''
    }:formularioVacio();
  }
  guardar():void {
    if(!this.municipioId()||!this.datos.titulo.trim()||this.guardando())return;
    this.guardando.set(true);this.error.set('');this.exito.set('');
    const d=this.datos;
    const body={
      titulo:d.titulo,subtitulo:d.subtitulo||null,descripcion:d.descripcion||null,
      imagenUrl:d.imagenUrl||null,ctaTexto:d.ctaTexto||null,ctaUrl:d.ctaUrl||null,
      anunciante:d.anunciante||null,esPublicidad:d.esPublicidad,activo:d.activo,
      visibleDesde:d.visibleDesde||null,visibleHasta:d.visibleHasta||null
    };
    this.http.put<void>('/api/v1/admin/territorio/municipios/'+this.municipioId()+'/promociones/'+this.tipo+'/'+this.posicion,body)
    .subscribe({next:()=>{this.guardando.set(false);this.exito.set('Espacio guardado correctamente.');
        this.elegirMunicipio(this.municipioId());},error:()=>{this.guardando.set(false);this.error.set('No se ha podido guardar. Comprueba los datos y permisos.');}});
  }
  desactivar():void {
    if(!this.municipioId()||!this.espacioGuardado()||this.guardando())return;
    this.guardando.set(true);
    this.http.delete<void>('/api/v1/admin/territorio/municipios/'+this.municipioId()+'/promociones/'+this.tipo+'/'+this.posicion)
    .subscribe({next:()=>{this.guardando.set(false);this.elegirMunicipio(this.municipioId());},
      error:()=>{this.guardando.set(false);this.error.set('No se ha podido desactivar.');}});
  }
}
