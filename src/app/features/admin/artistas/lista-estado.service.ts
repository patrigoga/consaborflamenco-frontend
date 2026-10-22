import { Injectable, signal } from '@angular/core';
import { FiltroArtistas } from '../core/modelos';

export const FILTRO_INICIAL: FiltroArtistas = {
  q: '', estado: 'ACTIVOS', disciplina: '', provincia: '', orden: 'nombre', page: 0, size: 20
};

/** Conserva los filtros del listado al ir y volver de una ficha. */
@Injectable({ providedIn: 'root' })
export class ListaEstadoService {
  readonly filtro = signal<FiltroArtistas>({ ...FILTRO_INICIAL });
}
