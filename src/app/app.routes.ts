import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'ConSaborFlamenco 2.0' },
  // El panel se carga bajo demanda: no añade peso a la web pública.
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: '' }
];
