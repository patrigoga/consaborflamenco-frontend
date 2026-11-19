import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Pagina } from '../core/modelos';

export type AccionEvento = 'aprobar' | 'rechazar' | 'publicar' | 'despublicar' | 'destacar' | 'quitar-destacado' | 'archivar' | 'restaurar';
export type FiltroEventos = 'ACTIVOS' | 'TODOS' | 'PUBLICADOS' | 'PENDIENTES' | 'BORRADORES' | 'ARCHIVADOS';

export interface EventoAdmin {
  id: number; titulo: string; slug: string; descripcion: string | null; tipo: string;
  fechaInicio: string; fechaFin: string | null; zonaHoraria: string; lugar: string | null;
  direccion: string | null; localidad: string | null; provincia: string | null;
  pais: string; cartelUrl: string | null; organizador: string | null;
  gratuito: boolean | null; precioCentimos: number | null; entradaUrl: string | null;
  fuenteNombre: string | null; fuenteUrl: string | null;
  estadoRevision: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  publicado: boolean; destacado: boolean; archivado: boolean;
  creadoPorUsuarioId: number | null; aprobadoPorUsuarioId: number | null;
  aprobadoEn: string | null; creadoEn: string | null; actualizadoEn: string | null;
  artistaIds: number[];
}

export type EventoPeticion = Pick<EventoAdmin,
  'titulo' | 'descripcion' | 'tipo' | 'fechaInicio' | 'fechaFin' | 'zonaHoraria' |
  'lugar' | 'direccion' | 'localidad' | 'provincia' | 'pais' | 'cartelUrl' |
  'organizador' | 'gratuito' | 'precioCentimos' | 'entradaUrl' | 'fuenteNombre' |
  'fuenteUrl' | 'artistaIds'> & { slug: string | null };

const API = '/api/v1/admin/eventos';
@Injectable({ providedIn: 'root' })
export class EventosApiService {
  private readonly http = inject(HttpClient);
  listar(q = '', estado: FiltroEventos = 'ACTIVOS', page = 0) {
    const params = new HttpParams().set('q', q).set('estado', estado).set('page', page).set('size', 20);
    return this.http.get<Pagina<EventoAdmin>>(API, { params });
  }
  obtener(id: number) { return this.http.get<EventoAdmin>(`${API}/${id}`); }
  crear(datos: EventoPeticion) { return this.http.post<EventoAdmin>(API, datos); }
  actualizar(id: number, datos: EventoPeticion) {
    return this.http.put<EventoAdmin>(`${API}/${id}`, datos);
  }
  accion(id: number, accion: AccionEvento) {
    return this.http.post<EventoAdmin>(`${API}/${id}/${accion}`, null);
  }
}
