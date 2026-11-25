import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MunicipiosPage } from './municipios.page';

describe('Buscador público de municipios', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'municipios', component: MunicipiosPage },
          { path: 'municipios/:municipio/:provincia', component: MunicipiosPage },
          { path: 'municipios/:id', component: MunicipiosPage }]),
        provideHttpClient(), provideHttpClientTesting()
      ]
    });
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    jest.useRealTimers();
    backend.verify();
  });

  it('filtra mientras se escribe sin pulsar Buscar, con 300 ms de espera', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/municipios', MunicipiosPage);
    harness.detectChanges();
    backend.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === '').flush([]);
    harness.detectChanges();

    jest.useFakeTimers();
    page.alEscribir('Alge');
    jest.advanceTimersByTime(299);
    backend.expectNone(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'Alge');
    jest.advanceTimersByTime(1);
    const req = backend.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'Alge');
    req.flush([{
      id: 17, nombre: 'Algeciras', slug: 'algeciras', provincia: 'Cádiz', provincia_slug: 'cadiz', provincia_id: 11,
      region: 'Andalucía', region_id: 1, pais: 'España', pais_id: 1
    }]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Algeciras');
    expect(harness.routeNativeElement!.querySelector('a[href="/municipios/algeciras/cadiz"]')).not.toBeNull();
  });

  it('ignora búsquedas antiguas al cambiar rápidamente el texto', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/municipios', MunicipiosPage);
    harness.detectChanges();
    backend.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === '').flush([]);
    jest.useFakeTimers();
    page.alEscribir('Montilla');
    jest.advanceTimersByTime(300);
    const anterior = backend.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'Montilla');
    page.alEscribir('Utrera');
    jest.advanceTimersByTime(300);
    backend.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'Utrera').flush([{
      id: 30, nombre: 'Utrera', slug: 'utrera', provincia: 'Sevilla', provincia_id: 41,
      region: 'Andalucía', region_id: 1, pais: 'España', pais_id: 1
    }]);
    anterior.flush([{
      id: 3, nombre: 'Montilla', slug: 'montilla', provincia: 'Córdoba', provincia_id: 14,
      region: 'Andalucía', region_id: 1, pais: 'España', pais_id: 1
    }]);
    expect(page.municipios().map(m => m.nombre)).toEqual(['Utrera']);
  });

  it('convierte un enlace numérico existente a nombre y provincia sin perder el municipio', async () => {
    const harness=await RouterTestingHarness.create();
    await harness.navigateByUrl('/municipios/6546',MunicipiosPage);harness.detectChanges();
    const lugar={id:6546,nombre:'Ababuj',slug:'ababuj',provincia:'Teruel',provincia_slug:'teruel'};
    backend.expectOne('/api/v1/territorio/municipios/6546').flush(lugar);
    await harness.fixture.whenStable();harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/municipios/ababuj/teruel');
    backend.expectOne('/api/v1/territorio/municipios/por-nombre/teruel/ababuj').flush(lugar);
    backend.expectOne('/api/v1/territorio/municipios/6546/eventos').flush([]);
    backend.expectOne(r=>r.url==='/api/v1/territorio/artistas').flush([]);
    harness.detectChanges();
    backend.match(r=>r.url.includes('/promociones')||r.url.includes('/promocion/')).forEach(r=>r.flush(r.request.url.includes('/promocion/municipios/')?{municipioId:6546,nombre:'Ababuj',espacios:[]}:[]));
    expect(harness.routeNativeElement!.textContent).toContain('Flamenco en Ababuj');
  });
});
