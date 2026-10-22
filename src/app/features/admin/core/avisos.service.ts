import { Injectable, signal } from '@angular/core';

export interface Aviso { id: number; texto: string; tipo: 'ok' | 'error'; }

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguiente = 1;
  readonly avisos = signal<Aviso[]>([]);

  ok(texto: string): void { this.mostrar(texto, 'ok'); }
  error(texto: string): void { this.mostrar(texto, 'error'); }

  cerrar(id: number): void { this.avisos.update(l => l.filter(a => a.id !== id)); }

  private mostrar(texto: string, tipo: Aviso['tipo']): void {
    const id = this.siguiente++;
    this.avisos.update(l => [...l.slice(-2), { id, texto, tipo }]);
    setTimeout(() => this.cerrar(id), tipo === 'error' ? 8000 : 4000);
  }
}
