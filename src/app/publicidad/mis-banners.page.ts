import { Component, afterNextRender, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { MiembroAuthService } from '../features/miembros/miembro-auth.service';
import { anuncioVacio } from './solicitud-banner.component';

interface MiBanner {
 id:number;municipio_id:number;municipio:string;posicion:number;titulo:string;anunciante:string;
 imagen_url:string;destino_url:string;visible_desde:string;visible_hasta:string;editable:boolean|number;
}
interface MiSolicitud {id:number;municipio:string;posicion:number;inicio:string;meses:number;estado:string}
@Component({
 selector:'csf-mis-banners',standalone:true,imports:[RouterLink,FormsModule],
 template:`
  <main class="cuenta">
    <a routerLink="/mi-cuenta">Mi cuenta</a><h1>Mis banners</h1>
    @if(cargando()){<p role="status">Cargando tus banners…</p>}
    @if(error()){<p role="alert">{{error()}}</p><button type="button" (click)="cargar()">Reintentar</button>}
    @if(aviso()){<p role="status">{{aviso()}}</p>}
    @if(!cargando() && !auth.sesion()){<a routerLink="/acceso">Accede para gestionar tus banners</a>}
    @if(auth.sesion()){
      <h2>Campañas contratadas</h2>
      @for(b of banners();track b.id){
        <article><h3>{{b.municipio}} · Banner {{b.posicion}}</h3>
          <p>Referencia: M{{b.municipio_id}}-U{{auth.sesion()!.id}}-B{{b.posicion}} · Campaña {{b.id}}</p>
          <p>Del {{fecha(b.visible_desde)}} al {{fecha(b.visible_hasta)}} (hora de Madrid).</p>
          <img [src]="b.imagen_url" [alt]="b.titulo"><p>{{b.titulo}}</p>
          @if(b.editable){<button type="button" (click)="abrir(b)" [disabled]="ocupado()">Editar banner</button>}
          @else{<p>La edición está disponible mientras tu contrato esté activo y vigente.</p>}
        </article>
      } @empty { @if(!cargando()&&!error()){<p>No tienes campañas contratadas.</p>} }
      @if(editando();as b){
        <form (ngSubmit)="guardar()"><h2>Editar banner de {{b.municipio}}</h2>
          <label>Título<input name="titulo" [(ngModel)]="datos.titulo" required maxlength="180"></label>
          <label>Anunciante<input name="anunciante" [(ngModel)]="datos.anunciante" required maxlength="180"></label>
          <label>URL de la imagen (HTTPS o ruta interna)<input name="imagen" [(ngModel)]="datos.imagenUrl" required maxlength="1024"></label>
          <label>URL de destino (HTTPS o ruta interna)<input name="destino" [(ngModel)]="datos.destinoUrl" required maxlength="1024"></label>
          <p>La edición conserva el municipio, el titular y las fechas contratadas.</p>
          <button type="submit" [disabled]="ocupado()">{{ocupado()?'Guardando…':'Guardar cambios'}}</button>
          <button type="button" [disabled]="ocupado()" (click)="editando.set(null)">Cancelar</button>
        </form>
      }
      <h2>Solicitudes de contratación</h2>
      @for(s of solicitudes();track s.id){
        <article><h3>{{s.municipio}} · Banner {{s.posicion}}</h3><p>Solicitud {{s.id}} · {{s.estado}}</p>
          <p>Inicio: {{fecha(s.inicio)}} · {{s.meses}} meses</p></article>
      } @empty { @if(!cargando()&&!error()){<p>No tienes solicitudes.</p>} }
      <a routerLink="/municipios">Buscar un municipio para contratar publicidad</a>
    }
  </main>
 `,
 styles:[`
  .cuenta{max-width:1000px;margin:40px auto 80px;padding:0 24px}h1{font-size:2.5rem}
  article,form{border:1px solid #9c805b;border-radius:10px;padding:24px;margin:20px 0}h3{margin-top:0}
  img{max-width:100%;max-height:150px;object-fit:contain}p{line-height:1.6;overflow-wrap:anywhere}
  form{max-width:700px}label{display:grid;gap:8px;margin:18px 0}input{font:inherit;padding:12px;border:1px solid #aa967a;border-radius:6px;box-sizing:border-box;width:100%}
  button{font:inherit;background:#d8ad6b;border:0;border-radius:6px;padding:12px 20px;cursor:pointer;margin:4px}button:disabled{opacity:.5}
 `]
})
export class MisBannersPage {
 readonly auth=inject(MiembroAuthService);private readonly http=inject(HttpClient);
 readonly banners=signal<MiBanner[]>([]);readonly solicitudes=signal<MiSolicitud[]>([]);
 readonly editando=signal<MiBanner|null>(null);readonly cargando=signal(true);readonly ocupado=signal(false);
 readonly error=signal('');readonly aviso=signal('');datos=anuncioVacio();
 constructor(){afterNextRender(()=>this.cargar());}
 fecha(s:string):string{const [y,m,d]=s.slice(0,10).split('-');return d+'/'+m+'/'+y;}
 cargar():void{
   this.error.set('');this.cargando.set(true);
   this.auth.comprobar().subscribe({next:s=>{
     if(!s){this.cargando.set(false);return;}
     this.http.get<MiBanner[]>('/api/v1/miembros/promocion/banners').subscribe({next:r=>{this.banners.set(r);this.cargando.set(false);},error:()=>{this.cargando.set(false);this.error.set('No se pudieron cargar tus banners.');}});
     this.http.get<MiSolicitud[]>('/api/v1/miembros/promocion/solicitudes').subscribe({next:r=>this.solicitudes.set(r),error:()=>this.error.set('No se pudieron cargar tus solicitudes.')});
   },error:()=>{this.cargando.set(false);this.error.set('No se pudo comprobar tu sesión.');}});
 }
 abrir(b:MiBanner):void{this.editando.set(b);this.aviso.set('');this.datos={titulo:b.titulo,anunciante:b.anunciante,imagenUrl:b.imagen_url,destinoUrl:b.destino_url};}
 guardar():void{
   const b=this.editando();if(!b||this.ocupado())return;
   this.ocupado.set(true);this.error.set('');this.aviso.set('');const datos={...this.datos};
   this.http.get('/api/v1/miembros/auth/csrf').pipe(switchMap(()=>this.http.put('/api/v1/miembros/promocion/banners/'+b.id,datos))).subscribe({
     next:()=>{this.ocupado.set(false);this.editando.set(null);this.aviso.set('Banner actualizado.');this.cargar();},
     error:e=>{this.ocupado.set(false);this.error.set(e.status===404?'El contrato ya no permite editar este banner.':'No se pudo guardar. Comprueba tu sesión y las URL.');if(e.status===404)this.editando.set(null);}
   });
 }
}
