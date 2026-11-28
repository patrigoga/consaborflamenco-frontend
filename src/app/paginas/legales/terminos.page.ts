import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TERMINOS_PENDIENTES, TERMINOS_SECCIONES } from './terminos-contenido';

@Component({
  selector: 'csf-terminos',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="terminos" aria-labelledby="terminos-titulo">
      <header>
        <a class="volver" routerLink="/">Inicio</a>
        <p class="ceja">CONSABORFLAMENCO · INFORMACIÓN LEGAL</p>
        <h1 id="terminos-titulo">Términos y condiciones</h1>
        <p class="entradilla">Uso de la plataforma, publicación de contenidos y contratación de servicios.</p>
        <p class="version">Borrador preparado el 28 de noviembre de 2026</p>
      </header>
      <aside class="borrador" aria-labelledby="borrador-titulo">
        <h2 id="borrador-titulo">Borrador pendiente de completar</h2>
        <p>Este texto está en preparación y no constituye unas condiciones publicadas ni habilita nuevas contrataciones.</p>
        <p>Antes de publicarlo hay que completar los siguientes datos y decisiones:</p>
        <ul>@for (pendiente of pendientes; track pendiente) { <li>{{ pendiente }}</li> }</ul>
      </aside>
      <section aria-labelledby="titular-titulo">
        <h2 id="titular-titulo">Titular de la plataforma</h2>
        <p>Marca y sitio web: ConSaborFlamenco · consaborflamenco.com.</p>
        <p>La identificación del titular, NIF, domicilio y canales de contacto están pendientes de confirmación. Se incorporarán aquí antes de publicar la versión definitiva.</p>
      </section>
      <nav class="indice" aria-label="Contenido de las condiciones">
        <h2>Contenido</h2>
        <ol>@for (s of secciones; track s.id) { <li><a [href]="'/terminos-y-condiciones#' + s.id">{{ s.titulo }}</a></li> }</ol>
      </nav>
      @for (s of secciones; track s.id) {
        <section [attr.aria-labelledby]="s.id">
          <h2 [id]="s.id">{{ s.titulo }}</h2>
          @for (parrafo of s.parrafos; track $index) { <p>{{ parrafo }}</p> }
        </section>
      }
      <section class="referencias" aria-labelledby="normativa-titulo">
        <h2 id="normativa-titulo">Normativa de referencia</h2>
        <p><a href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758#a10" target="_blank" rel="noopener noreferrer">Ley de servicios de la sociedad de la información y de comercio electrónico</a>.</p>
        <p><a href="https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555#a97" target="_blank" rel="noopener noreferrer">Ley General para la Defensa de los Consumidores y Usuarios</a>.</p>
      </section>
    </article>
  `,
  styles: [`
    :host{display:block;background:#fcfbf8;color:#29211b}
    .terminos{max-width:900px;margin:0 auto;padding:40px 24px 80px}
    header{padding:12px 0 28px;border-bottom:1px solid #dfd4c5}
    .volver{display:inline-block;margin-bottom:24px}
    .ceja{font-size:.8rem;font-weight:750;letter-spacing:.12em;color:#805d2d}
    h1,h2{font-family:Georgia,serif;font-weight:normal}
    h1{font-size:clamp(2.1rem,5vw,3.4rem);line-height:1.12;margin:12px 0 20px}
    h2{font-size:1.6rem;line-height:1.25;margin:0 0 18px;scroll-margin-top:110px}
    .entradilla{font-size:1.15rem}.version{font-size:.9rem;color:#655b50}
    p,li{font-size:1rem;line-height:1.75;overflow-wrap:anywhere}
    section,.indice{padding:32px 0;border-bottom:1px solid #e6ded3}
    a{color:#78501f;text-decoration:underline;text-underline-offset:4px}
    a:focus-visible{outline:3px solid #805d2d;outline-offset:4px}
    .borrador{padding:24px;border:1px solid #b78035;border-left:5px solid #b78035;background:#fff5df;border-radius:8px;margin:30px 0}
    .borrador h2{font-size:1.4rem}.borrador ul{padding-left:22px}.borrador li{margin:8px 0}
    .indice ol{columns:2;column-gap:36px;padding-left:24px}.indice li{break-inside:avoid;padding:5px 0}
    .referencias{border-bottom:0}
    @media(max-width:600px){.terminos{padding:26px 18px 50px}.indice ol{columns:1}.borrador{padding:20px}h2{font-size:1.4rem}}
    @media print{.terminos{max-width:none;padding:0}a{color:inherit}section{break-inside:avoid}}
  `]
})
export class TerminosPage {
  readonly secciones = TERMINOS_SECCIONES;
  readonly pendientes = TERMINOS_PENDIENTES;
}
