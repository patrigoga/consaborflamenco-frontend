# Angular SSR en VPS (preparación)

- La imagen Docker compila Angular 19 y ejecuta SSR en puerto interno 4000.
- La web pública se servirá mediante Caddy; no publicar directamente el puerto 4000.
- Ruta esperada de compilación: dist/consaborflamenco/server/server.mjs.
- Antes de desplegar: verificar CI, imagen, networking Docker y ruta de proxy.
- El endpoint Angular /api/v1/artistas es relativo; debe configurarse un reverse proxy /api/* hacia el servicio Spring Boot backend:8080 en Caddy.
- No tocar DNS ni la configuración de Caddy de producción hasta superar las pruebas internas.
- **Hosts permitidos de SSR:** desde @angular/ssr 19.2.x el servidor rechaza los hosts no declarados (protección SSRF) y renderiza solo en el cliente, con lo que la portada pierde el HTML prerenderizado. Al desplegar, define `NG_ALLOWED_HOSTS=consaborflamenco.com,www.consaborflamenco.com` en el contenedor del frontend. Afecta también a la versión actual de `feature/docker-ssr` si se recompila con las dependencias de hoy.
- **Panel /admin:** Caddy debe enviar `/api/*` y `/media/*` al backend. `/admin` lo sirve el propio servidor SSR (solo en el navegador, con `noindex`).
