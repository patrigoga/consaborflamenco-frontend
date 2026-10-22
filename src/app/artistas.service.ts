import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Artista { id: number; nombre: string; slug: string; disciplina: string; provincia: string; biografia?: string | null; fotoUrl: string | null; destacado: boolean; }
export interface PaginaArtistas { content: Artista[]; totalElements: number; totalPages?: number; number?: number; }
export interface FiltroPublico { provincia?: string; disciplina?: string; page?: number; size?: number; }
@Injectable({providedIn:'root'})
export class ArtistasService {
 private readonly http = inject(HttpClient);
 listar(): Observable<PaginaArtistas> {
   return this.http.get<PaginaArtistas>('/api/v1/artistas?size=3');
 }
 buscar(f: FiltroPublico): Observable<PaginaArtistas> {
   let params = new HttpParams();
   for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
   return this.http.get<PaginaArtistas>('/api/v1/artistas', { params });
 }
}
