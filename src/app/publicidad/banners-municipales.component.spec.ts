import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BannersMunicipalesComponent } from './banners-municipales.component';

describe('Dos espacios por municipio',()=>{
 it('ofrece contratar cada espacio libre y conserva municipio y posición en el enlace',()=>{
   TestBed.configureTestingModule({imports:[BannersMunicipalesComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]});
   const f=TestBed.createComponent(BannersMunicipalesComponent),h=TestBed.inject(HttpTestingController);
   f.componentRef.setInput('municipioId',6546);f.detectChanges();
   h.expectOne('/api/v1/promocion/municipios/6546').flush({municipioId:6546,nombre:'Ababuj',imagenUrl:'/estandar.jpg',contratacionHabilitada:true,espacios:[1,2].map(posicion=>({posicion,disponible:true,banner:null}))});
   f.detectChanges();
   expect(f.nativeElement.querySelectorAll('article')).toHaveLength(2);
   const links=[...f.nativeElement.querySelectorAll('a')].map((a:any)=>a.getAttribute('href'));
   expect(links).toEqual(['/promocion?municipio=6546&posicion=1','/promocion?municipio=6546&posicion=2']);
   expect(f.nativeElement.querySelectorAll('img[src="/estandar.jpg"]')).toHaveLength(2);h.verify();
 });
 it('muestra la campaña vigente y no permite solicitar un espacio reservado para otra fecha',()=>{
   TestBed.configureTestingModule({imports:[BannersMunicipalesComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]});
   const f=TestBed.createComponent(BannersMunicipalesComponent),h=TestBed.inject(HttpTestingController);
   f.componentRef.setInput('municipioId',1);f.detectChanges();
   const antigua=h.expectOne('/api/v1/promocion/municipios/1');
   f.componentRef.setInput('municipioId',2);f.detectChanges();
   h.expectOne('/api/v1/promocion/municipios/2').flush({municipioId:2,nombre:'Córdoba',imagenUrl:'/estandar.jpg',contratacionHabilitada:true,espacios:[
     {posicion:1,disponible:false,banner:{titulo:'Escuela',anunciante:'Marca',imagenUrl:'/campana.jpg',destinoUrl:'https://example.org'}},
     {posicion:2,disponible:false,banner:null}
   ]});
   antigua.flush({nombre:'Antiguo',espacios:[]});f.detectChanges();
   expect(f.nativeElement.textContent).toContain('Espacio reservado');expect(f.nativeElement.textContent).not.toContain('Antiguo');
   expect(f.nativeElement.querySelectorAll('a')).toHaveLength(1);expect(f.nativeElement.querySelector('a').rel).toContain('sponsored');h.verify();
 });
});
