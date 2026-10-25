import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ConsagradoFormComponent } from './consagrado-form.component';

const FICHA = { id: 7, titulo: 'Artista documental', descripcion: 'Primer párrafo.\n\nSegundo párrafo.',
  fotoUrl: '/media/artistas/ejemplo.png', fuente: null, creadoEn: null, actualizadoEn: null };

describe('Ficha de artista consagrado', () => {
  let fixture: ComponentFixture<ConsagradoFormComponent>;
  let componente: ConsagradoFormComponent;
  let backend: HttpTestingController;
  const elegir = (archivo: File) => componente.alElegir({ target: { files: [archivo], value: '' } } as unknown as Event);

  function crear(id?: string) {
    fixture = TestBed.createComponent(ConsagradoFormComponent);
    componente = fixture.componentInstance;
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConsagradoFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    backend = TestBed.inject(HttpTestingController);
    URL.createObjectURL = jest.fn(() => 'blob:imagen-de-prueba');
    URL.revokeObjectURL = jest.fn();
  });
  afterEach(() => { backend.verify(); fixture?.destroy(); });

  it('exige título, descripción e imagen antes de enviar el alta', () => {
    crear(); componente.form.patchValue({ titulo: '  ', descripcion: '  ' });
    componente.guardar(); fixture.detectChanges();
    backend.expectNone('/api/v1/admin/consagrados');
    expect(componente.error('titulo')).toContain('título');
    expect(componente.error('descripcion')).toContain('descripción');
    expect(componente.errorImagen()).toContain('imagen');
    expect(fixture.nativeElement.querySelectorAll('[aria-invalid="true"]').length).toBe(3);
  });

  it('guarda texto con párrafos e imagen juntos y limpia los cambios pendientes', async () => {
    crear(); jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    componente.form.patchValue({ titulo: '  Artista documental  ', descripcion: FICHA.descripcion, fuente: '' });
    const archivo = new File(['png'], 'retrato.png', { type: 'image/png' }); elegir(archivo);
    expect(componente.hayCambiosSinGuardar()).toBe(true);
    componente.guardar();
    const req = backend.expectOne('/api/v1/admin/consagrados');
    expect(req.request.method).toBe('POST');
    const cuerpo = req.request.body as FormData;
    expect(cuerpo.get('imagen')).toEqual(archivo);
    const datos = cuerpo.get('datos') as Blob;
    expect(datos.type).toBe('application/json');
    const texto = await new Promise<string>(resolve => { const lector = new FileReader();
      lector.onload = () => resolve(lector.result as string); lector.readAsText(datos); });
    expect(JSON.parse(texto)).toEqual({ titulo: 'Artista documental', descripcion: FICHA.descripcion, fuente: null });
    req.flush(FICHA);
    expect(componente.hayCambiosSinGuardar()).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:imagen-de-prueba');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/admin/consagrados', 7], { replaceUrl: true });
  });

  it('editar el texto conserva la foto al omitir la imagen en el PUT', () => {
    crear('7'); backend.expectOne('/api/v1/admin/consagrados/7').flush(FICHA);
    componente.form.controls.titulo.setValue('Título revisado'); componente.form.markAsDirty();
    componente.guardar(); const req = backend.expectOne('/api/v1/admin/consagrados/7');
    expect(req.request.method).toBe('PUT');
    expect((req.request.body as FormData).has('imagen')).toBe(false);
    req.flush({ ...FICHA, titulo: 'Título revisado' });
    expect(componente.ficha()?.fotoUrl).toBe(FICHA.fotoUrl);
    expect(componente.hayCambiosSinGuardar()).toBe(false);
  });

  it('rechaza archivos de formato o tamaño no admitidos', () => {
    crear(); elegir(new File(['<svg/>'], 'foto.svg', { type: 'image/svg+xml' }));
    expect(componente.errorImagen()).toContain('JPEG');
    elegir(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }));
    expect(componente.errorImagen()).toContain('5 MB');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('conserva el formulario y señala el error de imagen devuelto por el servidor', () => {
    crear(); componente.form.patchValue({ titulo: FICHA.titulo, descripcion: FICHA.descripcion });
    elegir(new File(['falsa'], 'retrato.png', { type: 'image/png' })); componente.guardar();
    backend.expectOne('/api/v1/admin/consagrados').flush({ codigo: 'VALIDACION', errores: { archivo: 'La imagen no es válida.' } },
      { status: 400, statusText: 'Bad Request' });
    expect(componente.errorImagen()).toBe('La imagen no es válida.');
    expect(componente.form.controls.descripcion.value).toBe(FICHA.descripcion);
    expect(componente.hayCambiosSinGuardar()).toBe(true);
  });
});
