import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface EventoPublico {
  id: number;
  titulo: string;
  slug: string;
  descripcion: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFin: string | null;
  zonaHoraria: string;
  lugar: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  pais: string;
  cartelUrl: string | null;
  organizador: string | null;
  gratuito: boolean | null;
  precioCentimos: number | null;
  entradaUrl: string | null;
  artistaIds: number[];
  artistasTexto: string | null;
}

export interface PaginaEventos {
  content: EventoPublico[];
  number: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  proximos(page = 0, size = 12) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PaginaEventos>('/api/v1/eventos', { params });
  }
  porSlug(slug: string) { return this.http.get<EventoPublico>(`/api/v1/eventos/${encodeURIComponent(slug)}`); }
}
