import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface TablaSql {
  nombre: string;
  grupo: string;
  columnas: number;
}
export interface ColumnaSql {
  nombre: string;
  tipo: string;
  oculta: boolean;
}
export interface PaginaSql {
  tabla: string;
  columnas: ColumnaSql[];
  filas: Record<string, unknown>[];
  total: number;
  pagina: number;
  limite: number;
}

@Injectable({ providedIn: 'root' })
export class BaseDatosAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/admin/base-datos';
  tablas() { return this.http.get<TablaSql[]>(this.base + '/tablas'); }
  contenido(nombre: string, pagina = 0, limite = 25, busqueda = '') {
    const params = new HttpParams()
      .set('pagina', pagina)
      .set('limite', limite)
      .set('busqueda', busqueda);
    return this.http.get<PaginaSql>(this.base + '/tablas/' + encodeURIComponent(nombre), { params });
  }
}
