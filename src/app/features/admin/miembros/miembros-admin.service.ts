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
  suspensionMotivo: string | null;
  suspensionEn: string | null;
  suspendidoPorUsuarioId: number | null;
  puedeCrearEventos: boolean;
  puedeCrearCursos: boolean;
  puedePublicarArticulos: boolean;
  puedeEditarBiografia: boolean;
}
export interface RegistroAuditoriaMiembro {
  id: number;
  miembroId: number;
  administradorId: number;
  accion: string;
  detalle: string | null;
  fecha: string;
}

export interface PerfilMiembro {
  id: number;
  miembroId: number;
  tipo: string;
  nombre: string;
  estado: string;
  creadoEn: string;
}

export interface PermisosMiembro {
  crearEventos: boolean;
  crearCursos: boolean;
  publicarArticulos: boolean;
  editarBiografia: boolean;
}

@Injectable({ providedIn: 'root' })
export class MiembrosAdminService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/admin/miembros';

  listar() { return this.http.get<MiembroAdmin[]>(this.url); }
  editar(id: number, nombre: string, email: string) {
    return this.http.put<MiembroAdmin>(`${this.url}/${id}`, { nombre, email });
  }
  bloquear(id: number, motivo: string) {
    return this.http.post<MiembroAdmin>(`${this.url}/${id}/bloquear`, { motivo });
  }
  desbloquear(id: number) { return this.http.post<MiembroAdmin>(`${this.url}/${id}/desbloquear`, null); }
  solicitarCambioCorreo(id: number, nuevoEmail: string) {
    return this.http.post<void>(`${this.url}/${id}/email/cambio`, { nuevoEmail });
  }
  actualizarPermisos(id: number, p: PermisosMiembro) {
    return this.http.put<MiembroAdmin>(`${this.url}/${id}/permisos`, p);
  }
  historial(id: number) {
    return this.http.get<RegistroAuditoriaMiembro[]>(`${this.url}/${id}/auditoria`);
  }
  perfiles(id: number) {
    return this.http.get<PerfilMiembro[]>(`${this.url}/${id}/perfiles`);
  }
  crearPerfil(id: number, tipo: string, nombre: string) {
    return this.http.post<PerfilMiembro>(`${this.url}/${id}/perfiles`, { tipo, nombre });
  }
  revisarPerfil(id: number, perfilId: number, estado: 'APROBADO' | 'RECHAZADO') {
    return this.http.put<PerfilMiembro>(`${this.url}/${id}/perfiles/${perfilId}/revision`, { estado });
  }
  cambiarPassword(id: number, password: string) {
    return this.http.post<MiembroAdmin>(`${this.url}/${id}/password`, { password });
  }
}
