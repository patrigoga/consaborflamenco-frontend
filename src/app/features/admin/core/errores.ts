import { HttpErrorResponse } from '@angular/common/http';
import { Problema } from './modelos';

export function problemaDe(error: unknown): Problema {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error;
    if (cuerpo && typeof cuerpo === 'object') return { status: error.status, ...(cuerpo as Problema) };
    return { status: error.status };
  }
  return {};
}

/** Mensaje claro para mostrar al usuario, nunca un volcado técnico. */
export function mensajeDe(error: unknown, porDefecto = 'No se ha podido completar la operación.'): string {
  const p = problemaDe(error);
  if (p.status === 0) return 'Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.';
  if (p.status === 413) return 'El archivo supera el tamaño máximo permitido.';
  if (p.status && p.status >= 500) return 'El servidor ha tenido un problema. Inténtalo de nuevo en unos minutos.';
  return p.detail ?? porDefecto;
}
