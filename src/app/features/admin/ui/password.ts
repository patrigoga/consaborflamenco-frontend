const ALFABETO = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Contraseña temporal aleatoria (Web Crypto), 4 bloques de 5 caracteres: ~115 bits de entropía. */
export function generarPassword(): string {
  const bloques: string[] = [];
  const max = 256 - (256 % ALFABETO.length); // evita el sesgo del módulo
  for (let b = 0; b < 4; b++) {
    let bloque = '';
    while (bloque.length < 5) {
      const byte = crypto.getRandomValues(new Uint8Array(1))[0];
      if (byte < max) bloque += ALFABETO[byte % ALFABETO.length];
    }
    bloques.push(bloque);
  }
  return bloques.join('-');
}
