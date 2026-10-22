import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CabeceraComponent } from './cabecera.component';

@Component({ standalone: true, template: '<p>página</p>' })
class Vacia {}

describe('CabeceraComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Vacia }])]
    });
  });

  async function montar(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(CabeceraComponent);
    fixture.detectChanges();
    return { harness, fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('usa routerLink para toda la navegación interna, sin anclas #', async () => {
    const { el } = await montar('/');
    const hrefs = [...el.querySelectorAll('a')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/flamenco/historia', '/flamenco/palos', '/flamenco/llaves-de-oro',
      '/revista/artistas', '/revista/academias', '/revista/fotografia', '/revista/moda', '/revista/penas', '/revista/tablaos',
      '/revista/festivales', '/eventos', '/servicios', '/contacto', '/membresias']));
    expect(hrefs.some(h => h?.startsWith('#'))).toBe(false);
  });

  it('marca como activa la página actual y su grupo', async () => {
    const { el } = await montar('/revista/penas');
    const activo = el.querySelector('.cab__subenlace.is-activo');
    expect(activo?.textContent?.trim()).toBe('Peñas');
    expect(activo?.getAttribute('aria-current')).toBe('page');
    const grupo = [...el.querySelectorAll('.cab__desplegar')].find(b => b.textContent?.includes('Revista'));
    expect(grupo?.classList.contains('is-activo')).toBe(true);
    const inicio = [...el.querySelectorAll('.cab__enlace')].find(a => a.textContent?.trim() === 'Inicio');
    expect(inicio?.classList.contains('is-activo')).toBe(false);
  });

  it('abre y cierra los submenús con el botón y con Escape, y anuncia el estado', async () => {
    const { fixture, el } = await montar('/');
    const boton = [...el.querySelectorAll<HTMLButtonElement>('.cab__desplegar')].find(b => b.textContent?.includes('Flamenco'))!;
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    boton.click(); fixture.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('false');
  });

  it('el menú móvil se cierra al navegar', async () => {
    const { harness, fixture, el } = await montar('/');
    const hamburguesa = el.querySelector<HTMLButtonElement>('.cab__boton-menu')!;
    hamburguesa.click(); fixture.detectChanges();
    expect(hamburguesa.getAttribute('aria-expanded')).toBe('true');
    await harness.navigateByUrl('/contacto'); fixture.detectChanges();
    expect(hamburguesa.getAttribute('aria-expanded')).toBe('false');
  });
});
