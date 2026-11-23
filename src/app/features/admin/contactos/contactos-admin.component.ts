import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

interface Contacto {
 id:number;nombre:string;email:string;asunto:string;mensaje:string;
 estado:'NUEVO'|'LEIDO'|'ARCHIVADO';
 avisoEstado:string;creadoEn:string;leidoEn:string|null;
}
@Component({
 selector:'adm-contactos',standalone:true,imports:[FormsModule,SlicePipe],
 template:`
 <header class="adm-cabecera"><div>
  <h1 class="adm-titulo">Bandeja de contactos</h1>
  <p class="adm-subtitulo">Mensajes recibidos desde el formulario público, guardados en MySQL.</p>
 </div></header>
 @if(error()){<p class="error" role="alert">{{error()}}</p>}
 @if(aviso()){<p class="exito" role="status">{{aviso()}}</p>}
 @if(auth.esPrincipal()){
 <section class="panel" aria-label="Configuración del email de avisos">
  <h2>Correo de avisos</h2>
  <p>Se enviará un email a esta dirección cada vez que llegue una consulta nueva.
   Los mensajes completos se leen en esta bandeja, no en el aviso.</p>
  <form (ngSubmit)="guardarEmail()" class="email">
   <label>Email destinatario
    <input name="destino" type="email" required maxlength="254" [(ngModel)]="emailAvisos"
      placeholder="correo@ejemplo.com"></label>
   <button type="submit" [disabled]="ocupado() || !emailAvisos.trim()">Guardar email</button>
  </form>
  @if(smtpConfigurado()){
    <p class="exito" role="status">Servicio SMTP configurado. La entrega final depende del proveedor de correo.</p>
  } @else {
    <p class="error" role="status">SMTP no configurado: se recibirán consultas en esta bandeja,
      pero no se enviarán avisos por email hasta configurar el servidor.</p>
  }
 </section>
 }
 <section class="panel">
  <div class="cabecera">
   <h2>Mensajes recibidos</h2>
   <label>Estado
    <select [(ngModel)]="filtro" (ngModelChange)="pagina=0;cargar()">
     <option value="TODOS">Todos</option><option value="NUEVO">Nuevos</option>
     <option value="LEIDO">Leídos</option><option value="ARCHIVADO">Archivados</option>
    </select>
   </label>
  </div>
  @if(cargando()){<p role="status">Cargando consultas…</p>}
  <div class="listado">
   @for(m of mensajes();track m.id){
    <article [class.nuevo]="m.estado==='NUEVO'">
     <div class="cabecera">
      <div><strong>#{{m.id}} · {{m.asunto}}</strong>
       <p>{{m.nombre}} · <a [href]="'mailto:'+m.email">{{m.email}}</a></p>
       <small>{{m.creadoEn | slice:0:16}} · {{m.estado}} · Aviso: {{etiquetaAviso(m.avisoEstado)}}</small>
      </div>
     </div>
     <p class="mensaje">{{m.mensaje}}</p>
     <div class="acciones">
      @if(m.estado!=='LEIDO'){
       <button type="button" [disabled]="ocupado()" (click)="cambiarEstado(m,'LEIDO')">Marcar leído</button>
      }
      @if(m.estado!=='NUEVO'){
       <button type="button" [disabled]="ocupado()" (click)="cambiarEstado(m,'NUEVO')">Marcar nuevo</button>
      }
      @if(m.estado!=='ARCHIVADO'){
       <button type="button" [disabled]="ocupado()" (click)="cambiarEstado(m,'ARCHIVADO')">Archivar</button>
      }
      <a [href]="'mailto:'+m.email+'?subject='+codificar(m.asunto)">Responder por email</a>
     </div>
    </article>
   } @empty {
    @if(!cargando()){<p>No hay mensajes para este filtro.</p>}
   }
  </div>
  <nav class="paginas" aria-label="Paginación de contactos">
   <button type="button" [disabled]="pagina===0 || cargando()" (click)="anterior()">Anterior</button>
   <span>Página {{pagina+1}}</span>
   <button type="button" [disabled]="mensajes().length<25 || cargando()" (click)="siguiente()">Siguiente</button>
  </nav>
 </section>
 `,
 styles:[`
  .panel{max-width:1050px;padding:24px;background:#fff;color:#201914;border:1px solid #ddcfb9;border-radius:12px;margin:22px 0}
  .panel h2{margin:0 0 12px}.panel p{line-height:1.5}
  .email{display:flex;flex-wrap:wrap;align-items:end;gap:15px}
  label{display:grid;gap:7px;min-width:220px}
  input,select{padding:11px;border:1px solid #a99579;border-radius:7px;background:#fff;color:#201914}
  .email input{min-width:min(440px,80vw)}
  button{background:#d0a362;border:1px solid #97713e;padding:10px 16px;border-radius:7px;cursor:pointer}
  button:disabled{opacity:.5;cursor:not-allowed}
  .nota{color:#6c6256;font-size:.83rem}
  .cabecera{display:flex;justify-content:space-between;align-items:start;gap:20px;flex-wrap:wrap}
  .cabecera p{margin:6px 0}.cabecera small{color:#685b50}
  .listado{display:grid;gap:14px}
  article{border:1px solid #dccbb5;border-radius:8px;padding:19px;background:#faf8f4}
  article.nuevo{border-left:5px solid #b57c34}
  .mensaje{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}
  .acciones,.paginas{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px}
  .acciones a{color:#855b28}.error{color:#ad2525}.exito{color:#17703e}
 `]
})
export class ContactosAdminComponent implements OnInit {
 private readonly http=inject(HttpClient);
 readonly auth=inject(AuthService);
 readonly mensajes=signal<Contacto[]>([]);
 readonly cargando=signal(false);
 readonly ocupado=signal(false);
 readonly error=signal('');
 readonly aviso=signal('');
 readonly smtpConfigurado=signal(false);
 emailAvisos='';
 filtro='TODOS';
 pagina=0;
 private revision=0;

 ngOnInit():void{
  this.cargar();
  if(this.auth.esPrincipal()){
   this.http.get<{emailAvisos:string;smtpConfigurado:boolean}>('/api/v1/admin/contactos/ajustes').subscribe({
    next:r=>{this.emailAvisos=r.emailAvisos;this.smtpConfigurado.set(r.smtpConfigurado);},
    error:()=>this.error.set('No se pudo consultar el email de avisos.')
   });
  }
 }
 cargar():void{
  const rev=++this.revision;
  this.cargando.set(true);this.error.set('');
  this.http.get<Contacto[]>('/api/v1/admin/contactos',{
   params:new HttpParams().set('estado',this.filtro).set('pagina',this.pagina)
  }).subscribe({
   next:r=>{if(rev===this.revision){this.mensajes.set(r);this.cargando.set(false);}},
   error:()=>{if(rev===this.revision){this.error.set('No se pudo cargar la bandeja.');this.cargando.set(false);}}
  });
 }
 cambiarEstado(m:Contacto,estado:Contacto['estado']):void{
  this.ocupado.set(true);this.error.set('');
  this.http.put<void>('/api/v1/admin/contactos/'+m.id+'/estado',{estado}).subscribe({
   next:()=>{this.ocupado.set(false);this.cargar();},
   error:()=>{this.ocupado.set(false);this.error.set('No se pudo actualizar el mensaje.');}
  });
 }
 guardarEmail():void{
  if(this.ocupado()||!this.auth.esPrincipal())return;
  this.ocupado.set(true);this.error.set('');this.aviso.set('');
  this.http.put<{emailAvisos:string;smtpConfigurado:boolean}>('/api/v1/admin/contactos/ajustes',{emailAvisos:this.emailAvisos}).subscribe({
   next:r=>{this.ocupado.set(false);this.emailAvisos=r.emailAvisos;this.smtpConfigurado.set(r.smtpConfigurado);this.aviso.set('Dirección de avisos actualizada.');},
   error:()=>{this.ocupado.set(false);this.error.set('No se pudo guardar. Comprueba el formato del correo.');}
  });
 }
 etiquetaAviso(estado:string):string{
  return ({ENVIADO:'Enviado',NO_CONFIGURADO:'Sin SMTP',ERROR:'Error SMTP',PENDIENTE:'Pendiente'} as Record<string,string>)[estado]??estado;
 }
 codificar(v:string):string{return encodeURIComponent('Re: '+v);}
 anterior():void{if(this.pagina>0){this.pagina--;this.cargar();}}
 siguiente():void{if(this.mensajes().length===25){this.pagina++;this.cargar();}}
}
