import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

interface Tarifa {
 codigo:string; descripcion:string; precioMensualCentimos:number;
 descuentoPorcentaje:number; activo:boolean; precioFinalCentimos:number;
}
interface Banner {
 ubicacion:string; posicion:number; titulo:string; anunciante:string; imagenUrl:string;
 destinoUrl:string; descuentoPorcentaje:number|null; activo:boolean;
 visibleDesde:string|null; visibleHasta:string|null;
 precioBaseCentimos:number; descuentoAplicado:number; precioFinalCentimos:number;
}
interface Municipio {id:number;nombre:string;provincia:string}
interface Datos {
 titulo:string;anunciante:string;imagenUrl:string;destinoUrl:string;
 descuentoPorcentaje:number|null;activo:boolean;visibleDesde:string;visibleHasta:string;
}
const vacio=():Datos=>({titulo:'',anunciante:'',imagenUrl:'',destinoUrl:'',
 descuentoPorcentaje:null,activo:false,visibleDesde:'',visibleHasta:''});
const CODIGOS=[
 ['INICIO','Inicio'],['ARTISTAS','Artistas'],['EVENTOS','Eventos'],
 ['ACADEMIAS','Academias'],['FOTOGRAFIA','Fotografía'],['MODA','Moda'],
 ['PENAS','Peñas'],['TABLAOS','Tablaos'],['FESTIVALES','Festivales'],
 ['HISTORIA','Historia'],['PALOS','Palos'],['LLAVES','Llaves de Oro'],
 ['SERVICIOS','Servicios'],['CONTACTO','Contacto'],['MUNICIPIOS','Directorio municipal']
] as const;

@Component({
 selector:'adm-promocion',standalone:true,imports:[FormsModule],
 template:`
  <header class="adm-cabecera">
    <div><h1 class="adm-titulo">Promoción · Banners y descuentos</h1>
    <p class="adm-subtitulo">Dos espacios por página, categoría o municipio. Sin pago online automático.</p></div>
  </header>
  @if(error()){<p role="alert" class="alerta">{{error()}}</p>}
  @if(aviso()){<p role="status" class="correcto">{{aviso()}}</p>}
  <section class="panel">
    <h2>Tarifas mensuales</h2>
    <p>Importes sin IVA. El descuento de cada tipo se aplica a todos sus espacios salvo que configures uno particular.</p>
    <div class="tarifas">
      @for(t of tarifas();track t.codigo){
        <div class="tarifa">
          <strong>{{t.descripcion}}</strong>
          <label>Base (euros/mes)
            <input type="number" min="0" max="1000000" step="0.01" [value]="t.precioMensualCentimos/100"
              (change)="cambiarTarifa(t.codigo,'precioMensualCentimos',redondearCentimos($any($event.target).value))"></label>
          <label>Descuento %
            <input type="number" min="0" max="80" step="1" [value]="t.descuentoPorcentaje"
              (change)="cambiarTarifa(t.codigo,'descuentoPorcentaje',+$any($event.target).value)"></label>
          <label class="linea"><input type="checkbox" [checked]="t.activo"
              (change)="cambiarTarifa(t.codigo,'activo',$any($event.target).checked)"> Habilitada</label>
          <small>Precio con descuento: <strong>{{importeConDescuento(t.precioMensualCentimos,t.descuentoPorcentaje)}} €/mes</strong></small>
          <button type="button" (click)="guardarTarifa(t)" [disabled]="ocupado()">Guardar tarifa</button>
        </div>
      }
    </div>
  </section>
  <section class="panel">
    <h2>Espacios publicitarios</h2>
    <label>Tipo de ubicación
      <select [(ngModel)]="tipoUbicacion" (ngModelChange)="cambiarUbicacion()">
        <option value="PAGINA">Páginas y categorías</option>
        <option value="MUNICIPIO">Municipio</option>
      </select>
    </label>
    @if(tipoUbicacion==='PAGINA'){
      <label>Página o categoría
        <select [(ngModel)]="codigo" (ngModelChange)="cambiarUbicacion()">
          @for(x of codigos;track x[0]){<option [value]="x[0]">{{x[1]}}</option>}
        </select>
      </label>
    } @else {
      <label>Buscar municipio
        <input type="search" [(ngModel)]="busquedaMunicipio" (ngModelChange)="buscarMunicipio()"
          placeholder="Montilla, Algeciras…" maxlength="100">
      </label>
      <label>Municipio seleccionado
        <select [value]="municipioId" (change)="elegirMunicipio(+$any($event.target).value)">
          <option value="0">Seleccionar municipio</option>
          @for(m of municipios();track m.id){<option [value]="m.id">{{m.nombre}} ({{m.provincia}})</option>}
        </select>
      </label>
    }
    @if(ubicacion()){
      <div class="posiciones">
        <label>Espacio
          <select [(ngModel)]="posicion" (ngModelChange)="cargarEdicion()">
            <option [ngValue]="1">Banner 1</option><option [ngValue]="2">Banner 2</option>
          </select>
        </label>
        <p>Disponibles: máximo dos espacios. <strong>{{bannerActual()?.activo?'Campaña activa':'Espacio disponible/inactivo'}}</strong></p>
      </div>
      @if(cargando()){<p role="status">Cargando espacios…</p>}
      @if(!cargando() && !cargaCorrecta()){<button type="button" (click)="cargarBanners()">Reintentar cargar espacios</button>}
      <form (ngSubmit)="guardarBanner()" class="formulario">
        <fieldset [disabled]="ocupado() || !cargaCorrecta()"><legend>Datos de la campaña</legend>
        <label>Título del banner
          <input name="titulo" [(ngModel)]="datos.titulo" maxlength="180" required></label>
        <label>Anunciante
          <input name="anunciante" [(ngModel)]="datos.anunciante" maxlength="180" required></label>
        <label>URL de la imagen (HTTPS o ruta interna)
          <input name="imagen" [(ngModel)]="datos.imagenUrl" maxlength="1024" required></label>
        <label>URL de destino (HTTPS o ruta interna)
          <input name="destino" [(ngModel)]="datos.destinoUrl" maxlength="1024" required></label>
        <label>Descuento específico % (vacío = descuento general)
          <input name="descuento" type="number" min="0" max="80" step="1"
            [ngModel]="datos.descuentoPorcentaje" (ngModelChange)="datos.descuentoPorcentaje=$event===''||$event===null?null:+$event"></label>
        <div class="fechas">
          <label>Mostrar desde
            <input name="desde" type="datetime-local" [(ngModel)]="datos.visibleDesde"></label>
          <label>Mostrar hasta
            <input name="hasta" type="datetime-local" [(ngModel)]="datos.visibleHasta"></label>
        </div>
        <label class="linea"><input type="checkbox" name="activo" [(ngModel)]="datos.activo"> Publicar anuncio</label>
        <p class="resumen">Precio: <strong>{{precioFinal()}} €/mes</strong>
          <small>(sin IVA; precio informativo, no implica contratación ni cobro)</small></p>
        @if(datos.imagenUrl){
          <div class="vista"><img [src]="datos.imagenUrl" alt="Vista previa del banner"></div>
        }
        <div class="acciones">
          <button type="submit" [disabled]="ocupado() || !datos.titulo.trim() || !datos.anunciante.trim()
            || !datos.imagenUrl.trim() || !datos.destinoUrl.trim()">Guardar banner</button>
          <button type="button" [disabled]="ocupado() || !bannerActual()" (click)="desactivarBanner()">Desactivar banner</button>
        </div>
        </fieldset>
      </form>
    } @else {
      <p>Selecciona un municipio para configurar sus dos espacios.</p>
    }
  </section>
 `,
 styles:[`
  .panel{background:#fff;border:1px solid #d7c8b0;border-radius:12px;padding:20px;margin:20px 0;max-width:1050px;color:#281d13}
  .panel h2{margin:0 0 10px}.panel p{line-height:1.5}
  .tarifas{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:18px}
  .tarifa{padding:15px;border:1px solid #cfc3af;border-radius:8px;display:grid;gap:12px}
  fieldset{border:0;padding:0;min-width:0}legend{font-weight:700}
  label{display:grid;gap:6px;margin:13px 0;font-weight:650}
  input,select{padding:10px;border:1px solid #96866e;border-radius:6px;max-width:100%;background:#fff;color:#24190f}
  .linea{display:flex;align-items:center;gap:8px}
  .linea input{width:18px;height:18px}
  button{padding:10px 18px;border:1px solid #936b36;border-radius:6px;background:#d5a462;color:#24180b;font-weight:750;cursor:pointer}
  button:disabled{opacity:.5;cursor:not-allowed}
  .formulario{max-width:780px;padding:16px;border:1px solid #ddd0be;border-radius:10px}
  .fechas,.posiciones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
  .acciones{display:flex;gap:12px;flex-wrap:wrap}
  .resumen{padding:12px;background:#f5efe5;border-radius:8px}
  .resumen small{display:block}.alerta{color:#9a2424}.correcto{color:#1d713f}
  .vista img{max-width:100%;max-height:180px;object-fit:contain}
  @media(max-width:700px){.fechas,.posiciones{grid-template-columns:1fr}}
 `]
})
export class PromocionAdminComponent implements OnInit,OnDestroy {
  private readonly http=inject(HttpClient);
  readonly codigos=CODIGOS;
  readonly tarifas=signal<Tarifa[]>([]);
  readonly banners=signal<Banner[]>([]);
  readonly municipios=signal<Municipio[]>([]);
  readonly aviso=signal('');
  readonly error=signal('');
  readonly ocupado=signal(false);
  readonly cargando=signal(false);
  readonly cargaCorrecta=signal(false);
  tipoUbicacion:'PAGINA'|'MUNICIPIO'='PAGINA';
  codigo='INICIO';
  posicion=1;
  municipioId=0;
  busquedaMunicipio='';
  datos:Datos=vacio();
  private temporizador?:ReturnType<typeof setTimeout>;
  private busquedaRev=0;
  private cargaRev=0;

  ngOnInit():void{this.cargarTarifas();this.cambiarUbicacion();}
  ngOnDestroy():void{clearTimeout(this.temporizador);this.busquedaRev++;this.cargaRev++;}
  ubicacion():string{return this.tipoUbicacion==='PAGINA'?this.codigo:(this.municipioId>0?'MUNICIPIO:'+this.municipioId:'');}
  bannerActual():Banner|undefined{return this.banners().find(b=>b.posicion===this.posicion);}
  redondearCentimos(euros:string):number{return Math.round(Number(euros)*100);}
  importeConDescuento(base:number,descuento:number):string{return (Math.floor(base*(100-descuento)/100)/100).toFixed(2);}
  precioFinal():string{
    const codigo=this.tipoUbicacion==='MUNICIPIO'?'MUNICIPIO':
      ['INICIO','ARTISTAS','EVENTOS','ACADEMIAS'].includes(this.codigo)?this.codigo:'CATEGORIA';
    const t=this.tarifas().find(x=>x.codigo===codigo);
    if(!t)return '—';
    const desc=this.datos.descuentoPorcentaje??t.descuentoPorcentaje;
    return this.importeConDescuento(t.precioMensualCentimos,desc);
  }
  cargarTarifas():void{
    this.http.get<Tarifa[]>('/api/v1/promocion/tarifas').subscribe({
      next:r=>this.tarifas.set(r),
      error:()=>this.error.set('No se pudieron cargar las tarifas.')
    });
  }
  cambiarTarifa(codigo:string,campo:'precioMensualCentimos'|'descuentoPorcentaje'|'activo',valor:number|boolean):void{
    this.tarifas.update(l=>l.map(t=>t.codigo===codigo?{...t,[campo]:valor}:t));
  }
  guardarTarifa(t:Tarifa):void{
    if(this.ocupado())return;
    if(!Number.isInteger(t.precioMensualCentimos)||t.precioMensualCentimos<0||t.precioMensualCentimos>100000000
      ||!Number.isInteger(t.descuentoPorcentaje)||t.descuentoPorcentaje<0||t.descuentoPorcentaje>80){
      this.error.set('Precio o descuento fuera de rango.');return;
    }
    this.ocupado.set(true);this.error.set('');this.aviso.set('');
    this.http.put<Tarifa>('/api/v1/admin/promocion/tarifas/'+t.codigo,{
      precioMensualCentimos:t.precioMensualCentimos,
      descuentoPorcentaje:t.descuentoPorcentaje,activo:t.activo
    }).subscribe({
      next:x=>{this.tarifas.update(l=>l.map(y=>y.codigo===x.codigo?x:y));this.ocupado.set(false);this.aviso.set('Tarifa guardada.');},
      error:()=>{this.ocupado.set(false);this.error.set('No se pudo guardar la tarifa.');}
    });
  }
  cambiarUbicacion():void{this.error.set('');this.aviso.set('');this.banners.set([]);this.datos=vacio();this.cargarBanners();}
  elegirMunicipio(id:number):void{this.municipioId=id;this.cambiarUbicacion();}
  buscarMunicipio():void{
    clearTimeout(this.temporizador);
    const rev=++this.busquedaRev;
    this.temporizador=setTimeout(()=>{
      const q=this.busquedaMunicipio.trim();
      this.http.get<Municipio[]>('/api/v1/territorio/municipios',{params:new HttpParams().set('q',q)}).subscribe({
        next:r=>{if(rev!==this.busquedaRev)return;this.municipios.set(r);
          if(q&&r.length===1)this.elegirMunicipio(r[0].id);},
        error:()=>{if(rev===this.busquedaRev)this.error.set('No se encontraron municipios.');}
      });
    },300);
  }
  cargarBanners():void{
    const ubicacion=this.ubicacion(),rev=++this.cargaRev;
    this.error.set('');
    this.cargaCorrecta.set(false);this.cargando.set(!!ubicacion);
    if(!ubicacion)return;
    this.http.get<Banner[]>('/api/v1/admin/promocion/banners',{params:new HttpParams().set('ubicacion',ubicacion)})
      .subscribe({
        next:r=>{if(rev!==this.cargaRev)return;this.cargando.set(false);this.cargaCorrecta.set(true);this.banners.set(r);this.cargarEdicion();},
        error:()=>{if(rev===this.cargaRev){this.cargando.set(false);this.error.set('No se pudieron cargar los espacios.');}}
      });
  }
  cargarEdicion():void{
    const b=this.bannerActual();
    this.datos=b?{titulo:b.titulo,anunciante:b.anunciante,imagenUrl:b.imagenUrl,
      destinoUrl:b.destinoUrl,descuentoPorcentaje:b.descuentoPorcentaje,activo:b.activo,
      visibleDesde:b.visibleDesde?.slice(0,16)||'',visibleHasta:b.visibleHasta?.slice(0,16)||''}:vacio();
  }
  guardarBanner():void{
    if(this.ocupado()||!this.cargaCorrecta()||!this.ubicacion())return;
    this.error.set('');this.aviso.set('');this.ocupado.set(true);
    const rev=this.cargaRev,ubicacion=this.ubicacion(),posicion=this.posicion;
    const d=this.datos;
    if(!d.titulo.trim()||!d.anunciante.trim()||!d.imagenUrl.trim()||!d.destinoUrl.trim()
      ||(d.descuentoPorcentaje!==null&&(!Number.isInteger(d.descuentoPorcentaje)||d.descuentoPorcentaje<0||d.descuentoPorcentaje>80))
      ||(d.visibleDesde&&d.visibleHasta&&d.visibleHasta<=d.visibleDesde)){
      this.ocupado.set(false);this.error.set('Revisa los campos obligatorios, las fechas y el descuento (0–80 %).');return;
    }
    const body={...d,visibleDesde:d.visibleDesde||null,visibleHasta:d.visibleHasta||null};
    this.http.put<Banner>('/api/v1/admin/promocion/banners/'+posicion,body,
      {params:new HttpParams().set('ubicacion',ubicacion)}).subscribe({
        next:r=>{this.ocupado.set(false);if(rev!==this.cargaRev)return;this.banners.update(l=>[...l.filter(x=>x.posicion!==r.posicion),r]);this.aviso.set('Banner guardado.');},
        error:()=>{this.ocupado.set(false);if(rev!==this.cargaRev)return;this.error.set('No se pudo guardar el banner. Revisa fechas, enlaces y descuentos.');}
      });
  }
  desactivarBanner():void{
    if(this.ocupado()||!this.cargaCorrecta()||!this.ubicacion())return;
    const rev=this.cargaRev,ubicacion=this.ubicacion(),posicion=this.posicion;
    this.ocupado.set(true);this.error.set('');this.aviso.set('');
    this.http.delete('/api/v1/admin/promocion/banners/'+posicion,
      {params:new HttpParams().set('ubicacion',ubicacion)}).subscribe({
        next:()=>{this.ocupado.set(false);if(rev!==this.cargaRev)return;this.banners.update(l=>l.map(b=>b.posicion===posicion?{...b,activo:false}:b));if(this.posicion===posicion)this.datos.activo=false;this.aviso.set('Banner desactivado.');},
        error:()=>{this.ocupado.set(false);if(rev!==this.cargaRev)return;this.error.set('No se pudo desactivar el banner.');}
      });
  }
}
