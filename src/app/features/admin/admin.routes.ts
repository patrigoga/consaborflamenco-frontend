import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';
import { cambiosPendientesGuard, invitadoGuard, principalGuard, sesionGuard } from './core/guards';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      {
        path: 'login',
        canActivate: [invitadoGuard],
        title: 'Acceso – Panel ConSaborFlamenco',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
      },
      {
        path: '',
        canActivate: [sesionGuard],
        loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', title: 'Inicio – Panel ConSaborFlamenco',
            loadComponent: () => import('./inicio/inicio.component').then(m => m.InicioComponent) },
          { path: 'consagrados', title: 'Artistas consagrados – Panel ConSaborFlamenco',
            loadComponent: () => import('./consagrados/consagrados-lista.component').then(m => m.ConsagradosListaComponent) },
          { path: 'consagrados/nuevo', title: 'Nuevo artista consagrado – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./consagrados/consagrado-form.component').then(m => m.ConsagradoFormComponent) },
          { path: 'consagrados/:id', title: 'Editar artista consagrado – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./consagrados/consagrado-form.component').then(m => m.ConsagradoFormComponent) },
          { path: 'eventos', title: 'Eventos – Panel ConSaborFlamenco',
            loadComponent: () => import('./eventos/eventos-lista.component').then(m => m.EventosListaComponent) },
          { path: 'eventos/nuevo', title: 'Nuevo evento – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./eventos/evento-form.component').then(m => m.EventoFormComponent) },
          { path: 'eventos/:id', title: 'Editar evento – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./eventos/evento-form.component').then(m => m.EventoFormComponent) },
          { path: 'artistas', title: 'Artistas – Panel ConSaborFlamenco',
            loadComponent: () => import('./artistas/artistas-lista.component').then(m => m.ArtistasListaComponent) },
          { path: 'artistas/nuevo', title: 'Nuevo artista – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./artistas/artista-form.component').then(m => m.ArtistaFormComponent) },
          { path: 'artistas/:id', title: 'Editar artista – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./artistas/artista-form.component').then(m => m.ArtistaFormComponent) },
          { path: 'menu-publico', title: 'Menú público – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./menu-publico/menu-publico-admin.component').then(m => m.MenuPublicoAdminComponent) },
          { path: 'base-datos', title: 'Base de datos – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./base-datos/base-datos-admin.component').then(m => m.BaseDatosAdminComponent) },
          { path: 'cargar-datos', title: 'Cargar datos – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./cargar-datos/cargar-datos.component').then(m => m.CargarDatosComponent) },
          { path: 'municipios', title: 'Catálogo de municipios – Panel ConSaborFlamenco',
            loadComponent: () => import('./municipios/catalogo-municipios-admin.component').then(m => m.CatalogoMunicipiosAdminComponent) },
          { path: 'promocion', title: 'Promoción – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./promocion/promocion-admin.component').then(m => m.PromocionAdminComponent) },
          { path: 'banners-municipales', title: 'Contratación municipal – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./promocion/banners-municipales-admin.component').then(m => m.BannersMunicipalesAdminComponent) },
          { path: 'publicidad-municipal', title: 'Publicidad municipal – Panel ConSaborFlamenco',
            loadComponent: () => import('./municipios/promociones-municipios-admin.component').then(m => m.PromocionesMunicipiosAdminComponent) },
          { path: 'destacados', title: 'Destacados – Panel ConSaborFlamenco',
            loadComponent: () => import('./destacados/destacados.component').then(m => m.DestacadosComponent) },
          { path: 'miembros', title: 'Gestión de miembros – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./miembros/miembros-admin.component').then(m => m.MiembrosAdminComponent) },
          { path: 'cuentas', title: 'Cuentas – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent) },
          { path: 'mi-cuenta', title: 'Mi cuenta – Panel ConSaborFlamenco',
            loadComponent: () => import('./cuenta/cuenta.component').then(m => m.CuentaComponent) }
        ]
      }
    ]
  }
];
