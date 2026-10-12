# Angular SSR en VPS (preparación)

- La imagen Docker compila Angular 19 y ejecuta SSR en puerto interno 4000.
- La web pública se servirá mediante Caddy; no publicar directamente el puerto 4000.
- Ruta esperada de compilación: dist/consaborflamenco/server/server.mjs.
- Antes de desplegar: verificar CI, imagen, networking Docker y ruta de proxy.
- El endpoint Angular /api/v1/artistas es relativo; debe configurarse un reverse proxy /api/* hacia el servicio Spring Boot backend:8080 en Caddy.
- No tocar DNS ni la configuración de Caddy de producción hasta superar las pruebas internas.
