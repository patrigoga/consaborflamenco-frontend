import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PromocionesMunicipioComponent } from './promociones-municipio.component';

describe('Banners municipales durante la navegación',()=>{
  it('ignora respuestas antiguas y conserva los espacios legacy sin duplicar los nuevos',()=>{
    TestBed.configureTestingModule({imports:[PromocionesMunicipioComponent],providers:[provideHttpClient(),provideHttpClientTesting()]});
    const f=TestBed.createComponent(PromocionesMunicipioComponent),c=f.componentInstance,h=TestBed.inject(HttpTestingController);
    f.componentRef.setInput('municipioId',1);f.detectChanges();
    const antiguo=h.expectOne('/api/v1/territorio/municipios/1/promociones');
    const anunciosAntiguos=h.expectOne('/api/v1/promocion/banners?ubicacion=MUNICIPIO:1');
    f.componentRef.setInput('municipioId',2);f.detectChanges();
    h.expectOne('/api/v1/promocion/banners?ubicacion=MUNICIPIO:2').flush([{posicion:1}]);
    h.expectOne('/api/v1/territorio/municipios/2/promociones').flush([
      {tipo:'BANNER',posicion:1,titulo:'Duplicado'}, {tipo:'BANNER',posicion:3,titulo:'Contrato histórico'},
      {tipo:'HERO',posicion:1,titulo:'Cabecera actual'}]);
    antiguo.flush([{tipo:'HERO',posicion:1,titulo:'Municipio anterior'}]);anunciosAntiguos.flush([]);
    expect(c.actual()?.titulo).toBe('Cabecera actual');expect(c.banners().map(b=>b.titulo)).toEqual(['Contrato histórico']);
    f.destroy();h.verify();
  });
});
