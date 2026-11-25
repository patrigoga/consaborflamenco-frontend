import { Route, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LayoutPublicoComponent } from './layout/layout-publico.component';
import { ClaveSeccion, SECCIONES } from './navegacion';
import { DatosSeo } from './seo/seo-title.strategy';
import { perfilArtistaResolver } from './features/artistas/perfil-artista.resolver';

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
          { path: 'artistas/:slug', title: 'Perfil de artista', resolve: { ficha: perfilArtistaResolver }, loadComponent: () => import('./features/artistas/perfil-artista.page').then(m => m.PerfilArtistaPage) },
          seccion('academias', () => import('./paginas/revista/academias.page').then(m => m.AcademiasPage)),
          seccion('fotografia', () => import('./paginas/revista/fotografia.page').then(m => m.FotografiaPage)),
          seccion('moda', () => import('./paginas/revista/moda.page').then(m => m.ModaPage)),
          seccion('penas', () => import('./paginas/revista/penas.page').then(m => m.PenasPage)),
          seccion('tablaos', () => import('./paginas/revista/tablaos.page').then(m => m.TablaosPage)),
          seccion('festivales', () => import('./paginas/revista/festivales.page').then(m => m.FestivalesPage))
        ]
      },
      seccion('municipios', () => import('./paginas/generales/municipios.page').then(m => m.MunicipiosPage)),
      { path: 'municipios/:municipio/:provincia', title: 'Municipio flamenco – ConSaborFlamenco',
        loadComponent: () => import('./paginas/generales/municipios.page').then(m => m.MunicipiosPage) },
      { path: 'municipios/:id', title: 'Municipio flamenco – ConSaborFlamenco',
        loadComponent: () => import('./paginas/generales/municipios.page').then(m => m.MunicipiosPage) },
      seccion('eventos', () => import('./paginas/generales/eventos.page').then(m => m.EventosPage)),
      { path: 'eventos/:slug', title: 'Evento flamenco – ConSaborFlamenco',
        loadComponent: () => import('./paginas/generales/evento-detalle.page').then(m => m.EventoDetallePage) },
      { path: 'promocion', title: 'Promoción y publicidad – ConSaborFlamenco',
        loadComponent: () => import('./paginas/generales/promocion.page').then(m => m.PromocionPage) },
      seccion('servicios', () => import('./paginas/generales/servicios.page').then(m => m.ServiciosPage)),
      seccion('contacto', () => import('./paginas/generales/contacto.page').then(m => m.ContactoPage)),
      seccion('membresias', () => import('./paginas/generales/membresias.page').then(m => m.MembresiasPage)),
      { path: 'verificar-correo', title: 'Verificar correo – ConSaborFlamenco',
        data: { noindex: true },
        loadComponent: () => import('./features/miembros/verificar-correo.page').then(m => m.VerificarCorreoPage) },
      { path: 'acceso', title: 'Acceso de miembros – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./features/miembros/miembro-acceso.page').then(m => m.MiembroAccesoPage) },
      { path: 'mi-cuenta/eventos', title: 'Mis eventos – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./features/miembros/mis-eventos.page').then(m => m.MisEventosPage) },
      { path: 'mi-cuenta/eventos/nuevo', title: 'Crear evento – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./features/miembros/evento-editor.page').then(m => m.EventoEditorPage) },
      { path: 'mi-cuenta/eventos/:id/editar', title: 'Editar evento – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./features/miembros/evento-editor.page').then(m => m.EventoEditorPage) },
      { path: 'mi-cuenta/perfil', title: 'Mi perfil – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./features/miembros/mi-perfil.page').then(m => m.MiPerfilPage) },
      { path: 'mi-cuenta', title: 'Mi cuenta – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./features/miembros/mi-cuenta.page').then(m => m.MiCuentaPage) },
      { path: 'mi-cuenta/banners', title: 'Mis banners – ConSaborFlamenco', data: { noindex: true },
        loadComponent: () => import('./publicidad/mis-banners.page').then(m => m.MisBannersPage) },
      { path: 'registro', title: 'Registro profesional – ConSaborFlamenco', data: { noindex: true }, loadComponent: () => import('./paginas/generales/registro-profesional.page').then(m => m.RegistroProfesionalComponent) },
      { path: 'vista-previa/artista', title: 'Diseño del perfil de artista', data: { noindex: true }, loadComponent: () => import('./features/artistas/perfil-preview.page').then(m => m.PerfilPreviewPage) },
      {
        path: '**', title: 'Página no encontrada',
        data: { noindex: true, descripcion: 'La página que buscas no existe en ConSaborFlamenco.' } satisfies DatosSeo,
        loadComponent: () => import('./paginas/generales/no-encontrada.page').then(m => m.NoEncontradaPage)
      }
    ]
  }
];
