import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MenuPublicoAdminComponent } from './menu-publico-admin.component';
import { MenuItem } from '../../../menu-publico.service';

describe('Gestión del menú público', () => {
  let backend: HttpTestingController;
  let componente: MenuPublicoAdminComponent;
  const datos: MenuItem[] = [
    {clave:'inicio',padre:null,texto:'Inicio',ruta:'/',posicion:1,fijo:true,activo:true},
    {clave:'flamenco',padre:null,texto:'Flamenco',ruta:null,posicion:2,fijo:false,activo:false},
    {clave:'historia',padre:'flamenco',texto:'Historia',ruta:'/flamenco/historia',posicion:1,fijo:false,activo:false},
    {clave:'revista',padre:null,texto:'Revista',ruta:null,posicion:3,fijo:false,activo:true},
    {clave:'artistas',padre:'revista',texto:'Artistas',ruta:'/revista/artistas',posicion:1,fijo:false,activo:true},
    {clave:'academias',padre:'revista',texto:'Academias',ruta:'/revista/academias',posicion:2,fijo:false,activo:true},
    {clave:'acceso',padre:null,texto:'Acceso miembros',ruta:'/acceso',posicion:8,fijo:true,activo:true},
    {clave:'registro',padre:null,texto:'Hazte miembro',ruta:'/registro',posicion:9,fijo:true,activo:true}
  ];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[MenuPublicoAdminComponent],
      providers:[provideHttpClient(),provideHttpClientTesting()]
    });
    backend = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MenuPublicoAdminComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    backend.expectOne('/api/v1/admin/menu-publico').flush(datos);
    fixture.detectChanges();
  });
  afterEach(() => backend.verify());

  it('no permite desactivar entradas fijas, ni por cambios programáticos', () => {
    componente.cambiar('inicio',false);
    componente.cambiar('acceso',false);
    componente.cambiar('registro',false);
    expect(componente.estado()['inicio']).toBe(true);
    expect(componente.estado()['acceso']).toBe(true);
    expect(componente.estado()['registro']).toBe(true);
    expect(componente.hayCambios()).toBe(false);
  });

  it('mantiene estado de hijos al ocultar padre y persiste modificaciones', () => {
    componente.cambiar('revista',false);
    componente.cambiar('artistas',false);
    expect(componente.estado()['artistas']).toBe(true);
    componente.guardar();
    const req=backend.expectOne('/api/v1/admin/menu-publico');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({cambios:[{clave:'revista',activo:false}]});
    req.flush(datos.map(d=>d.clave==='revista'?{...d,activo:false}:d));
    expect(componente.estado()['revista']).toBe(false);
    expect(componente.estado()['artistas']).toBe(true);
    expect(componente.hayCambios()).toBe(false);
  });
});
