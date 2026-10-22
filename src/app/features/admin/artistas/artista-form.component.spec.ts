import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ArtistaFormComponent, slugDesde } from './artista-form.component';
import { ArtistaAdmin, Catalogos } from '../core/modelos';

const CATALOGOS: Catalogos = {
  disciplinas: ['Cante', 'Baile', 'Guitarra', 'Percusión', 'Otros instrumentos', 'Otros'],
  provincias: ['Cádiz', 'Sevilla', 'Internacional'], maxDestacados: 6, fotoMaxBytes: 5242880, fotoTipos: []
};
const ARTISTA: ArtistaAdmin = {
  id: 7, nombre: 'Ana', slug: 'ana', disciplina: 'Baile', provincia: 'Sevilla', biografia: null, fotoUrl: null,
  publicado: false, destacado: false, archivado: false, archivadoEn: null, creadoEn: null, actualizadoEn: null
};

describe('ArtistaFormComponent', () => {
  let fixture: ComponentFixture<ArtistaFormComponent>;
  let componente: ArtistaFormComponent;
  let backend: HttpTestingController;

  function crear(id?: string) {
    fixture = TestBed.createComponent(ArtistaFormComponent);
    componente = fixture.componentInstance;
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    backend.expectOne('/api/v1/admin/catalogos').flush(CATALOGOS);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ArtistaFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('genera direcciones sin acentos', () => {
    expect(slugDesde('Niño de Elche')).toBe('nino-de-elche');
    expect(slugDesde('  La Paquera!! ')).toBe('la-paquera');
  });

  it('no envía nada si faltan campos obligatorios y marca los errores', () => {
    crear();
    componente.guardar();
    fixture.detectChanges();
    backend.expectNone('/api/v1/admin/artistas');
    expect(componente.error('nombre')).toBe('Indica el nombre artístico.');
    expect(componente.error('disciplina')).toBe('Elige una disciplina.');
    expect(fixture.nativeElement.querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThanOrEqual(3);
  });

  it('valida el formato de la dirección', () => {
    crear();
    componente.form.patchValue({ nombre: 'Ana', slug: 'Ana López', disciplina: 'Baile', provincia: 'Sevilla' });
    componente.guardar();
    backend.expectNone('/api/v1/admin/artistas');
    expect(componente.error('slug')).toContain('minúsculas');
  });

  it('crea el borrador y abre su ficha', () => {
    crear();
    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    componente.form.patchValue({ nombre: '  Ana  ', slug: '', disciplina: 'Baile', provincia: 'Sevilla', biografia: ' Bio ' });
    componente.form.markAsDirty();
    componente.guardar();
    const req = backend.expectOne('/api/v1/admin/artistas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Ana', slug: null, disciplina: 'Baile', provincia: 'Sevilla', biografia: 'Bio', fotoUrl: null });
    req.flush(ARTISTA);
    expect(navegar).toHaveBeenCalledWith(['/admin/artistas', 7], { replaceUrl: true });
    expect(componente.hayCambiosSinGuardar()).toBe(false);
  });

  it('muestra en cada campo los errores que devuelve Spring', () => {
    crear();
    componente.form.patchValue({ nombre: 'Ana', disciplina: 'Baile', provincia: 'Sevilla' });
    componente.guardar();
    backend.expectOne('/api/v1/admin/artistas').flush(
      { codigo: 'VALIDACION', errores: { slug: 'Ya existe otro artista con esa dirección.' } },
      { status: 400, statusText: 'Bad Request' });
    expect(componente.error('slug')).toBe('Ya existe otro artista con esa dirección.');
    expect(componente.errorGeneral()).toBe('Revisa los campos marcados.');
  });

  it('edita un artista existente con PUT y avisa de cambios pendientes', () => {
    crear('7');
    backend.expectOne('/api/v1/admin/artistas/7').flush(ARTISTA);
    expect(componente.hayCambiosSinGuardar()).toBe(false);
    componente.form.controls.nombre.setValue('Ana María');
    componente.form.markAsDirty();
    expect(componente.hayCambiosSinGuardar()).toBe(true);
    componente.guardar();
    const req = backend.expectOne('/api/v1/admin/artistas/7');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...ARTISTA, nombre: 'Ana María' });
    expect(componente.hayCambiosSinGuardar()).toBe(false);
  });

  it('un artista archivado se muestra en solo lectura', () => {
    crear('7');
    backend.expectOne('/api/v1/admin/artistas/7').flush({ ...ARTISTA, archivado: true });
    fixture.detectChanges();
    expect(componente.form.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Restaurar como borrador');
  });

  it('detecta valores antiguos que ya no están en el catálogo', () => {
    crear('7');
    backend.expectOne('/api/v1/admin/artistas/7').flush({ ...ARTISTA, disciplina: 'Flamenco fusión' });
    expect(componente.valorFueraDeCatalogo('disciplina')).toBe(true);
    componente.form.markAsDirty();
    componente.guardar();
    backend.expectNone('/api/v1/admin/artistas/7');
    expect(componente.error('disciplina')).toContain('lista actual');
  });
});
