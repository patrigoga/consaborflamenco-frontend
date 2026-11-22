import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MenuItem } from '../menu-publico.service';
import { RouterTestingHarness } from '@angular/router/testing';
import { CabeceraComponent } from './cabecera.component';

@Component({ standalone: true, template: '<p>página</p>' })
class Vacia {}

describe('CabeceraComponent', () => {
  const items: MenuItem[] = [
    {clave:'inicio',padre:null,texto:'Inicio',ruta:'/',posicion:1,fijo:true,activo:true},
    {clave:'flamenco',padre:null,texto:'Flamenco',ruta:null,posicion:2,fijo:false,activo:false},
    {clave:'historia',padre:'flamenco',texto:'Historia',ruta:'/flamenco/historia',posicion:1,fijo:false,activo:false},
    {clave:'revista',padre:null,texto:'Revista',ruta:null,posicion:3,fijo:false,activo:true},
    {clave:'artistas',padre:'revista',texto:'Artistas',ruta:'/revista/artistas',posicion:1,fijo:false,activo:true},
    {clave:'academias',padre:'revista',texto:'Academias',ruta:'/revista/academias',posicion:2,fijo:false,activo:true},
    {clave:'eventos',padre:null,texto:'Eventos',ruta:'/eventos',posicion:4,fijo:false,activo:true},
    {clave:'contacto',padre:null,texto:'Contacto',ruta:'/contacto',posicion:7,fijo:false,activo:false}
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Vacia }]), provideHttpClient(), provideHttpClientTesting()]
    });
  });

  async function montar(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(CabeceraComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/menu-publico').flush(items);
    fixture.detectChanges();
    return { harness, fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra únicamente enlaces activos y siempre los fijos', async () => {
    const { el } = await montar('/');
    const hrefs = [...el.querySelectorAll('a')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/revista/artistas', '/revista/academias',
      '/eventos', '/acceso', '/registro']));
    expect(hrefs).not.toContain('/flamenco/historia');
    expect(hrefs).not.toContain('/contacto');
    expect(hrefs).not.toContain('/revista/fotografia');
    expect(hrefs.some(h => h?.startsWith('#'))).toBe(false);
  });

  it('marca como activa la página actual y su grupo', async () => {
    const { el } = await montar('/revista/artistas');
    const activo = el.querySelector('.cab__subenlace.is-activo');
    expect(activo?.textContent?.trim()).toBe('Artistas');
    expect(activo?.getAttribute('aria-current')).toBe('page');
    const grupo = [...el.querySelectorAll('.cab__desplegar')].find(b => b.textContent?.includes('Revista'));
    expect(grupo?.classList.contains('is-activo')).toBe(true);
    const inicio = [...el.querySelectorAll('.cab__enlace')].find(a => a.textContent?.trim() === 'Inicio');
    expect(inicio?.classList.contains('is-activo')).toBe(false);
  });

  it('abre y cierra los submenús con el botón y con Escape, y anuncia el estado', async () => {
    const { fixture, el } = await montar('/');
    const boton = [...el.querySelectorAll<HTMLButtonElement>('.cab__desplegar')].find(b => b.textContent?.includes('Revista'))!;
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
    await harness.navigateByUrl('/eventos'); fixture.detectChanges();
    expect(hamburguesa.getAttribute('aria-expanded')).toBe('false');
  });
});
