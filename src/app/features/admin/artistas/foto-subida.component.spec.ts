import { validarArchivoFoto } from './foto-subida.component';

const archivo = (tipo: string, bytes: number) => new File([new Uint8Array(bytes)], 'f', { type: tipo });

describe('validarArchivoFoto', () => {
  it('acepta JPEG, PNG y WebP de hasta 5 MB', () => {
    expect(validarArchivoFoto(archivo('image/jpeg', 1000))).toBeNull();
    expect(validarArchivoFoto(archivo('image/png', 5 * 1024 * 1024))).toBeNull();
    expect(validarArchivoFoto(archivo('image/webp', 10))).toBeNull();
  });

  it('rechaza otros formatos, archivos vacíos y demasiado grandes', () => {
    expect(validarArchivoFoto(archivo('image/svg+xml', 10))).toContain('Formato');
    expect(validarArchivoFoto(archivo('application/pdf', 10))).toContain('Formato');
    expect(validarArchivoFoto(archivo('image/png', 0))).toContain('vacío');
    expect(validarArchivoFoto(archivo('image/jpeg', 5 * 1024 * 1024 + 1))).toContain('máximo es 5 MB');
  });
});
