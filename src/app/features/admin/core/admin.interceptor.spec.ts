import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { adminInterceptor } from './admin.interceptor';
import { AuthService } from './auth.service';

describe('Integración Angular ↔ Spring: CSRF, sesión e interceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(
          withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
          withInterceptors([adminInterceptor])
        ),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    document.cookie = 'XSRF-TOKEN=token-de-spring; path=/';
  });

  afterEach(() => {
    backend.verify();
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('reenvía la cookie XSRF-TOKEN en la cabecera X-XSRF-TOKEN en escrituras', () => {
    http.post('/api/v1/admin/artistas/1/publicar', null).subscribe();
    const req = backend.expectOne('/api/v1/admin/artistas/1/publicar');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('token-de-spring');
    req.flush({});
  });

  it('no envía el token en lecturas ni a otros dominios', () => {
    http.get('/api/v1/admin/artistas').subscribe();
    expect(backend.expectOne('/api/v1/admin/artistas').request.headers.has('X-XSRF-TOKEN')).toBe(false);
    http.post('https://otro-dominio.example/api', null).subscribe();
    expect(backend.expectOne('https://otro-dominio.example/api').request.headers.has('X-XSRF-TOKEN')).toBe(false);
    backend.match(() => true).forEach(r => r.flush({}));
  });

  it('usa el token nuevo cuando Spring lo rota tras el login', () => {
    document.cookie = 'XSRF-TOKEN=token-rotado; path=/';
    http.put('/api/v1/admin/artistas/2', {}).subscribe();
    expect(backend.expectOne('/api/v1/admin/artistas/2').request.headers.get('X-XSRF-TOKEN')).toBe('token-rotado');
    backend.match(() => true).forEach(r => r.flush({}));
  });

  it('si Spring rechaza el CSRF, pide un token nuevo y reintenta una sola vez', () => {
    let respuesta: unknown;
    http.post('/api/v1/admin/artistas', { nombre: 'X' }).subscribe(r => (respuesta = r));
    // Spring rechaza la petición (p. ej. la cookie se perdió) y entrega un token nuevo.
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    backend.expectOne('/api/v1/admin/artistas').flush({ codigo: 'CSRF' }, { status: 403, statusText: 'Forbidden' });
    document.cookie = 'XSRF-TOKEN=token-nuevo; path=/';
    backend.expectOne('/api/v1/admin/auth/csrf').flush(null, { status: 204, statusText: 'No Content' });
    const reintento = backend.expectOne('/api/v1/admin/artistas');
    expect(reintento.request.headers.get('X-CSF-Reintento')).toBe('1');
    expect(reintento.request.headers.get('X-XSRF-TOKEN')).toBe('token-nuevo');
    reintento.flush({ id: 9 });
    expect(respuesta).toEqual({ id: 9 });
  });

  it('no entra en bucle si el reintento también falla', () => {
    let error: unknown;
    http.post('/api/v1/admin/artistas', {}).subscribe({ error: e => (error = e) });
    backend.expectOne('/api/v1/admin/artistas').flush({ codigo: 'CSRF' }, { status: 403, statusText: 'Forbidden' });
    backend.expectOne('/api/v1/admin/auth/csrf').flush(null);
    backend.expectOne('/api/v1/admin/artistas').flush({ codigo: 'CSRF' }, { status: 403, statusText: 'Forbidden' });
    expect(error).toBeTruthy();
  });

  it('un 403 de permisos no se reintenta', () => {
    let status = 0;
    http.post('/api/v1/admin/usuarios', {}).subscribe({ error: e => (status = e.status) });
    backend.expectOne('/api/v1/admin/usuarios').flush({ codigo: 'PROHIBIDO' }, { status: 403, statusText: 'Forbidden' });
    expect(status).toBe(403);
  });

  it('un 401 (sesión caducada o revocada) devuelve al login conservando la página', () => {
    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    // Simula una sesión abierta.
    auth.comprobar().subscribe();
    backend.expectOne('/api/v1/admin/auth/sesion').flush({ id: 1, nombre: 'A', email: 'a@b.es', rol: 'ADMIN', principal: false, expiraTrasInactividadSegundos: 1800 });
    expect(auth.autenticado()).toBe(true);

    http.get('/api/v1/admin/artistas').subscribe({ error: () => {} });
    backend.expectOne('/api/v1/admin/artistas').flush({ codigo: 'NO_AUTENTICADO' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.autenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/admin/login'], expect.objectContaining({ queryParams: expect.objectContaining({ motivo: 'caducada' }) }));
  });

  it('no toca las peticiones de la API pública', () => {
    let status = 0;
    http.get('/api/v1/artistas').subscribe({ error: e => (status = e.status) });
    backend.expectOne('/api/v1/artistas').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    backend.expectNone('/api/v1/admin/auth/csrf');
  });
});
