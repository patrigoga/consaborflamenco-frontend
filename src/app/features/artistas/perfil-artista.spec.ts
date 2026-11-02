import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, RESPONSE_INIT, TransferState } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy, convertToParamMap, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Observable, firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';
import { SeoTitleStrategy } from '../../seo/seo-title.strategy';
import { FichaArtista, perfilArtistaResolver } from './perfil-artista.resolver';
import { enlaceSeguro, idYoutube, imagenSegura } from './perfil-artista.model';
import { PerfilPreviewPage } from './perfil-preview.page';

const ARTISTA = { id: 9, slug: 'ana-del-sur', nombre: 'Ana del Sur', disciplina: 'Cante', provincia: 'Cádiz', biografia: 'Una trayectoria propia.', fotoUrl: null, destacado: false };

describe('Ficha pública del artista', () => {
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting(), { provide: TitleStrategy, useClass: SeoTitleStrategy }] });
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());

  it('abre el artista solicitado y crea su título y canónica sin inventar contenido multimedia', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/revista/artistas/ana-del-sur');
    await new Promise(resolve => setTimeout(resolve, 0));
    backend.expectOne('/api/v1/artistas/ana-del-sur').flush(ARTISTA);
    await navegacion; harness.detectChanges();
    const el = harness.routeNativeElement!;
    expect(el.querySelector('h1')?.textContent).toBe('Ana del Sur');
    expect(el.textContent).toContain('Una trayectoria propia.');
    expect(el.querySelector('#perfil-discos')).toBeNull();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(TestBed.inject(Title).getTitle()).toBe('Ana del Sur | ConSaborFlamenco');
    expect(document.querySelector('link[rel=canonical]')?.getAttribute('href')).toBe('https://consaborflamenco.com/revista/artistas/ana-del-sur');
  });

  it('un artista no publicado muestra un estado de ausencia sin indexar', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/revista/artistas/no-publicado');
    await new Promise(resolve => setTimeout(resolve, 0));
    backend.expectOne('/api/v1/artistas/no-publicado').flush({}, { status: 404, statusText: 'Not Found' });
    await navegacion; harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Perfil no disponible');
    expect(TestBed.inject(Meta).getTag('name=robots')?.content).toBe('noindex, follow');
    expect(document.querySelector('link[rel=canonical]')).toBeNull();
  });
});

describe('Resolver en el servidor', () => {
  const respuesta: ResponseInit = {};
  beforeEach(() => {
    respuesta.status = 200;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_ID, useValue: 'server' }, { provide: RESPONSE_INIT, useValue: respuesta }] });
  });
  it.each([404, 500])('conserva el 404 o señala indisponibilidad cuando la API devuelve %s', async status => {
    const ruta = { paramMap: convertToParamMap({ slug: 'ana' }) } as ActivatedRouteSnapshot;
    const peticion = TestBed.runInInjectionContext(() => perfilArtistaResolver(ruta, {} as RouterStateSnapshot)) as Observable<FichaArtista>;
    const resultado = firstValueFrom(peticion);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('https://consaborflamenco.com/api/v1/artistas/ana').flush({}, { status, statusText: 'Error' });
    expect((await resultado).artista).toBeNull();
    expect(respuesta.status).toBe(status === 404 ? 404 : 503);
    expect(TestBed.inject(TransferState).isEmpty).toBe(false);
    http.verify();
  });
});

describe('Editor de demostración', () => {
  it('aplica los cambios solo a la vista previa y rechaza enlaces que no son de YouTube', () => {
    const editor = new PerfilPreviewPage();
    editor.borrador.nombre = 'Mi nombre artístico';
    editor.borrador.videos[0].url = 'https://youtube.com.ejemplo.test/watch?v=dQw4w9WgXcQ';
    editor.aplicar();
    expect(editor.error()).toContain('Revisa los enlaces');
    expect(editor.perfil().nombre).toBe('Nombre del artista');
    editor.borrador.videos[0].url = 'https://youtu.be/abcdefghijk';
    editor.aplicar();
    expect(editor.perfil().nombre).toBe('Mi nombre artístico');
    expect(editor.aviso()).toContain('se perderán al recargar');
  });
});

describe('Enlaces externos del perfil', () => {
  it.each(['https://youtu.be/abcdefghijk', 'https://www.youtube.com/watch?v=abcdefghijk&t=20', 'https://youtube.com/shorts/abcdefghijk'])('reconoce %s', url => expect(idYoutube(url)).toBe('abcdefghijk'));
  it.each(['javascript:alert(1)', 'https://youtube.com.ejemplo.test/watch?v=abcdefghijk', 'https://youtu.be/incorrecto', 'https://usuario:clave@youtube.com/watch?v=abcdefghijk', 'http://youtu.be/abcdefghijk'])('rechaza %s', url => expect(idYoutube(url)).toBeNull());
  it('no convierte enlaces libres en recursos ejecutables', () => {
    expect(enlaceSeguro('javascript:alert(1)')).toBeNull();
    expect(imagenSegura('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
    expect(imagenSegura('/images/foto.webp')).toBe('/images/foto.webp');
    expect(enlaceSeguro('https://instagram.com/artista')).toBe('https://instagram.com/artista');
  });
});
