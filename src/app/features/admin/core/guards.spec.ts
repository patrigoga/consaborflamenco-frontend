import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { principalGuard, sesionGuard } from './guards';
import { AuthService } from './auth.service';

describe('Guards del panel', () => {
  let backend: HttpTestingController;
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = { url: '/admin/artistas/3' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    backend = TestBed.inject(HttpTestingController);
  });

  it('sin sesión redirige al login recordando la página pedida', () => {
    let resultado: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => (sesionGuard(ruta, estado) as Observable<boolean | UrlTree>).subscribe(r => (resultado = r)));
    backend.expectOne('/api/v1/admin/auth/sesion').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(resultado instanceof UrlTree).toBe(true);
    expect(String(resultado)).toBe('/admin/login?volver=%2Fadmin%2Fartistas%2F3');
  });

  it('con sesión deja pasar', () => {
    let resultado: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => (sesionGuard(ruta, estado) as Observable<boolean | UrlTree>).subscribe(r => (resultado = r)));
    backend.expectOne('/api/v1/admin/auth/sesion').flush({ id: 1, email: 'a@b.es', nombre: 'A', rol: 'ADMIN', principal: false, expiraTrasInactividadSegundos: 1 });
    expect(resultado).toBe(true);
  });

  it('las cuentas de acceso solo para el principal', () => {
    const auth = TestBed.inject(AuthService);
    auth.comprobar().subscribe();
    backend.expectOne('/api/v1/admin/auth/sesion').flush({ id: 1, email: 'a@b.es', nombre: 'A', rol: 'ADMIN', principal: false, expiraTrasInactividadSegundos: 1 });
    const r = TestBed.runInInjectionContext(() => principalGuard(ruta, estado));
    expect(String(r)).toBe('/admin');
  });
});
