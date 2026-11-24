import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PromocionAdminComponent } from './promocion-admin.component';

const tarifa={codigo:'INICIO',descripcion:'Inicio',precioMensualCentimos:20000,descuentoPorcentaje:10,precioFinalCentimos:18000,activo:true};
const banner={ubicacion:'INICIO',posicion:1,titulo:'Campaña',anunciante:'Anunciante',imagenUrl:'/imagen.jpg',destinoUrl:'https://example.com',descuentoPorcentaje:null,activo:true,visibleDesde:null,visibleHasta:null,precioBaseCentimos:20000,descuentoAplicado:10,precioFinalCentimos:18000};

describe('Gestión de banners',()=>{
  let c:PromocionAdminComponent,http:HttpTestingController;
  beforeEach(()=>{
    TestBed.configureTestingModule({imports:[PromocionAdminComponent],providers:[provideHttpClient(),provideHttpClientTesting()]});
    const f=TestBed.createComponent(PromocionAdminComponent);c=f.componentInstance;http=TestBed.inject(HttpTestingController);
    f.detectChanges();http.expectOne('/api/v1/promocion/tarifas').flush([tarifa]);
  });
  afterEach(()=>http.verify());
  const cargar=(http:HttpTestingController,rows:unknown[]=[])=>http.expectOne(q=>q.url==='/api/v1/admin/promocion/banners').flush(rows);
  it('impide guardar mientras se carga o después de fallar, y permite reintentar',()=>{
    c.guardarBanner();http.expectNone(q=>q.method==='PUT');
    http.expectOne(q=>q.url==='/api/v1/admin/promocion/banners').flush({}, {status:500,statusText:'Error'});
    c.guardarBanner();http.expectNone(q=>q.method==='PUT');
    expect(c.cargaCorrecta()).toBe(false);c.cargarBanners();cargar(http,[banner]);expect(c.datos.titulo).toBe('Campaña');
  });
  it('mantiene el descuento heredado y admite un descuento específico de cero',()=>{
    cargar(http,[banner]);expect(c.precioFinal()).toBe('180.00');c.datos.descuentoPorcentaje=0;expect(c.precioFinal()).toBe('200.00');
    c.datos.descuentoPorcentaje=null;c.guardarBanner();
    const req=http.expectOne(q=>q.method==='PUT');expect(req.request.params.get('ubicacion')).toBe('INICIO');
    expect(req.request.body.descuentoPorcentaje).toBeNull();expect(req.request.body.visibleDesde).toBeNull();req.flush(banner);
  });
  it('rechaza fechas invertidas y descuentos fuera de rango sin enviar la campaña',()=>{
    cargar(http,[banner]);c.datos.visibleDesde='2026-12-10T10:00';c.datos.visibleHasta='2026-12-09T10:00';c.guardarBanner();
    http.expectNone(q=>q.method==='PUT');expect(c.ocupado()).toBe(false);expect(c.error()).toContain('fechas');
    c.datos.visibleHasta='';c.datos.descuentoPorcentaje=81;c.guardarBanner();http.expectNone(q=>q.method==='PUT');
  });
  it('no incorpora una campaña guardada a otra ubicación al llegar tarde la respuesta',()=>{
    cargar(http,[banner]);c.guardarBanner();const guardar=http.expectOne(q=>q.method==='PUT');
    c.codigo='EVENTOS';c.cambiarUbicacion();cargar(http);guardar.flush(banner);
    expect(c.banners()).toEqual([]);expect(c.datos.titulo).toBe('');expect(c.aviso()).toBe('');
  });
  it('desactiva la posición solicitada aunque el editor cambie de posición',()=>{
    cargar(http,[banner,{...banner,posicion:2}]);c.desactivarBanner();const borrar=http.expectOne(q=>q.method==='DELETE');
    c.posicion=2;c.cargarEdicion();borrar.flush(null);
    expect(c.banners().find(b=>b.posicion===1)?.activo).toBe(false);expect(c.datos.activo).toBe(true);
  });
  it('usa céntimos enteros y el mismo truncamiento que la API',()=>{
    cargar(http);expect(c.redondearCentimos('19.99')).toBe(1999);expect(c.importeConDescuento(1999,10)).toBe('17.99');
    expect(c.importeConDescuento(100000000,80)).toBe('200000.00');
    c.guardarTarifa({...tarifa,precioMensualCentimos:100000001});http.expectNone(q=>q.method==='PUT');
  });
});
