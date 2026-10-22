# Panel de administración (Angular)

Ruta `/admin`, cargada bajo demanda: no añade peso a la web pública.

- **Renderizado:** `/admin/**` se renderiza solo en el navegador (`RenderMode.Client` en `app.routes.server.ts`). El servidor SSR nunca procesa datos privados. Además, el servidor envía `X-Robots-Tag: noindex` y `Cache-Control: no-store` para `/admin`.
- **Sesión:** cookie `CSF_SESSION` del backend, que Angular no lee porque es `HttpOnly`. `AuthService` consulta `/api/v1/admin/auth/sesion` y los guards protegen las rutas.
- **CSRF:** `withXsrfConfiguration` envía la cookie `XSRF-TOKEN` en la cabecera `X-XSRF-TOKEN` en POST, PUT y DELETE relativos. Si Spring rechaza un token (403 `CSRF`), `adminInterceptor` pide uno nuevo y reintenta una sola vez, añadiendo él mismo la cabecera.
- **Caducidad:** cualquier 401 de la API de administración devuelve al login conservando la página en la que estabas.

## Estructura

```
src/app/features/admin/
  admin.routes.ts           rutas del panel (lazy)
  admin-shell.component.ts  estilos, avisos y diálogo de confirmación
  admin.css                 tema negro y dorado, todo bajo .adm
  core/                     API, sesión, guards, interceptor, modelos
  layout/                   barra lateral (menú desplegable en móvil)
  login/ inicio/ artistas/ destacados/ usuarios/ cuenta/
  ui/                       retrato, estado, generador de contraseñas
```

## Desarrollo

```
npm ci
npm start              # ng serve con proxy.conf.json: /api y /media → http://localhost:8080
npm test               # pruebas unitarias (Jest)
npm run build          # compilación SSR
```

## Prueba de extremo a extremo (solo local)

Requiere el backend en `localhost:8080` y `npm start` en marcha. Crea datos de prueba, así que **úsala solo con una base de datos local**: el script se niega a ejecutarse contra cualquier host que no sea `localhost`.

```
npx playwright install chromium
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run e2e
```

Comprueba login, cookies, rotación y recuperación del token CSRF, una escritura forjada sin cabecera (403), creación, foto, publicación, destacado, archivado y restauración, la portada pública, los permisos de cuentas, la revocación de sesión y el logout.
