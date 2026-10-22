import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { Sesion } from './modelos';

const AUTH = '/api/v1/admin/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly _sesion = signal<Sesion | null>(null);
  private comprobada = false;

  readonly sesion = this._sesion.asReadonly();
  readonly autenticado = computed(() => this._sesion() !== null);
  readonly esPrincipal = computed(() => this._sesion()?.principal === true);

  /** Garantiza la cookie XSRF-TOKEN antes de enviar el login. */
  csrf(): Observable<void> {
    return this.http.get<void>(`${AUTH}/csrf`);
  }

  /** Consulta la sesión al servidor una vez; después usa la conocida. */
  comprobar(forzar = false): Observable<Sesion | null> {
    if (this.comprobada && !forzar) return of(this._sesion());
    return this.http.get<Sesion>(`${AUTH}/sesion`).pipe(
      tap(s => { this._sesion.set(s); this.comprobada = true; }),
      catchError((e: HttpErrorResponse) => {
        if (e.status === 401 || e.status === 403) {
          this._sesion.set(null);
          this.comprobada = true;
          return of(null);
        }
        throw e;
      })
    );
  }

  login(email: string, password: string): Observable<Sesion> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<Sesion>(`${AUTH}/login`, { email, password })),
      tap(s => { this._sesion.set(s); this.comprobada = true; })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${AUTH}/logout`, null).pipe(
      catchError(() => of(void 0)),
      map(() => void 0),
      tap(() => this.olvidar())
    );
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.http.post<void>(`${AUTH}/password`, { actual, nueva });
  }

  /** La sesión ha caducado o se ha revocado en el servidor. */
  sesionCaducada(): void {
    if (!this._sesion()) return;
    this.olvidar();
    this.router.navigate(['/admin/login'], { queryParams: { motivo: 'caducada', volver: this.router.url } });
  }

  private olvidar(): void {
    this._sesion.set(null);
    this.comprobada = true;
  }
}
