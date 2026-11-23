import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { routes } from '../../app.routes';
import { AuthService } from './core/auth.service';

describe('Navegación real del administrador', () => {
  let backend: HttpTestingController;
  const sesion = {id:1,email:'admin@ejemplo.test',nombre:'Administrador',
    rol:'ADMIN',principal:true,expiraTrasInactividadSegundos:900};
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: {
          comprobar: () => of(sesion),
          esPrincipal: signal(true),
          sesion: signal(sesion),
          logout: () => of(void 0)
        } }
      ]
    });
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    backend.match(() => true).forEach(req => req.flush([]));
    backend.verify();
  });

  it('el menú enlaza las rutas reales de Destacados y Municipios', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/admin');
    h.detectChanges();
    const enlaces = Array.from(h.routeNativeElement!.querySelectorAll<HTMLAnchorElement>('a[href]'));
    for (const ruta of ['/admin/destacados','/admin/municipios','/admin/publicidad-municipal',
      '/admin/promocion','/admin/artistas','/admin/eventos']) {
      expect(enlaces.some(a => a.getAttribute('href') === ruta)).toBe(true);
    }
  });

  it('abre Destacados con la ruta publicada y carga sus datos', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/admin/destacados');
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Destacados en portada');
    expect(TestBed.inject(Router).url).toBe('/admin/destacados');
    backend.expectOne('/api/v1/admin/catalogos').flush({maxDestacados:6});
    backend.expectOne('/api/v1/admin/artistas/destacados').flush([]);
    backend.expectOne(r => r.url==='/api/v1/admin/artistas').flush({content:[],totalElements:0});
    backend.expectOne('/api/v1/portada/protagonistas').flush([]);
  });

  it('abre Municipios y carga el catálogo oficial', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/admin/municipios');
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Catálogo territorial oficial');
    expect(TestBed.inject(Router).url).toBe('/admin/municipios');
    backend.expectOne('/api/v1/territorio/provincias').flush([]);
    backend.expectOne(r => r.url==='/api/v1/territorio/municipios').flush([
      {id:1,nombre:'Montilla',provincia:'Córdoba',region:'Andalucía'}
    ]);
    h.detectChanges();
    expect(h.routeNativeElement!.textContent).toContain('Montilla');
  });
});
