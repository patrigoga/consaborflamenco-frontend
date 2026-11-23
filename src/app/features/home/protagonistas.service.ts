import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type TipoProtagonista = 'ARTISTA' | 'EVENTO' | 'CURSO';
export interface Protagonista { tipo: TipoProtagonista; titulo: string; descripcion: string; imagenUrl: string; destino: string; imagenCabeceraUrl?: string | null; cabeceraPosX?: number; cabeceraPosY?: number; cabeceraEscala?: number }
export const TIPOS_PROTAGONISTA: TipoProtagonista[] = ['ARTISTA','EVENTO','CURSO'];

@Injectable({ providedIn: 'root' })
export class ProtagonistasService {
  private readonly http = inject(HttpClient);
  listar() { return this.http.get<Protagonista[]>('/api/v1/portada/protagonistas'); }
  guardar(item: Protagonista) { return this.http.put<Protagonista>('/api/v1/admin/portada/protagonistas/' + item.tipo, item); }
  subirImagenCabecera(archivo: File) {
    const datos = new FormData();
    datos.append('archivo', archivo);
    return this.http.post<Protagonista>('/api/v1/admin/portada/protagonistas/ARTISTA/imagen-cabecera', datos);
  }
  quitarImagenCabecera() {
    return this.http.delete<Protagonista>('/api/v1/admin/portada/protagonistas/ARTISTA/imagen-cabecera');
  }
  guardarAjustesCabecera(posX: number, posY: number, escala: number) {
    return this.http.put<Protagonista>('/api/v1/admin/portada/protagonistas/ARTISTA/ajustes-cabecera', { posX, posY, escala });
  }
  eliminar(tipo: TipoProtagonista) { return this.http.delete<void>('/api/v1/admin/portada/protagonistas/' + tipo); }
}
