import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECCIONES } from '../../navegacion';
import { PaginaSeccionComponent } from '../../compartido/pagina-seccion.component';

@Component({
  selector: 'csf-pagina-servicios',
  standalone: true,
  imports: [RouterLink, PaginaSeccionComponent],
  template: `
    <csf-pagina-seccion [seccion]="seccion">
      <div class="servicios">
        <section class="intro">
          <p class="ceja">CULTURA · COMUNIDAD · VISIBILIDAD</p>
          <h2>Impulsamos el flamenco. Damos visibilidad a quienes lo hacen posible.</h2>
          <p>Conectamos artistas, academias, peñas flamencas, asociaciones, profesionales, comercios y aficionados. Un espacio para compartir nuestra cultura y dar a conocer cada proyecto.</p>
          <a class="boton" routerLink="/registro">Forma parte de la comunidad</a>
        </section>

        <section class="bloque" aria-labelledby="servicios-titulo">
          <div class="cabecera-bloque"><p class="ceja">QUÉ PODEMOS HACER POR TI</p><h2 id="servicios-titulo">Nuestros servicios</h2></div>
          <div class="rejilla">
            <article class="tarjeta">
              <span class="numero">01 / ARTISTAS</span>
              <h3>Promoción de artistas flamencos</h3>
              <p>Presenta tu trayectoria y acerca tu arte a nuevos públicos.</p>
              <ul><li>Biografía y experiencia profesional</li><li>Fotografías y vídeos</li><li>Espectáculos y eventos</li><li>Cursos y actividades</li><li>Enlaces a redes sociales</li></ul>
              <a routerLink="/registro">Crear mi perfil <span aria-hidden="true">→</span></a>
            </article>
            <article class="tarjeta">
              <span class="numero">02 / FORMACIÓN</span>
              <h3>Academias y formación</h3>
              <p>Da a conocer tu academia y facilita que los alumnos te encuentren.</p>
              <ul><li>Presentación de la academia</li><li>Especialidades y niveles</li><li>Cursos y talleres</li><li>Galería, ubicación y contacto</li></ul>
              <a routerLink="/registro">Registrar mi academia <span aria-hidden="true">→</span></a>
            </article>
            <article class="tarjeta">
              <span class="numero">03 / AGENDA</span>
              <h3>Publicación de eventos</h3>
              <p>Haz visibles espectáculos, festivales, recitales y encuentros flamencos.</p>
              <ul><li>Fechas y localidades</li><li>Carteles e información</li><li>Artistas participantes</li><li>Enlaces para ampliar detalles</li></ul>
              <a routerLink="/eventos">Ver la agenda <span aria-hidden="true">→</span></a>
            </article>
            <article class="tarjeta">
              <span class="numero">04 / PROMOCIÓN</span>
              <h3>Publicidad y patrocinio</h3>
              <p>Promociona tu marca ante una comunidad interesada en el flamenco.</p>
              <ul><li>Banners en páginas principales</li><li>Publicidad por municipios</li><li>Espacios por categorías</li><li>Promociones y descuentos</li></ul>
              <a routerLink="/promocion">Consultar tarifas <span aria-hidden="true">→</span></a>
            </article>
            <article class="tarjeta">
              <span class="numero">05 / TERRITORIO</span>
              <h3>Peñas, asociaciones y municipios</h3>
              <p>Unimos a quienes mantienen vivo el flamenco en cada localidad.</p>
              <ul><li>Entidades culturales</li><li>Actividades y proyectos</li><li>Artistas vinculados al territorio</li><li>Descubrimiento por municipios</li></ul>
              <a routerLink="/municipios">Explorar municipios <span aria-hidden="true">→</span></a>
            </article>
            <article class="tarjeta">
              <span class="numero">06 / TECNOLOGÍA</span>
              <h3>Soluciones digitales</h3>
              <p>Estudiamos las necesidades tecnológicas de profesionales y entidades flamencas.</p>
              <ul><li>Diseño de páginas web</li><li>Herramientas de gestión</li><li>Automatización de contenidos</li><li>Integraciones e inteligencia artificial</li></ul>
              <a routerLink="/contacto">Solicitar información <span aria-hidden="true">→</span></a>
            </article>
          </div>
        </section>
        <section class="cierre">
          <p class="ceja">CRECEMOS CONTIGO</p>
          <h2>El flamenco crece cuando lo compartimos.</h2>
          <p>Sea cual sea tu relación con el flamenco, queremos ayudarte a llegar más lejos.</p>
          <div class="acciones"><a class="boton" routerLink="/registro">Registrarme</a><a class="boton secundario" routerLink="/contacto">Contactar</a></div>
        </section>
      </div>
    </csf-pagina-seccion>
  `,
  styles: [`
    :host{display:block}.servicios{max-width:1140px;margin:0 auto;padding:0 20px 80px;color:#27201b}
    .intro{padding:58px 0 65px;max-width:850px}
    .ceja,.numero{font-size:12px;font-weight:800;letter-spacing:.16em;color:#9c6f36}
    h2,h3{font-family:Georgia,serif;font-weight:normal}h2{font-size:clamp(30px,4vw,45px);line-height:1.18;margin:12px 0 18px}
    .intro p:not(.ceja){font-size:18px;line-height:1.75;color:#675d52}
    .boton{display:inline-block;background:#cda15c;color:#21180f;padding:14px 23px;border-radius:5px;font-weight:750;margin-top:18px;text-decoration:none}
    .boton:hover{background:#e3ba79}.bloque{padding-bottom:68px}
    .cabecera-bloque{margin-bottom:26px}.rejilla{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
    .tarjeta{display:flex;flex-direction:column;background:white;border:1px solid #e4d9ca;border-top:4px solid #b48a52;border-radius:9px;padding:28px;box-shadow:0 7px 27px #281b0e0b}
    .tarjeta h3{font-size:27px;line-height:1.15;margin:17px 0 10px}
    .tarjeta p,.tarjeta li{font-size:14px;line-height:1.7;color:#665d52}
    .tarjeta ul{padding-left:19px;margin:12px 0 22px}.tarjeta li{margin:4px 0}
    .tarjeta a{margin-top:auto;padding-top:10px;font-weight:750;color:#865923;text-decoration:underline;text-underline-offset:4px}
    .cierre{text-align:center;padding:52px 24px;background:#251b16;color:#fff;border-radius:12px}
    .cierre h2{max-width:740px;margin:12px auto}.cierre p:not(.ceja){color:#e4d9cb}
    .acciones{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.secundario{background:transparent;color:#f5d9ad;border:1px solid #cda15c}.secundario:hover{background:#3d3026}
    @media(max-width:940px){.rejilla{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:600px){.rejilla{grid-template-columns:1fr}.intro{padding:42px 0}.tarjeta{padding:23px}}
  `]
})
export class ServiciosPage {
  readonly seccion = SECCIONES.servicios;
}
