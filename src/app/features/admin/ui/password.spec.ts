import { generarPassword } from './password';

describe('generarPassword', () => {
  it('genera contraseñas temporales que cumplen la política del servidor', () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const p = generarPassword();
      expect(p).toMatch(/^[a-zA-Z2-9]{5}(-[a-zA-Z2-9]{5}){3}$/);
      expect(p.length).toBeGreaterThanOrEqual(12);
      expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(72);
      vistas.add(p);
    }
    expect(vistas.size).toBe(50);
  });
});
