import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PromocionesMunicipiosAdminComponent } from './promociones-municipios-admin.component';

describe('PromocionesMunicipiosAdminComponent', () => {
  let fixture: ComponentFixture<PromocionesMunicipiosAdminComponent>;
  let component: PromocionesMunicipiosAdminComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PromocionesMunicipiosAdminComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PromocionesMunicipiosAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === '')
      .flush([{id: 1, nombre: 'Montilla', provincia: 'Córdoba'}, {id: 2, nombre: 'Algeciras', provincia: 'Cádiz'}]);
  });

  afterEach(() => http.verify());

  it('selecciona automáticamente una única coincidencia y carga sus promociones', () => {
    component.consulta = 'algeciras';
    component.cargarMunicipios();
    http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'algeciras')
      .flush([{id: 2, nombre: 'Algeciras', provincia: 'Cádiz'}]);
    expect(component.municipioId()).toBe(2);
    http.expectOne('/api/v1/admin/territorio/municipios/2/promociones').flush([]);
    fixture.detectChanges();
    const selector = fixture.nativeElement.querySelector('#elegir-municipio') as HTMLSelectElement;
    expect(selector.value).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('Espacio 1 de 3');
  });

  it('requiere selección manual cuando hay varias coincidencias', () => {
    component.consulta = 'san';
    component.cargarMunicipios();
    http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'san')
      .flush([{id: 3, nombre: 'San Fernando', provincia: 'Cádiz'},
        {id: 4, nombre: 'San Roque', provincia: 'Cádiz'}]);
    expect(component.municipioId()).toBe(0);
    http.expectNone(r => r.url.includes('/promociones'));
    component.elegirMunicipio(4);
    http.expectOne('/api/v1/admin/territorio/municipios/4/promociones').flush([]);
    expect(component.municipioId()).toBe(4);
  });

  it('limpia la selección cuando no hay resultados', () => {
    component.consulta = 'algeciras';
    component.cargarMunicipios();
    http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'algeciras')
      .flush([{id: 2, nombre: 'Algeciras', provincia: 'Cádiz'}]);
    http.expectOne('/api/v1/admin/territorio/municipios/2/promociones').flush([]);
    component.consulta = 'no-existe';
    component.cargarMunicipios();
    http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'no-existe').flush([]);
    expect(component.municipioId()).toBe(0);
    expect(component.filas()).toEqual([]);
  });

  it('ignora respuestas de búsquedas anteriores para evitar selecciones equivocadas', () => {
    component.consulta = 'Algeciras';
    component.cargarMunicipios();
    const primera = http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'Algeciras');
    component.consulta = 'Utrera';
    component.cargarMunicipios();
    http.expectOne(r => r.url === '/api/v1/territorio/municipios' && r.params.get('q') === 'Utrera')
      .flush([{id: 5, nombre: 'Utrera', provincia: 'Sevilla'}]);
    http.expectOne('/api/v1/admin/territorio/municipios/5/promociones').flush([]);
    primera.flush([{id: 2, nombre: 'Algeciras', provincia: 'Cádiz'}]);
    expect(component.municipioId()).toBe(5);
  });
});
