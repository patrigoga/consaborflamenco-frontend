import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type CategoriaPortada = 'artistas' | 'eventos' | 'academias' | 'revista';
export type FuentePortada = 'json' | 'bd';
export type ConfigFuentesPortada = Record<CategoriaPortada, FuentePortada>;
export const CATEGORIAS_PORTADA: CategoriaPortada[] = ['artistas', 'eventos', 'academias', 'revista'];

const INICIAL: ConfigFuentesPortada = {
  artistas: 'bd', eventos: 'bd', academias: 'bd', revista: 'bd'
};

/** Configuración global y persistente de la portada, guardada en MySQL. */
@Injectable({ providedIn: 'root' })
export class FuentesPortadaService {
  private readonly http = inject(HttpClient);
  readonly fuentes = signal<ConfigFuentesPortada>({ ...INICIAL });
  readonly cargadas = signal(false);
  readonly error = signal('');

  cargar(): Observable<ConfigFuentesPortada> {
    return this.http.get<ConfigFuentesPortada>('/api/v1/portada/fuentes').pipe(
      tap(config => {
        this.fuentes.set(this.validar(config));
        this.cargadas.set(true);
        this.error.set('');
      })
    );
  }

  cambiar(categoria: CategoriaPortada, fuente: FuentePortada): Observable<ConfigFuentesPortada> {
    return this.http.put<ConfigFuentesPortada>('/api/v1/admin/portada/fuentes/' + categoria, { fuente }).pipe(
      tap(config => {
        this.fuentes.set(this.validar(config));
        this.error.set('');
      })
    );
  }

  private validar(config: ConfigFuentesPortada): ConfigFuentesPortada {
    const safe = { ...INICIAL };
    for (const categoria of CATEGORIAS_PORTADA) {
      if (config[categoria] === 'bd' || config[categoria] === 'json') safe[categoria] = config[categoria];
    }
    return safe;
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
