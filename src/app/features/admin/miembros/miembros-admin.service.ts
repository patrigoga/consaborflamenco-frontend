import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface MiembroAdmin {
  id: number;
  nombre: string;
  email: string;
  rol: 'ARTISTA';
  activo: boolean;
  bloqueado: boolean;
  creadoEn: string | null;
  ultimoAccesoEn: string | null;
}
@Injectable({ providedIn: 'root' })
export class MiembrosAdminService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/admin/miembros';

  listar() { return this.http.get<MiembroAdmin[]>(this.url); }
  editar(id: number, nombre: string, email: string) {
    return this.http.put<MiembroAdmin>(`${this.url}/${id}`, { nombre, email });
  }
  bloquear(id: number) { return this.http.post<MiembroAdmin>(`${this.url}/${id}/bloquear`, null); }
  desbloquear(id: number) { return this.http.post<MiembroAdmin>(`${this.url}/${id}/desbloquear`, null); }
  cambiarPassword(id: number, password: string) {
    return this.http.post<MiembroAdmin>(`${this.url}/${id}/password`, { password });
  }
}
