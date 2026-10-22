# Navegación y páginas públicas

Toda la navegación interna usa Angular Router (`routerLink`). No queda ningún enlace `href="#..."`.

## Dónde se define

`src/app/navegacion.ts` es la fuente única. Cada sección declara su ruta, el texto del menú, el título, el H1 y la metadescripción. De ahí salen:

- el menú (`layout/cabecera.component`) y el pie (`layout/pie.component`);
- las rutas (`app.routes.ts`) y las páginas que se prerenderizan (`app.routes.server.ts`);
- las etiquetas SEO (`seo/seo-title.strategy.ts`): `<title>`, `description`, Open Graph y `canonical`.

## Mapa de rutas

| Ruta | Página |
|---|---|
| `/` | Portada (con «Ver todos» en cada bloque) |
| `/flamenco/historia` · `/flamenco/palos` · `/flamenco/llaves-de-oro` | Flamenco (`/flamenco` → Historia) |
| `/revista/artistas` · `academias` · `fotografia` · `moda` · `penas` · `tablaos` · `festivales` | Revista (`/revista` → Artistas) |
| `/eventos` · `/servicios` · `/contacto` · `/membresias` | Generales |
| cualquier otra | Página 404 (HTTP 404, `noindex`) |
| `/admin/**` | Panel de administración (sin cambios, solo en el navegador) |

`/revista/artistas` lee la API pública y guarda los filtros en la URL (`?provincia=…&disciplina=…&pagina=…`), así que se pueden compartir y recargar con F5. El resto de secciones muestran un aviso «en preparación» hasta que haya contenido real.

## Añadir una sección

1. Añádela a `SECCIONES` (y a `NAVEGACION` o a su grupo) en `navegacion.ts`.
2. Crea su componente en `src/app/paginas/…` usando `csf-pagina-seccion`.
3. Añade su ruta en `app.routes.ts` con `seccion('clave', () => import(...))`. Se prerenderiza sola.

## SSR

- Las 15 páginas públicas se prerenderizan en la compilación, con su HTML, título y descripción.
- `security.allowedHosts` en `angular.json` autoriza `consaborflamenco.com`, `www.consaborflamenco.com` y `localhost`. Para otros dominios, añádelos ahí o en `NG_ALLOWED_HOSTS`.
- `server.ts` sirve los estáticos con `redirect: false`, para que `/flamenco/historia` no redirija a `/flamenco/historia/`.
