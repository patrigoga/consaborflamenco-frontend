import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ArtistasPage } from './artistas.page';

describe('Página de artistas', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'revista/artistas', component: ArtistasPage }]), provideHttpClient(), provideHttpClientTesting()]
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('traslada los filtros de la URL a la API pública (página en base 1 → 0)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/revista/artistas?provincia=C%C3%A1diz&disciplina=Baile&pagina=2');
    harness.detectChanges();
    const req = backend.expectOne(r => r.url === '/api/v1/artistas');
    expect(req.request.params.get('provincia')).toBe('Cádiz');
    expect(req.request.params.get('disciplina')).toBe('Baile');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('12');
    req.flush({ content: [{ id: 1, nombre: 'Ana', slug: 'ana', disciplina: 'Baile', provincia: 'Cádiz', fotoUrl: null, destacado: false }], totalElements: 13, totalPages: 2 });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Ana');
    expect(harness.routeNativeElement!.textContent).toContain('Página 2 de 2');
  });

  it('ignora valores de filtro que no existen', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/revista/artistas?provincia=Atlantis&pagina=-3');
    harness.detectChanges();
    const req = backend.expectOne(r => r.url === '/api/v1/artistas');
    expect(req.request.params.has('provincia')).toBe(false);
    expect(req.request.params.get('page')).toBe('0');
    req.flush({ content: [], totalElements: 0, totalPages: 0 });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Aún no hay artistas publicados');
  });
});
