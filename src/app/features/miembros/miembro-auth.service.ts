import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';

export interface SesionMiembro {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  expiraTrasInactividadSegundos: number;
}

const API = '/api/v1/miembros/auth';

@Injectable({ providedIn: 'root' })
export class MiembroAuthService {
  private readonly http = inject(HttpClient);
  readonly sesion = signal<SesionMiembro | null>(null);

  comprobar(): Observable<SesionMiembro | null> {
    return this.http.get<SesionMiembro>(API + '/sesion').pipe(
      tap(s => this.sesion.set(s)),
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          this.sesion.set(null);
          return of(null);
        }
        throw error;
      })
    );
  }

  entrar(email: string, password: string): Observable<SesionMiembro> {
    return this.http.get<void>(API + '/csrf').pipe(
      switchMap(() => this.http.post<SesionMiembro>(API + '/login', { email, password })),
      tap(s => this.sesion.set(s))
    );
  }

  salir(): Observable<void> {
    return this.http.post<void>(API + '/logout', null).pipe(
      tap(() => this.sesion.set(null))
    );
  }
}
