import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Portada: igual que hasta ahora (prerenderizada en la compilación).
  { path: '', renderMode: RenderMode.Prerender },
  // Panel de administración: solo en el navegador. El servidor nunca renderiza datos privados.
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server }
];
