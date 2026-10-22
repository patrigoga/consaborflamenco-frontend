import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
  ArtistaAdmin, ArtistaPeticion, Catalogos, FiltroArtistas, Pagina, Resumen, UsuarioAdmin
} from './modelos';

const API = '/api/v1/admin';

export type AccionEditorial = 'publicar' | 'despublicar' | 'destacar' | 'quitar-destacado' | 'archivar' | 'restaurar';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private catalogos$?: Observable<Catalogos>;

  catalogos(): Observable<Catalogos> {
    this.catalogos$ ??= this.http.get<Catalogos>(`${API}/catalogos`).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.catalogos$;
  }

  resumen(): Observable<Resumen> {
    return this.http.get<Resumen>(`${API}/artistas/resumen`);
  }

  listar(f: Partial<FiltroArtistas>): Observable<Pagina<ArtistaAdmin>> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(f)) {
      if (valor !== undefined && valor !== null && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<Pagina<ArtistaAdmin>>(`${API}/artistas`, { params });
  }

  destacados(): Observable<ArtistaAdmin[]> {
    return this.http.get<ArtistaAdmin[]>(`${API}/artistas/destacados`);
  }

  obtener(id: number): Observable<ArtistaAdmin> {
    return this.http.get<ArtistaAdmin>(`${API}/artistas/${id}`);
  }

  crear(datos: ArtistaPeticion): Observable<ArtistaAdmin> {
    return this.http.post<ArtistaAdmin>(`${API}/artistas`, datos);
  }

  actualizar(id: number, datos: ArtistaPeticion): Observable<ArtistaAdmin> {
    return this.http.put<ArtistaAdmin>(`${API}/artistas/${id}`, datos);
  }

  accion(id: number, accion: AccionEditorial): Observable<ArtistaAdmin> {
    return this.http.post<ArtistaAdmin>(`${API}/artistas/${id}/${accion}`, null);
  }

  subirFoto(id: number, archivo: File): Observable<HttpEvent<ArtistaAdmin>> {
    const datos = new FormData();
    datos.append('archivo', archivo, archivo.name);
    return this.http.post<ArtistaAdmin>(`${API}/artistas/${id}/foto`, datos, { reportProgress: true, observe: 'events' });
  }

  quitarFoto(id: number): Observable<ArtistaAdmin> {
    return this.http.delete<ArtistaAdmin>(`${API}/artistas/${id}/foto`);
  }

  // ---- Cuentas (solo administrador principal)
  usuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${API}/usuarios`);
  }

  crearUsuario(email: string, nombre: string, password: string): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`${API}/usuarios`, { email, nombre, password });
  }

  cambiarEstadoUsuario(id: number, activar: boolean): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`${API}/usuarios/${id}/${activar ? 'activar' : 'desactivar'}`, null);
  }

  restablecerPassword(id: number, password: string): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`${API}/usuarios/${id}/password`, { password });
  }
}
