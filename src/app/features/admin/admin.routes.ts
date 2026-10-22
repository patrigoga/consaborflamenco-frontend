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
          { path: 'artistas', title: 'Artistas – Panel ConSaborFlamenco',
            loadComponent: () => import('./artistas/artistas-lista.component').then(m => m.ArtistasListaComponent) },
          { path: 'artistas/nuevo', title: 'Nuevo artista – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./artistas/artista-form.component').then(m => m.ArtistaFormComponent) },
          { path: 'artistas/:id', title: 'Editar artista – Panel ConSaborFlamenco', canDeactivate: [cambiosPendientesGuard],
            loadComponent: () => import('./artistas/artista-form.component').then(m => m.ArtistaFormComponent) },
          { path: 'destacados', title: 'Destacados – Panel ConSaborFlamenco',
            loadComponent: () => import('./destacados/destacados.component').then(m => m.DestacadosComponent) },
          { path: 'cuentas', title: 'Cuentas – Panel ConSaborFlamenco', canActivate: [principalGuard],
            loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent) },
          { path: 'mi-cuenta', title: 'Mi cuenta – Panel ConSaborFlamenco',
            loadComponent: () => import('./cuenta/cuenta.component').then(m => m.CuentaComponent) }
        ]
      }
    ]
  }
];
