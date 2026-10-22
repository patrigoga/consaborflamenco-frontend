import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { ConfirmacionService } from './confirmacion.service';

export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.comprobar().pipe(
    map(s => s ? true : router.createUrlTree(['/admin/login'], { queryParams: { volver: estado.url } })),
    catchError(() => of(router.createUrlTree(['/admin/login'], { queryParams: { motivo: 'error' } })))
  );
};

export const principalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.esPrincipal() ? true : inject(Router).createUrlTree(['/admin']);
};

/** Si ya hay sesión, el login lleva directamente al panel. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.comprobar().pipe(map(s => s ? router.createUrlTree(['/admin']) : true), catchError(() => of(true)));
};

export interface ConCambiosPendientes { hayCambiosSinGuardar(): boolean; }

export const cambiosPendientesGuard: CanDeactivateFn<ConCambiosPendientes> = componente => {
  if (!componente.hayCambiosSinGuardar()) return true;
  return inject(ConfirmacionService).pedir({
    titulo: 'Hay cambios sin guardar',
    mensaje: 'Si sales ahora, perderás los cambios de esta ficha.',
    aceptar: 'Salir sin guardar',
    cancelar: 'Seguir editando',
    peligro: true
  });
};
