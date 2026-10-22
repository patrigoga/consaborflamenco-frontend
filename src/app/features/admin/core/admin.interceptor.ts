import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const ADMIN = '/api/v1/admin/';
const SIN_REDIRECCION = ['/api/v1/admin/auth/sesion', '/api/v1/admin/auth/login', '/api/v1/admin/auth/csrf'];
const METODOS_SEGUROS = ['GET', 'HEAD', 'OPTIONS'];
const REINTENTADO = 'X-CSF-Reintento';
const CABECERA_CSRF = 'X-XSRF-TOKEN';

/**
 * Para la API de administración:
 * - 401: la sesión caducó o fue revocada → vuelta al login conservando la página.
 * - 403 por CSRF (token ausente o rotado): se pide uno nuevo y se reintenta una sola vez.
 *
 * El interceptor XSRF de Angular se ejecuta antes que este, así que en el reintento hay que añadir
 * la cabecera a mano con el token recién recibido (si no, la repetición saldría sin token).
 */
export const adminInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(ADMIN)) return next(req);
  const auth = inject(AuthService);
  const xsrf = inject(HttpXsrfTokenExtractor);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      if (error.status === 401 && !SIN_REDIRECCION.some(u => req.url.startsWith(u))) {
        auth.sesionCaducada();
      }
      if (esFalloCsrf(req, error)) {
        return auth.csrf().pipe(switchMap(() => {
          const token = xsrf.getToken();
          const cabeceras: Record<string, string> = { [REINTENTADO]: '1' };
          if (token) cabeceras[CABECERA_CSRF] = token;
          return next(req.clone({ setHeaders: cabeceras }));
        }));
      }
      return throwError(() => error);
    })
  );
};

function esFalloCsrf(req: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
  return error.status === 403
    && !METODOS_SEGUROS.includes(req.method)
    && !req.headers.has(REINTENTADO)
    && (error.error as { codigo?: string } | null)?.codigo === 'CSRF';
}
