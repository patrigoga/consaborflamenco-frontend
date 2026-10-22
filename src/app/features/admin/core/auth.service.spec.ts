import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { Sesion } from './modelos';

const SESION: Sesion = { id: 1, email: 'p@b.es', nombre: 'Patricia', rol: 'ADMIN_PRINCIPAL', principal: true, expiraTrasInactividadSegundos: 1800 };

describe('AuthService', () => {
  let auth: AuthService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('obtiene la cookie CSRF antes de enviar el login', () => {
    auth.login('p@b.es', 'secreto').subscribe();
    const csrf = backend.expectOne('/api/v1/admin/auth/csrf');
    backend.expectNone('/api/v1/admin/auth/login');
    csrf.flush(null);
    const login = backend.expectOne('/api/v1/admin/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ email: 'p@b.es', password: 'secreto' });
    login.flush(SESION);
    expect(auth.esPrincipal()).toBe(true);
  });

  it('un 401 al comprobar significa "sin sesión", no un error', () => {
    let resultado: unknown = 'sin-valor';
    auth.comprobar().subscribe(s => (resultado = s));
    backend.expectOne('/api/v1/admin/auth/sesion').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(resultado).toBeNull();
    // La segunda vez no repite la petición.
    auth.comprobar().subscribe();
    backend.expectNone('/api/v1/admin/auth/sesion');
  });

  it('logout limpia la sesión aunque el servidor ya la hubiera cerrado', () => {
    auth.comprobar().subscribe();
    backend.expectOne('/api/v1/admin/auth/sesion').flush(SESION);
    auth.logout().subscribe();
    backend.expectOne('/api/v1/admin/auth/logout').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.autenticado()).toBe(false);
  });
});
