import { RenderMode, ServerRoute } from '@angular/ssr';
import { RUTAS_PRERENDER } from './navegacion';

export const serverRoutes: ServerRoute[] = [
  // Panel de administración: solo en el navegador. El servidor nunca renderiza datos privados.
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Páginas públicas: HTML prerenderizado en la compilación, con su título, descripción y H1.
  ...RUTAS_PRERENDER.map(path => ({ path, renderMode: RenderMode.Prerender as const })),
  // /flamenco y /revista redirigen a su primera sección.
  { path: 'flamenco', renderMode: RenderMode.Server },
  { path: 'revista', renderMode: RenderMode.Server },
  // Cualquier otra dirección: página 404 con código HTTP 404 real.
  { path: '**', renderMode: RenderMode.Server, status: 404 }
];
