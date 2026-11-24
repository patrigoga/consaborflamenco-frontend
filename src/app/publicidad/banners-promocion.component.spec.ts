import { ubicacionPromocion } from '../layout/layout-publico.component';

describe('Ubicaciones de los banners públicos', () => {
  it.each([
    ['/', 'INICIO'],
    ['/revista/artistas', 'ARTISTAS'],
    ['/revista/artistas/bailaora-ejemplo', 'ARTISTAS'],
    ['/eventos', 'EVENTOS'],
    ['/eventos/recital', 'EVENTOS'],
    ['/revista/academias', 'ACADEMIAS'],
    ['/revista/tablaos', 'TABLAOS'],
    ['/municipios', 'MUNICIPIOS'],
    ['/municipios/23', 'MUNICIPIO:23'],
    ['/municipios/23?src=portada', 'MUNICIPIO:23'],
    ['/acceso', ''],
    ['/registro', ''],
    ['/mi-cuenta/perfil', ''],
    ['/promocion', ''],
  ])('en %s corresponde %s', (ruta, codigo) => {
    expect(ubicacionPromocion(ruta)).toBe(codigo);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BannersPromocionComponent } from './banners-promocion.component';

describe('Visualización pública de banners',()=>{
  it('muestra dos anuncios identificados y descarta la respuesta de una ubicación anterior',()=>{
    TestBed.configureTestingModule({imports:[BannersPromocionComponent],providers:[provideHttpClient(),provideHttpClientTesting()]});
    const f=TestBed.createComponent(BannersPromocionComponent),h=TestBed.inject(HttpTestingController);
    f.componentRef.setInput('ubicacion','INICIO');f.detectChanges();
    const anterior=h.expectOne(q=>q.params.get('ubicacion')==='INICIO');
    f.componentRef.setInput('ubicacion','EVENTOS');f.detectChanges();
    const anuncio={ubicacion:'EVENTOS',titulo:'Anuncio actual',anunciante:'Marca',imagenUrl:'/foto.jpg',destinoUrl:'https://example.com'};
    h.expectOne(q=>q.params.get('ubicacion')==='EVENTOS').flush([1,2,3].map(posicion=>({...anuncio,posicion})));
    anterior.flush([{...anuncio,posicion:1,titulo:'Anuncio anterior'}]);f.detectChanges();
    expect(f.nativeElement.querySelectorAll('article')).toHaveLength(2);
    expect(f.nativeElement.textContent).toContain('Publicidad');expect(f.nativeElement.textContent).not.toContain('Anuncio anterior');
    const enlace=f.nativeElement.querySelector('a');expect(enlace.rel).toBe('sponsored noopener noreferrer');expect(enlace.target).toBe('_blank');
    f.componentRef.setInput('ubicacion','MODA');f.detectChanges();
    h.expectOne(q=>q.params.get('ubicacion')==='MODA').flush({}, {status:503,statusText:'No disponible'});f.detectChanges();
    expect(f.nativeElement.querySelector('section')).toBeNull();h.verify();
  });
});
