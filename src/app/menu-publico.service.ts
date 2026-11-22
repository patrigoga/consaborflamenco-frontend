import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElementoNav, EnlaceNav, FLAMENCO, REVISTA } from './navegacion';

export interface MenuItem {
  clave: string;
  padre: string | null;
  texto: string;
  ruta: string | null;
  posicion: number;
  fijo: boolean;
  activo: boolean;
}

export const MENU_INICIAL: ElementoNav[] = [{ texto: 'Inicio', ruta: '/', exacto: true }];

const RUTAS: Readonly<Record<string, string>> = {
  inicio: '/', historia: '/flamenco/historia', palos: '/flamenco/palos',
  llaves: '/flamenco/llaves-de-oro', artistas: '/revista/artistas',
  academias: '/revista/academias', fotografia: '/revista/fotografia',
  moda: '/revista/moda', penas: '/revista/penas', tablaos: '/revista/tablaos',
  festivales: '/revista/festivales', eventos: '/eventos',
  municipios: '/municipios', servicios: '/servicios', contacto: '/contacto'
};

const ETIQUETAS: Readonly<Record<string, string>> = {
  inicio: 'Inicio', historia: 'Historia', palos: 'Palos', llaves: 'Llaves de Oro',
  artistas: 'Artistas', academias: 'Academias', fotografia: 'Fotografía',
  moda: 'Moda', penas: 'Peñas', tablaos: 'Tablaos', festivales: 'Festivales',
  eventos: 'Eventos', municipios: 'Municipios', servicios: 'Servicios', contacto: 'Contacto'
};

export function construirMenu(items: MenuItem[]): ElementoNav[] {
  const visibles = new Map(items.filter(e => e.activo).map(e => [e.clave, e]));
  // Las rutas, etiquetas y jerarquías proceden del código, no se inyectan URLs
  // arbitrarias desde MySQL a la cabecera pública.
  const grupo = (clave: string) => {
    const modelo = clave === 'flamenco' ? FLAMENCO : REVISTA;
    if (!visibles.has(clave)) return null;
    const hijos: EnlaceNav[] = modelo.hijos.filter(h => [...visibles.values()]
      .some(i => i.padre === clave && RUTAS[i.clave] === h.ruta && ETIQUETAS[i.clave]));
    return hijos.length ? { ...modelo, hijos } : null;
  };
  const menu: ElementoNav[] = [MENU_INICIAL[0]];
  const flamenco = grupo('flamenco');
  if (flamenco) menu.push(flamenco);
  const revista = grupo('revista');
  if (revista) menu.push(revista);
  for (const clave of ['eventos', 'municipios', 'servicios', 'contacto']) {
    if (visibles.has(clave)) menu.push({ texto: ETIQUETAS[clave], ruta: RUTAS[clave] });
  }
  return menu;
}

@Injectable({ providedIn: 'root' })
export class MenuPublicoService {
  private readonly http = inject(HttpClient);
  publico() { return this.http.get<MenuItem[]>('/api/v1/menu-publico'); }
  administrar() { return this.http.get<MenuItem[]>('/api/v1/admin/menu-publico'); }
  guardar(cambios: {clave: string; activo: boolean}[]) {
    return this.http.put<MenuItem[]>('/api/v1/admin/menu-publico', { cambios });
  }
}
