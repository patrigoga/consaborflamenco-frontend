import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Pagina } from '../core/modelos';

export interface Consagrado {
  id: number;
  titulo: string;
  descripcion: string;
  fotoUrl: string;
  fuente: string | null;
  creadoEn: string | null;
  actualizadoEn: string | null;
}

export interface ConsagradoDatos { titulo: string; descripcion: string; fuente: string | null; }
const API = '/api/v1/admin/consagrados';

@Injectable({ providedIn: 'root' })
export class ConsagradosApiService {
  private readonly http = inject(HttpClient);

  listar(q = '', page = 0) {
    const params = new HttpParams().set('q', q).set('page', page).set('size', 12);
    return this.http.get<Pagina<Consagrado>>(API, { params });
  }

  obtener(id: number) { return this.http.get<Consagrado>(`${API}/${id}`); }

  guardar(datos: ConsagradoDatos, imagen: File | null, id?: number) {
    const cuerpo = new FormData();
    cuerpo.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    if (imagen) cuerpo.append('imagen', imagen, imagen.name);
    return id ? this.http.put<Consagrado>(`${API}/${id}`, cuerpo) : this.http.post<Consagrado>(API, cuerpo);
  }
}
