import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Artista { id: number; nombre: string; slug: string; disciplina: string; provincia: string; fotoUrl: string | null; destacado: boolean; }
export interface PaginaArtistas { content: Artista[]; totalElements: number; }
@Injectable({providedIn:'root'})
export class ArtistasService {
 private readonly http = inject(HttpClient);
 listar(): Observable<PaginaArtistas> {
   return this.http.get<PaginaArtistas>('/api/v1/artistas?size=3');
 }
}
