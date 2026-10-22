import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ArtistasListaComponent } from './artistas-lista.component';
import { ArtistaAdmin } from '../core/modelos';

const base: ArtistaAdmin = {
  id: 1, nombre: 'Ana', slug: 'ana', disciplina: 'Baile', provincia: 'Sevilla', biografia: null, fotoUrl: null,
  publicado: false, destacado: false, archivado: false, archivadoEn: null, creadoEn: null, actualizadoEn: null
};
const pagina = (content: ArtistaAdmin[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 });

describe('ArtistasListaComponent', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ArtistasListaComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    backend = TestBed.inject(HttpTestingController);
  });

  function iniciar(content: ArtistaAdmin[], destacados = 0) {
    const fixture = TestBed.createComponent(ArtistasListaComponent);
    fixture.detectChanges();
    backend.expectOne(r => r.url === '/api/v1/admin/catalogos').flush({ disciplinas: [], provincias: [], maxDestacados: 6, fotoMaxBytes: 1, fotoTipos: [] });
    backend.expectOne(r => r.url === '/api/v1/admin/artistas').flush(pagina(content));
    backend.expectOne('/api/v1/admin/artistas/resumen').flush({ activos: 1, publicados: 1, borradores: 0, destacados, archivados: 0, maxDestacados: 6 });
    fixture.detectChanges();
    return fixture;
  }

  it('lista los artistas con su estado y filtra por pestaña', () => {
    const fixture = iniciar([base]);
    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('Borrador');
    const pestana = [...fixture.nativeElement.querySelectorAll('[role=tab]')].find((b: HTMLElement) => b.textContent?.includes('Archivados')) as HTMLButtonElement;
    pestana.click();
    const req = backend.expectOne(r => r.url === '/api/v1/admin/artistas');
    expect(req.request.params.get('estado')).toBe('ARCHIVADOS');
    expect(req.request.params.get('page')).toBe('0');
    req.flush(pagina([]));
  });

  it('busca con espera para no lanzar una petición por tecla', fakeAsync(() => {
    const fixture = iniciar([base]);
    const input = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;
    for (const t of ['A', 'An', 'Ana']) { input.value = t; input.dispatchEvent(new Event('input')); tick(100); }
    backend.expectNone(r => r.url === '/api/v1/admin/artistas');
    tick(300);
    const req = backend.expectOne(r => r.url === '/api/v1/admin/artistas');
    expect(req.request.params.get('q')).toBe('Ana');
    req.flush(pagina([base]));
  }));

  it('publicar llama a la API y recarga el listado', () => {
    const fixture = iniciar([base]);
    const boton = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) => b.textContent?.trim() === 'Publicar') as HTMLButtonElement;
    boton.click();
    const req = backend.expectOne('/api/v1/admin/artistas/1/publicar');
    expect(req.request.method).toBe('POST');
    req.flush({ ...base, publicado: true });
    backend.expectOne(r => r.url === '/api/v1/admin/artistas').flush(pagina([{ ...base, publicado: true }]));
    backend.expectOne('/api/v1/admin/artistas/resumen').flush({ activos: 1, publicados: 1, borradores: 0, destacados: 0, archivados: 0, maxDestacados: 6 });
  });

  it('desactiva la estrella cuando el cartel está completo', () => {
    const fixture = iniciar([{ ...base, publicado: true }], 6);
    const estrella = fixture.nativeElement.querySelector('.adm-estrella') as HTMLButtonElement;
    expect(estrella.disabled).toBe(true);
    expect(estrella.title).toContain('Ya hay 6 destacados');
  });
});
