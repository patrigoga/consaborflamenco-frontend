import { Component, Input, OnChanges, afterNextRender, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { MiembroAuthService } from '../features/miembros/miembro-auth.service';
import { InventarioMunicipal } from './banners-municipales.component';

export const anuncioVacio=()=>({titulo:'',anunciante:'',imagenUrl:'',destinoUrl:''});
@Component({
 selector:'csf-solicitud-banner',standalone:true,imports:[FormsModule,RouterLink],
 template:`
  <section class="solicitud" aria-labelledby="solicitud-titulo">
    <h2 id="solicitud-titulo">Contratar banner {{posicion}} @if(inventario();as inv){en {{inv.nombre}}}</h2>
    @if(error()){<p role="alert">{{error()}}</p>}
    @if(enviado()){
      <p role="status">Solicitud recibida. El administrador confirmará la disponibilidad, las condiciones y el pago antes de activar tu banner.</p>
      <a routerLink="/mi-cuenta/banners">Ver mis banners y solicitudes</a>
    } @else { @if(inventario();as inv){
      @if(!disponible()) { <p>Este espacio ya no admite solicitudes de contratación.</p> }
      @else {
        <p>Precio orientativo: <strong>{{(inv.precioMensualCentimos/100).toFixed(2)}} €/mes</strong>, sin IVA.</p>
        <p>La solicitud no reserva el espacio ni realiza un cobro. Podrás editar el anuncio desde tu cuenta durante el contrato confirmado.</p>
        @if(comprobando()){<p role="status">Comprobando sesión…</p>}
        @else if(!auth.sesion()){
          <p>Accede con tu cuenta para enviar la solicitud.</p>
          <a routerLink="/acceso" [queryParams]="{volver:'/promocion?municipio='+municipioId+'&posicion='+posicion}">Acceder para contratar</a>
        } @else {
          <form (ngSubmit)="enviar()">
            <label>Nombre del anuncio<input name="titulo" [(ngModel)]="anuncio.titulo" required maxlength="180"></label>
            <label>Anunciante<input name="anunciante" [(ngModel)]="anuncio.anunciante" required maxlength="180"></label>
            <label>Imagen del anuncio (URL HTTPS o ruta interna)<input name="imagen" [(ngModel)]="anuncio.imagenUrl" required maxlength="1024"></label>
            <label>Enlace de destino (URL HTTPS o ruta interna)<input name="destino" [(ngModel)]="anuncio.destinoUrl" required maxlength="1024"></label>
            <label>Fecha de inicio deseada<input name="inicio" type="date" [(ngModel)]="inicio" required></label>
            <label>Duración en meses<input name="meses" type="number" [(ngModel)]="meses" min="1" max="12" step="1" required></label>
            <p>Total orientativo: <strong>{{(inv.precioMensualCentimos*meses/100).toFixed(2)}} €</strong>, sin IVA.</p>
            <button type="submit" [disabled]="ocupado()">{{ocupado()?'Enviando…':'Solicitar contratación'}}</button>
          </form>
        }
      }
    } }
  </section>
 `,
 styles:[`
  .solicitud{padding:28px;border:1px solid #b18a54;border-radius:12px;margin:0 0 42px;background:#241a15}
  form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}label{display:grid;gap:8px}
  input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #a58d70;border-radius:6px;font:inherit}
  button{font:inherit;font-weight:700;padding:14px;background:#d9ac68;border:0;border-radius:6px;cursor:pointer}button:disabled{opacity:.6}
  p{line-height:1.6}a{color:#efd09e} @media(max-width:650px){form{grid-template-columns:1fr}}
 `]
})
export class SolicitudBannerComponent implements OnChanges {
 @Input({required:true}) municipioId=0;
 @Input({required:true}) posicion=1;
 private readonly http=inject(HttpClient);
 readonly auth=inject(MiembroAuthService);
 readonly inventario=signal<InventarioMunicipal|null>(null);
 readonly comprobando=signal(true);readonly error=signal('');readonly ocupado=signal(false);readonly enviado=signal(false);
 anuncio=anuncioVacio();inicio='';meses=1;
 private listo=false;private revision=0;
 constructor(){afterNextRender(()=>{this.listo=true;this.cargar();this.auth.comprobar().subscribe({
   next:()=>this.comprobando.set(false),error:()=>{this.comprobando.set(false);this.error.set('No se pudo comprobar tu sesión. Recarga para reintentar.');}
 });});}
 ngOnChanges():void{if(this.listo)this.cargar();}
 disponible():boolean{return !!this.inventario()?.contratacionHabilitada&&!!this.inventario()?.espacios.find(e=>e.posicion===this.posicion)?.disponible;}
 private cargar():void{
   const rev=++this.revision;this.inventario.set(null);this.enviado.set(false);this.error.set('');this.anuncio=anuncioVacio();
   this.http.get<InventarioMunicipal>('/api/v1/promocion/municipios/'+this.municipioId).subscribe({
     next:r=>{if(rev===this.revision)this.inventario.set(r);},error:()=>{if(rev===this.revision)this.error.set('No se pudo cargar el espacio solicitado.');}
   });
 }
 enviar():void{
   if(this.ocupado()||!this.auth.sesion()||!this.disponible())return;
   this.ocupado.set(true);this.error.set('');const rev=this.revision;
   const datos={municipioId:this.municipioId,posicion:this.posicion,inicio:this.inicio,meses:this.meses,anuncio:{...this.anuncio}};
   this.http.get('/api/v1/miembros/auth/csrf').pipe(switchMap(()=>this.http.post('/api/v1/miembros/promocion/solicitudes',datos))).subscribe({
     next:()=>{this.ocupado.set(false);if(rev===this.revision)this.enviado.set(true);},
     error:e=>{this.ocupado.set(false);if(rev===this.revision)this.error.set(e.status===409?'El espacio ya está contratado o tienes una solicitud pendiente. Consulta Mis banners.':'No se pudo enviar. Comprueba la sesión, las fechas y las URL HTTPS.');}
   });
 }
}
