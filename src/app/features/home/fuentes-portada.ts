import { Injectable, signal } from '@angular/core';

export type CategoriaPortada = 'artistas' | 'eventos' | 'academias' | 'revista';
export type FuentePortada = 'json' | 'bd';
export const CATEGORIAS_PORTADA: CategoriaPortada[] = ['artistas', 'eventos', 'academias', 'revista'];
export const CLAVE_FUENTES_PORTADA = 'csf:demo:fuentes-portada:v1';

/** Preferencias de PREVISUALIZACIÓN locales al navegador, no config global del servidor. */
@Injectable({ providedIn: 'root' })
export class FuentesPortadaService {
  readonly fuentes = signal<Record<CategoriaPortada, FuentePortada>>({
    artistas: 'bd', eventos: 'bd', academias: 'bd', revista: 'bd'
  });

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const value = JSON.parse(localStorage.getItem(CLAVE_FUENTES_PORTADA) || '{}') as Record<string, unknown>;
      const safe = { ...this.fuentes() };
      for (const categoria of CATEGORIAS_PORTADA) {
        if (value[categoria] === 'json' || value[categoria] === 'bd') safe[categoria] = value[categoria];
      }
      this.fuentes.set(safe);
    } catch { /* Preferencias locales corruptas: modo BD por defecto */ }
  }

  cambiar(categoria: CategoriaPortada, fuente: FuentePortada): void {
    const next = { ...this.fuentes(), [categoria]: fuente };
    this.fuentes.set(next);
    if (typeof window !== 'undefined') localStorage.setItem(CLAVE_FUENTES_PORTADA, JSON.stringify(next));
  }
}

export interface TarjetaDemo { titulo: string; subtitulo: string; imagen: string; ruta?: string }
export interface ArtistaDemo { nombre: string; disciplina: string; provincia: string; fotoUrl: string; demo: true }
export interface PortadaDemo {
  version: number;
  artistas: ArtistaDemo[];
  eventos: TarjetaDemo[];
  academias: TarjetaDemo[];
  revista: TarjetaDemo[];
}
