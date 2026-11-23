import { esErrorDeChunk } from './app.component';

describe('Recuperación de despliegues Angular', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://consaborflamenco.com/chunk.CZTJPECW.js',
    'Importing a module script failed.',
    'ChunkLoadError: Loading chunk 2 failed',
    'Loading CSS chunk 15 failed',
    'error loading dynamically imported module'
  ])('detecta el fichero de versión antigua: %s', mensaje => {
    expect(esErrorDeChunk(new TypeError(mensaje))).toBe(true);
  });

  it.each([
    'Http failure response for /api/v1/territorio/municipios: 404 Not Found',
    'No se encontró el artista solicitado',
    'Error: Invalid route',
    'Unauthorized',
    ''
  ])('no recarga ante errores de API o navegación: %s', mensaje => {
    expect(esErrorDeChunk(new Error(mensaje))).toBe(false);
  });
});
