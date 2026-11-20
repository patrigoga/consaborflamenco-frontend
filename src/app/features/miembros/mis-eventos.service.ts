import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface EventoMiembro {
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
  fuenteNombre: string | null;
  fuenteUrl: string | null;
  artistasTexto: string | null;
  estadoRevision: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  miembroBorrador: boolean;
  publicado: boolean;
  programacionAutorizada: boolean;
  archivado: boolean;
  fechaPublicacionDeseada: string | null;
  creadoEn: string | null;
  actualizadoEn: string | null;
}

export interface EventoMiembroDatos {
  titulo: string;
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
  fuenteNombre: string | null;
  fuenteUrl: string | null;
  artistasTexto: string | null;
  artistaIds: number[];
  slug: null;
}

@Injectable({ providedIn: 'root' })
export class MisEventosService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/miembros/eventos';
  listar() { return this.http.get<EventoMiembro[]>(this.base); }
  detalle(id: number) { return this.http.get<EventoMiembro>(`${this.base}/${id}`); }
  crear(evento: EventoMiembroDatos, fechaPublicacionDeseada: string | null) {
    return this.http.post<EventoMiembro>(this.base, { evento, fechaPublicacionDeseada });
  }
  editar(id: number, evento: EventoMiembroDatos, fechaPublicacionDeseada: string | null) {
    return this.http.put<EventoMiembro>(`${this.base}/${id}`, { evento, fechaPublicacionDeseada });
  }
  enviarRevision(id: number) {
    return this.http.post<EventoMiembro>(`${this.base}/${id}/enviar-revision`, null);
  }
}
