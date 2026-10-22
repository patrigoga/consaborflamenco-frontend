import { Route, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LayoutPublicoComponent } from './layout/layout-publico.component';
import { ClaveSeccion, SECCIONES } from './navegacion';
import { DatosSeo } from './seo/seo-title.strategy';

/** Ruta de una sección: URL, título y descripción salen de navegacion.ts. */
function seccion(clave: ClaveSeccion, loadComponent: Route['loadComponent']): Route {
  const s = SECCIONES[clave];
  const ultimaParte = s.ruta.split('/').pop()!;
  const datos: DatosSeo = { descripcion: s.descripcion };
  return { path: ultimaParte, title: s.titulo, data: datos, loadComponent };
}

export const routes: Routes = [
  // Panel de administración: intacto, con su propio marco y autenticación.
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },

  {
    path: '',
    component: LayoutPublicoComponent,
    children: [
      {
        path: '', pathMatch: 'full', component: HomeComponent,
        data: {
          tituloCompleto: 'ConSaborFlamenco | Artistas, historia y cultura flamenca',
          descripcion: 'Artistas, espectáculos, academias e historia del flamenco. Un espacio para descubrir y compartir nuestra cultura.'
        } satisfies DatosSeo
      },
      {
        path: 'flamenco',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'historia' },
          seccion('historia', () => import('./paginas/flamenco/historia.page').then(m => m.HistoriaPage)),
          seccion('palos', () => import('./paginas/flamenco/palos.page').then(m => m.PalosPage)),
          seccion('llaves', () => import('./paginas/flamenco/llaves-de-oro.page').then(m => m.LlavesDeOroPage))
        ]
      },
      {
        path: 'revista',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'artistas' },
          seccion('artistas', () => import('./paginas/revista/artistas.page').then(m => m.ArtistasPage)),
          seccion('academias', () => import('./paginas/revista/academias.page').then(m => m.AcademiasPage)),
          seccion('fotografia', () => import('./paginas/revista/fotografia.page').then(m => m.FotografiaPage)),
          seccion('moda', () => import('./paginas/revista/moda.page').then(m => m.ModaPage)),
          seccion('penas', () => import('./paginas/revista/penas.page').then(m => m.PenasPage)),
          seccion('tablaos', () => import('./paginas/revista/tablaos.page').then(m => m.TablaosPage)),
          seccion('festivales', () => import('./paginas/revista/festivales.page').then(m => m.FestivalesPage))
        ]
      },
      seccion('eventos', () => import('./paginas/generales/eventos.page').then(m => m.EventosPage)),
      seccion('servicios', () => import('./paginas/generales/servicios.page').then(m => m.ServiciosPage)),
      seccion('contacto', () => import('./paginas/generales/contacto.page').then(m => m.ContactoPage)),
      seccion('membresias', () => import('./paginas/generales/membresias.page').then(m => m.MembresiasPage)),
      {
        path: '**', title: 'Página no encontrada',
        data: { noindex: true, descripcion: 'La página que buscas no existe en ConSaborFlamenco.' } satisfies DatosSeo,
        loadComponent: () => import('./paginas/generales/no-encontrada.page').then(m => m.NoEncontradaPage)
      }
    ]
  }
];
