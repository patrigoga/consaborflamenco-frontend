import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ContactoPage } from './contacto.page';

describe('Formulario público de Contacto', () => {
  let backend:HttpTestingController;
  beforeEach(()=>{
    TestBed.configureTestingModule({imports:[ContactoPage],
      providers:[provideHttpClient(),provideHttpClientTesting()]});
    backend=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>backend.verify());

  it('rechaza enviar sin aceptar privacidad',()=>{
    const fixture=TestBed.createComponent(ContactoPage);
    fixture.detectChanges();
    fixture.componentInstance.enviar();
    backend.expectNone('/api/v1/contacto/csrf');
    backend.expectNone('/api/v1/contacto');
  });

  it('obtiene CSRF, guarda mensaje y muestra confirmación con referencia',()=>{
    const fixture=TestBed.createComponent(ContactoPage);
    const p=fixture.componentInstance;
    fixture.detectChanges();
    p.aceptaPrivacidad=true;
    p.datos={nombre:'Artista de prueba',email:'prueba@ejemplo.es',
      asunto:'Colaboración flamenca',mensaje:'Quiero presentar un recital en vuestro portal.',web:''};
    p.enviar();
    backend.expectOne('/api/v1/contacto/csrf').flush(null);
    const req=backend.expectOne('/api/v1/contacto');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('prueba@ejemplo.es');
    req.flush({recibido:true,referencia:245});
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mensaje recibido');
    expect(fixture.nativeElement.textContent).toContain('#245');
  });
});
