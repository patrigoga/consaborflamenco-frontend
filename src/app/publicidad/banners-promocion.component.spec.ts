import { ubicacionPromocion } from '../layout/layout-publico.component';

describe('Ubicaciones de los banners públicos', () => {
  it.each([
    ['/', 'INICIO'],
    ['/revista/artistas', 'ARTISTAS'],
    ['/revista/artistas/bailaora-ejemplo', 'ARTISTAS'],
    ['/eventos', 'EVENTOS'],
    ['/eventos/recital', 'EVENTOS'],
    ['/revista/academias', 'ACADEMIAS'],
    ['/revista/tablaos', 'TABLAOS'],
    ['/municipios', 'MUNICIPIOS'],
    ['/municipios/23', 'MUNICIPIO:23'],
    ['/municipios/23?src=portada', 'MUNICIPIO:23'],
    ['/acceso', ''],
    ['/registro', ''],
    ['/mi-cuenta/perfil', ''],
    ['/promocion', ''],
  ])('en %s corresponde %s', (ruta, codigo) => {
    expect(ubicacionPromocion(ruta)).toBe(codigo);
  });
});
