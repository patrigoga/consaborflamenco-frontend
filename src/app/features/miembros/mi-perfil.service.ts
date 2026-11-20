import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PerfilBasicoMiembro {
  nombre: string;
  nombreArtistico: string | null;
  descripcionBreve: string | null;
  localidad: string | null;
  provincia: string | null;
  fotoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class MiPerfilService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/miembros/mi-perfil';
  consultar() { return this.http.get<PerfilBasicoMiembro>(this.base); }
  guardar(datos: Omit<PerfilBasicoMiembro, 'fotoUrl'>) {
    return this.http.put<PerfilBasicoMiembro>(this.base, datos);
  }
  subirFoto(archivo: File) {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<PerfilBasicoMiembro>(this.base + '/foto', form);
  }
}
