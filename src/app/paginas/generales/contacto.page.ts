import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector:'csf-pagina-contacto',standalone:true,imports:[FormsModule],
  template:`
    <div class="contacto">
      <header class="portada">
        <p class="ceja">CONSABORFLAMENCO · CONTACTO</p>
        <h1>Hablemos de flamenco</h1>
        <p>¿Quieres dar a conocer tu arte, academia, evento o proyecto?
          Escríbenos y nuestro equipo recibirá tu consulta directamente.</p>
      </header>
      <div class="contenido">
        <section class="tarjeta">
          <h2>Envíanos un mensaje</h2>
          <p>Todos los campos marcados con * son obligatorios.</p>
          @if(enviado()){
            <div class="exito" role="status">
              <h3>¡Mensaje recibido!</h3>
              <p>Hemos registrado tu consulta. Referencia: <strong>#{{referencia()}}</strong>.</p>
              <button type="button" (click)="restablecer()">Enviar otra consulta</button>
            </div>
          } @else {
            <form (ngSubmit)="enviar()" #formulario="ngForm">
              <label>Nombre * <input name="nombre" [(ngModel)]="datos.nombre" required minlength="2"
                maxlength="120" autocomplete="name" placeholder="Tu nombre"></label>
              <label>Correo electrónico * <input name="email" [(ngModel)]="datos.email" required
                type="email" maxlength="254" autocomplete="email" placeholder="correo@ejemplo.com"></label>
              <label>Asunto * <input name="asunto" [(ngModel)]="datos.asunto" required minlength="4"
                maxlength="180" placeholder="¿En qué podemos ayudarte?"></label>
              <label>Mensaje * <textarea name="mensaje" [(ngModel)]="datos.mensaje" required
                minlength="12" maxlength="5000" rows="7" placeholder="Cuéntanos tu propuesta o consulta"></textarea></label>
              <div class="trampa" aria-hidden="true">
                <label>Sitio web <input name="web" [(ngModel)]="datos.web" tabindex="-1" autocomplete="off"></label>
              </div>
              <label class="privacidad">
                <input name="privacidad" type="checkbox" [(ngModel)]="aceptaPrivacidad" required>
                He leído la información sobre tratamiento de datos de este formulario. *
              </label>
              <p class="legal">Usaremos tus datos únicamente para gestionar y responder tu consulta.
                El mensaje se almacenará en la bandeja de administración. No enviaremos publicidad
                ni cederemos tus datos a terceros para fines comerciales. Puedes solicitar acceso,
                rectificación o supresión mediante este canal.</p>
              @if(error()){<p class="error" role="alert">{{error()}}</p>}
              <button type="submit" [disabled]="enviando() || formulario.invalid || !aceptaPrivacidad">
                {{enviando() ? 'Enviando…' : 'Enviar mensaje'}}
              </button>
            </form>
          }
        </section>
        <aside class="informacion">
          <h2>Estamos para escucharte</h2>
          <p>ConSaborFlamenco une artistas, academias, asociaciones y apasionados
            del flamenco. Cuéntanos qué necesitas.</p>
          <div><strong>Artistas y academias</strong><p>Perfiles, cursos y colaboración.</p></div>
          <div><strong>Eventos y espectáculos</strong><p>Difusión cultural y agenda.</p></div>
          <div><strong>Promoción</strong><p>Publicidad por categorías y municipios.</p></div>
          <p class="nota">No publiques contraseñas, documentos de identidad ni otros datos sensibles en el mensaje.</p>
        </aside>
      </div>
    </div>
  `,
  styles:[`
    :host{display:block;background:#140f0d;color:#f8ede1;min-height:75vh}
    .contacto{max-width:1160px;margin:auto;padding:44px 20px 90px}
    .portada{padding:25px 0 46px;max-width:800px}
    .ceja{font-size:.77rem;color:#dbb47e;letter-spacing:.17em}
    h1{font:normal clamp(38px,5vw,65px) Georgia,serif;margin:12px 0}
    .portada>p:last-child{color:#e5d2bc;line-height:1.8}
    .contenido{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(230px,.8fr);gap:35px}
    .tarjeta{background:#f8f3ea;border-radius:14px;color:#241913;padding:clamp(20px,3vw,36px)}
    .tarjeta h2,.informacion h2{font:normal 29px Georgia,serif;margin:0 0 13px}
    .tarjeta>p{color:#695c51}
    form{display:grid;gap:16px;margin-top:22px}
    label{display:grid;gap:7px;font-weight:600}
    input,textarea{box-sizing:border-box;width:100%;padding:12px 13px;border:1px solid #b6a58c;border-radius:7px;background:#fff;color:#201813;font:inherit}
    textarea{resize:vertical;min-height:145px}
    .privacidad{display:flex;align-items:flex-start;gap:10px;font-size:.89rem;line-height:1.5}
    .privacidad input{width:18px;height:18px;margin:3px 0;flex-shrink:0}
    .legal{font-size:.8rem;color:#76665b;line-height:1.6}
    button{background:#b58247;border:0;color:#1d130c;padding:13px 23px;border-radius:7px;font:700 1rem inherit;cursor:pointer}
    button:disabled{opacity:.55;cursor:not-allowed}
    .error{color:#a32626}.exito{padding:20px;border:1px solid #51825a;border-radius:8px}
    .informacion{padding:20px 5px}.informacion>p{line-height:1.75;color:#e5d2bc}
    .informacion>div{padding:18px 0;border-bottom:1px solid #67513d}
    .informacion>div p{color:#e3cebb;font-size:.92rem}
    .nota{margin-top:24px;font-size:.84rem}
    .trampa{position:absolute;left:-10000px;height:1px;width:1px;overflow:hidden}
    @media(max-width:770px){.contenido{grid-template-columns:1fr}}
  `]
})
export class ContactoPage {
  private readonly http=inject(HttpClient);
  datos={nombre:'',email:'',asunto:'',mensaje:'',web:''};
  aceptaPrivacidad=false;
  readonly enviando=signal(false);
  readonly enviado=signal(false);
  readonly referencia=signal(0);
  readonly error=signal('');

  enviar():void{
    if(this.enviando()||!this.aceptaPrivacidad)return;
    this.enviando.set(true);this.error.set('');
    // El formulario anónimo también necesita token CSRF; nunca deshabilitar CSRF en POST.
    this.http.get('/api/v1/contacto/csrf').subscribe({
      next:()=>this.publicar(),
      error:()=>{this.enviando.set(false);this.error.set('No se pudo iniciar el envío. Recarga la página e inténtalo de nuevo.');}
    });
  }
  private publicar():void{
    this.http.post<{recibido:boolean;referencia:number}>('/api/v1/contacto',this.datos).subscribe({
      next:r=>{this.enviando.set(false);this.enviado.set(true);this.referencia.set(r.referencia);},
      error:e=>{
        this.enviando.set(false);
        this.error.set(e.status===429?'Has enviado otra consulta recientemente. Inténtalo de nuevo más tarde.':
          'No se ha podido enviar el mensaje. Revisa los datos o inténtalo de nuevo.');
      }
    });
  }
  restablecer():void{
    this.datos={nombre:'',email:'',asunto:'',mensaje:'',web:''};
    this.aceptaPrivacidad=false;this.referencia.set(0);this.enviado.set(false);
  }
}
