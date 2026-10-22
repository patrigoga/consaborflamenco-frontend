import { Injectable, signal } from '@angular/core';

export interface PeticionConfirmacion {
  titulo: string;
  mensaje: string;
  aceptar: string;
  cancelar?: string;
  peligro?: boolean;
}

/** Diálogo de confirmación accesible (elemento <dialog>) que sustituye a window.confirm. */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly actual = signal<PeticionConfirmacion | null>(null);
  private resolver?: (valor: boolean) => void;

  pedir(p: PeticionConfirmacion): Promise<boolean> {
    this.resolver?.(false);
    this.actual.set(p);
    return new Promise(resolve => (this.resolver = resolve));
  }

  responder(valor: boolean): void {
    this.actual.set(null);
    const r = this.resolver;
    this.resolver = undefined;
    r?.(valor);
  }
}
