import { Artista } from '../../artistas.service';

export interface ImagenArtista { id: number; url: string; titulo: string; credito: string; }
export interface VideoArtista { id: number; titulo: string; url: string; }
export interface DiscoArtista { id: number; titulo: string; anio: string; portada: string; enlace: string; }
export interface ActuacionArtista { id: number; titulo: string; fecha: string; lugar: string; ciudad: string; entradas: string; }
export interface RedArtista { id: number; nombre: string; url: string; }

/** Modelo de presentación. Las colecciones todavía no forman parte de la API. */
export interface PerfilArtista extends Artista {
  portada: string;
  frase: string;
  imagenes: ImagenArtista[];
  videos: VideoArtista[];
  discos: DiscoArtista[];
  actuaciones: ActuacionArtista[];
  redes: RedArtista[];
}

export function perfilDesdeArtista(a: Artista): PerfilArtista {
  return { ...a, portada: a.fotoUrl ?? '', frase: '', imagenes: [], videos: [], discos: [], actuaciones: [], redes: [] };
}

/** Solo enlaces HTTPS; nunca aceptar javascript:, credenciales ni URLs relativas. */
export function enlaceSeguro(valor: string): string | null {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function idYoutube(valor: string): string | null {
  try {
    const url = new URL(valor);
    if (!enlaceSeguro(valor)) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

/** Imágenes elegidas en el dispositivo: solo en memoria y nunca enviadas al servidor. */
export function imagenSegura(valor: string | null): string | null {
  if (!valor) return null;
  if (/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(valor)) return valor;
  if (valor.startsWith('/uploads/') || valor.startsWith('/images/')) return valor;
  return enlaceSeguro(valor);
}
