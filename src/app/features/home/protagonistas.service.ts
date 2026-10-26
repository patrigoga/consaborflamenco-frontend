import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type TipoProtagonista = 'ARTISTA' | 'EVENTO' | 'CURSO';
export interface Protagonista { tipo: TipoProtagonista; titulo: string; descripcion: string; imagenUrl: string; destino: string }
export const TIPOS_PROTAGONISTA: TipoProtagonista[] = ['ARTISTA','EVENTO','CURSO'];

@Injectable({ providedIn: 'root' })
export class ProtagonistasService {
  private readonly http = inject(HttpClient);
  listar() { return this.http.get<Protagonista[]>('/api/v1/portada/protagonistas'); }
  guardar(item: Protagonista) { return this.http.put<Protagonista>('/api/v1/admin/portada/protagonistas/' + item.tipo, item); }
  eliminar(tipo: TipoProtagonista) { return this.http.delete<void>('/api/v1/admin/portada/protagonistas/' + tipo); }
}
