import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

// @angular/ssr solo funciona en Node (servidor); aquí basta con su enumeración.
jest.mock('@angular/ssr', () => ({ RenderMode: { Server: 0, Client: 1, Prerender: 2 } }));
import { serverRoutes } from './app.routes.server';
import { NAVEGACION, RUTAS_PRERENDER, SECCIONES, esGrupo } from './navegacion';
import { SeoTitleStrategy } from './seo/seo-title.strategy';

describe('Rutas públicas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(), provideHttpClientTesting(),
        { provide: TitleStrategy, useClass: SeoTitleStrategy }
      ]
    });
  });

  it.each(Object.values(SECCIONES).map(s => [s.ruta, s]))('%s tiene su página, título, descripción, canónica y un único H1', async (ruta, s) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(ruta);
    const doc = TestBed.inject(DOCUMENT);
    expect(TestBed.inject(Router).url).toBe(ruta);
    expect(TestBed.inject(Title).getTitle()).toBe(`${s.titulo} | ConSaborFlamenco`);
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBe(s.descripcion);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://consaborflamenco.com' + s.ruta);
    const h1 = harness.routeNativeElement!.querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0].textContent?.trim()).toBe(s.h1);
  });

  it('las direcciones inexistentes muestran la página 404 sin indexar', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/revista/no-existe');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain('Página no encontrada');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(TestBed.inject(DOCUMENT).querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('/flamenco y /revista llevan a su primera sección', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/flamenco');
    expect(TestBed.inject(Router).url).toBe('/flamenco/historia');
    await harness.navigateByUrl('/revista');
    expect(TestBed.inject(Router).url).toBe('/revista/artistas');
  });

  it('/admin sigue fuera del marco público y antes del comodín 404', () => {
    expect(routes[0].path).toBe('admin');
    const publico = routes[1].children!;
    expect(publico[publico.length - 1].path).toBe('**');
  });

  it('todas las entradas del menú apuntan a una sección existente', () => {
    const rutas = new Set(['/', ...Object.values(SECCIONES).map(s => s.ruta)]);
    for (const e of NAVEGACION) {
      if (esGrupo(e)) e.hijos.forEach(h => expect(rutas.has(h.ruta)).toBe(true));
      else expect(rutas.has(e.ruta)).toBe(true);
    }
  });
});

describe('Rutas de servidor (SSR)', () => {
  it('prerenderiza todas las páginas públicas, deja /admin en el navegador y responde 404 al resto', () => {
    const modo = (p: string) => serverRoutes.find(r => r.path === p);
    expect(RUTAS_PRERENDER).toHaveLength(Object.keys(SECCIONES).length + 1);
    RUTAS_PRERENDER.forEach(p => expect(String(modo(p)?.renderMode)).toBe(String(modo('')?.renderMode)));
    expect(modo('admin/**')).toBeDefined();
    expect(modo('admin/**')!.renderMode).not.toBe(modo('')!.renderMode);
    const comodin = serverRoutes[serverRoutes.length - 1] as { path: string; status?: number };
    expect(comodin.path).toBe('**');
    expect(comodin.status).toBe(404);
  });
});
