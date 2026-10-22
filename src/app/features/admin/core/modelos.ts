export type Rol = 'ADMIN_PRINCIPAL' | 'ADMIN' | 'ARTISTA';

export interface Sesion {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  principal: boolean;
  expiraTrasInactividadSegundos: number;
}

export interface ArtistaAdmin {
  id: number;
  nombre: string;
  slug: string;
  disciplina: string;
  provincia: string;
  biografia: string | null;
  fotoUrl: string | null;
  publicado: boolean;
  destacado: boolean;
  archivado: boolean;
  archivadoEn: string | null;
  creadoEn: string | null;
  actualizadoEn: string | null;
}

export interface ArtistaPeticion {
  nombre: string;
  slug: string | null;
  disciplina: string;
  provincia: string;
  biografia: string | null;
  fotoUrl: string | null;
}

export type EstadoFiltro = 'ACTIVOS' | 'PUBLICADOS' | 'BORRADORES' | 'DESTACADOS' | 'ARCHIVADOS' | 'TODOS';
export type Orden = 'nombre' | 'actualizado' | 'creado';

export interface FiltroArtistas {
  q: string;
  estado: EstadoFiltro;
  disciplina: string;
  provincia: string;
  orden: Orden;
  page: number;
  size: number;
}

export interface Pagina<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Catalogos {
  disciplinas: string[];
  provincias: string[];
  maxDestacados: number;
  fotoMaxBytes: number;
  fotoTipos: string[];
}

export interface Resumen {
  activos: number;
  publicados: number;
  borradores: number;
  destacados: number;
  archivados: number;
  maxDestacados: number;
}

export interface UsuarioAdmin {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  bloqueado: boolean;
  ultimoAccesoEn: string | null;
  creadoEn: string | null;
}

/** Respuesta de error RFC 9457 de la API de administración. */
export interface Problema {
  status?: number;
  title?: string;
  detail?: string;
  codigo?: string;
  errores?: Record<string, string>;
}
