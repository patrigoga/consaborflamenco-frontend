import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
interface Solicitud {
 id:number;municipio_id:number;municipio:string;usuario_id:number;usuario:string;email:string;posicion:number;
 titulo:string;anunciante:string;imagen_url:string;destino_url:string;inicio:string;meses:number;precio_mensual_centimos:number;
}
@Component({
 selector:'adm-banners-municipales',standalone:true,imports:[FormsModule,RouterLink],
 template:`
  <header><h1>Banners municipales · Contratación</h1><p>Imagen común para los espacios libres y solicitudes de los clientes.</p></header>
  @if(error()){<p role="alert">{{error()}}</p>}
  @if(aviso()){<p role="status">{{aviso()}}</p>}
  <section><h2>Imagen estándar de los dos banners</h2>
    <p>Se mostrará en los espacios sin campaña publicada de todos los municipios.</p>
    <form (ngSubmit)="guardarImagen()"><label>URL HTTPS o ruta interna de la imagen
      <input name="imagen" [(ngModel)]="imagenUrl" required maxlength="1024"></label>
      @if(imagenUrl){<img [src]="imagenUrl" alt="Vista previa de la imagen estándar">}
      <button type="submit" [disabled]="ocupado()||!configCargada()">Guardar imagen estándar</button>
    </form>
  </section>
  <section><h2>Solicitudes pendientes</h2><button type="button" [disabled]="ocupado()" (click)="cargar()">Actualizar</button>
    @if(cargando()){<p role="status">Cargando solicitudes…</p>}
    @for(s of solicitudes();track s.id){
      <article><h3>{{s.municipio}} · Banner {{s.posicion}}</h3>
        <p>Referencia M{{s.municipio_id}}-U{{s.usuario_id}}-B{{s.posicion}} · Solicitud {{s.id}}</p>
        <p>{{s.usuario}} · {{s.email}}</p><p>{{s.titulo}} · {{s.anunciante}}</p>
        <img [src]="s.imagen_url" [alt]="s.titulo"><p>Destino: {{s.destino_url}}</p>
        <p>Precio solicitado: {{(s.precio_mensual_centimos/100).toFixed(2)}} €/mes, sin IVA.</p>
        <label>Inicio confirmado (hora de Madrid)<input type="date" [(ngModel)]="s.inicio"></label>
        <label>Meses confirmados<input type="number" [(ngModel)]="s.meses" min="1" max="12" step="1"></label>
        <label class="confirmacion"><input type="checkbox" [checked]="confirmadas.has(s.id)" (change)="confirmar(s.id,$any($event.target).checked)"> He confirmado las condiciones y el pago con el cliente.</label>
        <button type="button" [disabled]="ocupado()||!confirmadas.has(s.id)" (click)="resolver(s,true)">Activar contrato</button>
        <button type="button" [disabled]="ocupado()" (click)="resolver(s,false)">Rechazar solicitud</button>
      </article>
    } @empty { @if(!cargando()&&!error()){<p>No hay solicitudes pendientes.</p>} }
    <p><a routerLink="/admin/promocion">Editar campañas, fechas y tarifas</a></p>
  </section>
 `,
 styles:[`
  section{background:#fff;color:#2b2118;border:1px solid #d7c8b0;border-radius:10px;padding:24px;margin:24px 0;max-width:1000px}
  article{border-top:1px solid #c9b69c;padding:24px 0;margin-top:18px}p{line-height:1.6;overflow-wrap:anywhere}
  label{display:grid;gap:8px;margin:18px 0}input{font:inherit;padding:12px;max-width:100%;box-sizing:border-box;border:1px solid #a28c70;border-radius:6px}
  img{display:block;max-width:100%;max-height:170px;object-fit:contain;margin:18px 0}
  button{padding:12px 18px;font:inherit;font-weight:650;background:#d6aa65;border:1px solid #956c32;border-radius:6px;cursor:pointer;margin:5px}button:disabled{opacity:.5}
  .confirmacion{display:flex;align-items:center}.confirmacion input{width:20px;height:20px}
 `]
})
export class BannersMunicipalesAdminComponent implements OnInit {
 private readonly http=inject(HttpClient);readonly solicitudes=signal<Solicitud[]>([]);
 readonly cargando=signal(true);readonly ocupado=signal(false);readonly error=signal('');readonly aviso=signal('');readonly configCargada=signal(false);
 readonly confirmadas=new Set<number>();imagenUrl='';
 ngOnInit():void{
   this.http.get<{imagenUrl:string}>('/api/v1/promocion/configuracion').subscribe({next:r=>{this.imagenUrl=r.imagenUrl;this.configCargada.set(true);},error:()=>this.error.set('No se pudo cargar la imagen estándar. Recarga para reintentar.')});
   this.cargar();
 }
 cargar():void{this.cargando.set(true);this.error.set('');this.http.get<Solicitud[]>('/api/v1/admin/promocion/solicitudes').subscribe({
   next:r=>{this.solicitudes.set(r);this.cargando.set(false);},error:()=>{this.cargando.set(false);this.error.set('No se pudieron cargar las solicitudes.');}
 });}
 confirmar(id:number,valor:boolean):void{if(valor)this.confirmadas.add(id);else this.confirmadas.delete(id);}
 guardarImagen():void{
   if(this.ocupado()||!this.configCargada())return;this.ocupado.set(true);this.error.set('');this.aviso.set('');
   this.http.put('/api/v1/admin/promocion/configuracion',{imagenUrl:this.imagenUrl}).subscribe({
     next:()=>{this.ocupado.set(false);this.aviso.set('Imagen estándar guardada para todos los municipios.');},
     error:()=>{this.ocupado.set(false);this.error.set('No se pudo guardar. Utiliza una URL HTTPS o ruta interna.');}
   });
 }
 resolver(s:Solicitud,contratar:boolean):void{
   if(this.ocupado()||(contratar&&!this.confirmadas.has(s.id)))return;
   this.ocupado.set(true);this.error.set('');this.aviso.set('');
   this.http.post('/api/v1/admin/promocion/solicitudes/'+s.id+(contratar?'/contratar':'/rechazar'),contratar?{inicio:s.inicio,meses:s.meses}:{}).subscribe({
     next:()=>{this.ocupado.set(false);this.aviso.set(contratar?'Contrato confirmado. El titular podrá editar el banner durante su vigencia.':'Solicitud rechazada.');this.solicitudes.update(r=>r.filter(x=>x.id!==s.id));this.confirmadas.delete(s.id);},
     error:e=>{this.ocupado.set(false);this.error.set(e.status===409?'La solicitud ya está resuelta o el espacio está ocupado. Actualiza la lista.':'No se pudo resolver. Revisa la fecha de inicio, la duración y los datos del anuncio.');}
   });
 }
}
