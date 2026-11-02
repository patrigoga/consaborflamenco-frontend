import { PLATFORM_ID, RESPONSE_INIT, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ResolveFn } from '@angular/router';
import { catchError, map, of, tap, timeout } from 'rxjs';
import { Artista, ArtistasService } from '../../artistas.service';
import { SITIO_URL } from '../../navegacion';

export interface FichaArtista { artista: Artista | null; estado: 'listo' | 'no-encontrado' | 'error'; }

/** Solo la API pública existente: sin cookies de administración ni operaciones de escritura. */
export const perfilArtistaResolver: ResolveFn<FichaArtista> = ruta => {
  const api = inject(ArtistasService);
  const servidor = isPlatformServer(inject(PLATFORM_ID));
  const respuesta = inject(RESPONSE_INIT, { optional: true });
  const transferencia = inject(TransferState);
  const slug = ruta.paramMap.get('slug') ?? '';
  const clave = makeStateKey<FichaArtista>('perfil-publico-' + slug);
  if (!servidor && transferencia.hasKey(clave)) {
    const ficha = transferencia.get(clave, { artista: null, estado: 'error' });
    transferencia.remove(clave);
    return of(ficha);
  }
  if (!/^[\p{L}\p{N}-]{1,180}$/u.test(slug)) {
    if (respuesta) respuesta.status = 404;
    return of<FichaArtista>({ artista: null, estado: 'no-encontrado' });
  }
  // En SSR se usa exclusivamente el origen público conocido, nunca uno recibido del visitante.
  return api.obtener(slug, servidor ? SITIO_URL : '').pipe(
    timeout(6000),
    map(artista => ({ artista, estado: 'listo' as const })),
    catchError((error: HttpErrorResponse) => {
      const noEncontrado = error.status === 404;
      if (respuesta) respuesta.status = noEncontrado ? 404 : 503;
      return of<FichaArtista>({ artista: null, estado: noEncontrado ? 'no-encontrado' : 'error' });
    }),
    tap(ficha => { if (servidor) transferencia.set(clave, ficha); })
  );
};
