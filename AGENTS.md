# AGENTS.md — ConSaborFlamenco (frontend)

## Objetivo
Este repositorio contiene el frontend Angular SSR de ConSaborFlamenco. El objetivo es mantener la web en producción sin pasos SSH repetidos. Antes de cambiar código, comprobar la estructura existente y no duplicar funciones, pantallas ni configuraciones.

## Repositorios e infraestructura
- Frontend GitHub: `patrigoga/consaborflamenco-frontend`.
- Backend GitHub: `patrigoga/consaborflamencoback` (Spring Boot, MySQL, Flyway).
- VPS Hostinger Ubuntu: aplicación en `/opt/consaborflamenco`.
- Docker Compose: `compose.yaml` **y** `compose.override.yaml`; la configuración efectiva es la combinación.
- Contenedores: `consaborflamenco-frontend-1`, `consaborflamenco-backend-1`, `consaborflamenco-mysql-1`, `consaborflamenco-caddy-1`.
- Angular SSR expone internamente el puerto 4000; Caddy hace de proxy inverso.
- Mantener el ajuste `NG_TRUST_PROXY_HEADERS` y los volúmenes de medios del backend.

## Flujo obligatorio para cambios de frontend
1. Crear rama desde `main`; implementar un cambio limitado y revisar el código existente.
2. Abrir PR y comprobar **Frontend CI** y **Docker SSR CI**.
3. Fusionar a `main` tras los checks; el flujo `Deploy frontend VPS` se dispara automáticamente tras **Frontend CI** exitoso en `main`.
4. Revisar el resultado en GitHub Actions. No afirmar que una funcionalidad está publicada hasta que el despliegue figure **Success**; la comprobación HTTP interna no reemplaza una prueba de usuario de la función.
5. También puede lanzarse manualmente desde GitHub Actions (`workflow_dispatch`, rama `main`).

## Automatización y secretos
- Archivo: `.github/workflows/deploy-frontend.yml`.
- Script VPS transmitido por SSH: `scripts/deploy-frontend.sh`.
- Entorno GitHub: `production`.
- Secrets: `CSF_DEPLOY_HOST`, `CSF_DEPLOY_KNOWN_HOSTS`, `CSF_DEPLOY_SSH_KEY_B64`.
- La clave SSH está codificada en Base64, **no cifrada**. Nunca mostrarla, subirla al repositorio ni enviarla por chat.
- `deploy` dispone del grupo `docker`; esto equivale prácticamente a privilegios root. Proteger y rotar esa clave si se expone.
- No volver al secreto multilínea obsoleto `CSF_DEPLOY_SSH_KEY` sin motivo.
- GitHub envía un tar.gz del commit validado por SCP. El VPS **no necesita `git pull`** para el flujo del frontend.
- El workflow crea una nueva imagen con etiqueta `auto-<sha>`, actualiza el Compose, recrea solo frontend, valida Angular SSR y tiene intento de rollback.
- Consultar `DEPLOY.md` para fallos, límites y procedimientos de emergencia.

## Backend y datos: NO automatizados aquí
- No desplegar backend ni modificar MySQL mediante el workflow del frontend.
- Antes de migraciones Flyway: copia de seguridad, revisión de SQL, plan de restauración y autorización expresa.
- Las copias de seguridad y la reversión de esquemas MySQL no están cubiertas por el script frontend.
- No alterar los volúmenes persistentes ni recrear todo Compose como sustituto de un despliegue de frontend.

## Convenciones de colaboración
- Usuario prefiere indicaciones en español y **un paso de terminal por turno** cuando se necesita SSH.
- Priorizar GitHub y Actions sobre comandos manuales de VPS.
- Nunca pedir que se peguen secretos SSH, contraseñas ni tokens en el chat.
- Informar claramente de qué ha quedado probado, qué se ha fusionado y qué sigue pendiente de producción.
