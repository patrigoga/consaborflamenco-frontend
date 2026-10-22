import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { NOMBRE_SITIO, SITIO_URL } from '../navegacion';

export interface DatosSeo {
  descripcion?: string;
  /** Título completo, sin añadir «| ConSaborFlamenco» (portada). */
  tituloCompleto?: string;
  /** No indexar (p. ej. la página 404). */
  noindex?: boolean;
}

/**
 * Título, descripción, Open Graph y URL canónica por ruta. Se ejecuta también en SSR y en el
 * prerenderizado, así que cada página llega a los buscadores con sus propias etiquetas.
 * Las rutas /admin gestionan su título y su noindex por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(estado: RouterStateSnapshot): void {
    const base = this.buildTitle(estado);
    const ruta = this.rutaMasProfunda(estado.root);
    const datos = ruta.data as DatosSeo;
    const path = estado.url.split(/[?#]/)[0] || '/';

    if (path.startsWith('/admin')) {
      this.title.setTitle(base ?? `Panel ${NOMBRE_SITIO}`);
      this.quitarCanonica();
      return;
    }

    const titulo = datos.tituloCompleto ?? (base ? `${base} | ${NOMBRE_SITIO}` : NOMBRE_SITIO);
    this.title.setTitle(titulo);
    const url = SITIO_URL + (path === '/' ? '/' : path);
    this.etiqueta('name', 'description', datos.descripcion);
    this.etiqueta('property', 'og:title', titulo);
    this.etiqueta('property', 'og:description', datos.descripcion);
    this.etiqueta('property', 'og:type', 'website');
    this.etiqueta('property', 'og:site_name', NOMBRE_SITIO);
    if (datos.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
      this.meta.removeTag('property="og:url"');
      this.quitarCanonica();
    } else {
      this.meta.removeTag('name="robots"');
      this.etiqueta('property', 'og:url', url);
      this.canonica(url);
    }
  }

  private rutaMasProfunda(r: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (r.firstChild) r = r.firstChild;
    return r;
  }

  private etiqueta(atributo: 'name' | 'property', clave: string, valor?: string): void {
    if (valor) this.meta.updateTag({ [atributo]: clave, content: valor });
    else this.meta.removeTag(`${atributo}="${clave}"`);
  }

  private canonica(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private quitarCanonica(): void {
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }
}
