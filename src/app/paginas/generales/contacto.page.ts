import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';

@Component({
  selector: 'csf-pagina-contacto',
  standalone: true,
  imports: [RouterLink, PaginaSeccionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <div class="contacto">
        <section class="presentacion">
          <p class="ceja">HABLEMOS DE FLAMENCO</p>
          <h2>Estamos cerca de quienes viven y sienten el flamenco.</h2>
          <p>¿Quieres presentar un proyecto, promocionar una actividad o colaborar con ConSaborFlamenco? Queremos conocer tu propuesta y seguir construyendo una comunidad que conecte a artistas, entidades culturales, negocios y aficionados.</p>
        </section>
        <section aria-labelledby="motivos-titulo">
          <p class="ceja">¿EN QUÉ PODEMOS AYUDARTE?</p>
          <h2 id="motivos-titulo">Encuentra tu camino</h2>
          <div class="rejilla">
            <article class="tarjeta"><span class="numero">01</span><h3>Artistas y academias</h3><p>Tu perfil profesional, formación, cursos y actividades.</p><a routerLink="/registro">Crear un perfil →</a></article>
            <article class="tarjeta"><span class="numero">02</span><h3>Publicidad y patrocinio</h3><p>Espacios publicitarios, tarifas, promociones y colaboraciones comerciales.</p><a routerLink="/promocion">Consultar publicidad →</a></article>
            <article class="tarjeta"><span class="numero">03</span><h3>Eventos y festivales</h3><p>Comparte espectáculos, recitales, festivales y encuentros.</p><a routerLink="/eventos">Consultar la agenda →</a></article>
            <article class="tarjeta"><span class="numero">04</span><h3>Peñas, asociaciones y ayuntamientos</h3><p>Colaboración cultural y presencia del flamenco en los municipios.</p><a routerLink="/municipios">Explorar municipios →</a></article>
          </div>
        </section>
        <section class="contacto-final">
          <div><p class="ceja">TU PROPUESTA NOS IMPORTA</p><h2>Conectemos para seguir haciendo crecer el flamenco.</h2><p>Estamos preparando un formulario seguro para recibir y organizar consultas sobre colaboraciones, publicidad, servicios digitales y soporte. Mientras terminamos ese canal, puedes descubrir las opciones disponibles desde la página de servicios.</p></div>
          <a class="boton" routerLink="/servicios">Descubrir servicios →</a>
        </section>
      </div>
    </csf-pagina-seccion>
  `,
  styles: [`
    :host{display:block}.contacto{max-width:1140px;margin:auto;padding:0 20px 90px;color:#29211b}
    .presentacion{max-width:850px;padding:58px 0 65px}
    .ceja,.numero{font-size:12px;font-weight:800;letter-spacing:.16em;color:#99703c}
    h2,h3{font-family:Georgia,serif;font-weight:normal}
    h2{font-size:clamp(30px,4vw,44px);line-height:1.16;margin:13px 0 19px}
    .presentacion p:not(.ceja){font-size:18px;line-height:1.75;color:#665d53}
    .rejilla{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:26px}
    .tarjeta{padding:28px;background:#fff;border:1px solid #e6dbcc;border-radius:10px;border-left:4px solid #be9356}
    .tarjeta h3{font-size:27px;margin:14px 0}.tarjeta p{line-height:1.7;color:#645b52}
    .tarjeta a{display:inline-block;margin-top:10px;font-weight:750;color:#865923;text-decoration:underline;text-underline-offset:4px}
    .contacto-final{margin-top:66px;display:flex;align-items:center;gap:36px;justify-content:space-between;background:#241b17;color:#fff;padding:38px;border-radius:12px}
    .contacto-final div{max-width:710px}.contacto-final p:not(.ceja){line-height:1.75;color:#ddcfc0}
    .boton{flex-shrink:0;display:inline-block;padding:14px 20px;border-radius:5px;background:#cda15c;color:#201a13;text-decoration:none;font-weight:750}
    .boton:hover{background:#e2ba7c}
    @media(max-width:700px){.rejilla{grid-template-columns:1fr}.presentacion{padding:42px 0}.contacto-final{display:block;padding:26px}.boton{margin-top:15px}}
  `]
})
export class ContactoPage {
  readonly seccion = SECCIONES.contacto;
}
