# Despliegue ConSaborFlamenco: frontend

## Estado y límites
- Frontend: Angular SSR en Docker, puerto interno 4000.
- Backend: Spring Boot y MySQL independientes; este flujo **no los despliega**.
- El backend tiene Flyway: respaldar MySQL y autorizar las migraciones antes de desplegarlo.
- Mantener siempre `NG_TRUST_PROXY_HEADERS` en el servicio frontend.
- Docker Compose combina `compose.yaml` y `compose.override.yaml`. Revisar ambos al cambiar imágenes.
- El servidor está en `/opt/consaborflamenco`.
- Nunca guardar contraseñas ni claves privadas en este repositorio.

## Automatización GitHub Actions
`.github/workflows/deploy-frontend.yml` se lanza automáticamente si **Frontend CI** termina bien en `main`, o manualmente desde Actions.
Sin las tres variables secretas del entorno `production` no despliega nada.
Se necesita configurar:
- `CSF_DEPLOY_HOST`: nombre/IP pública del servidor.
- `CSF_DEPLOY_SSH_KEY`: clave privada exclusiva de despliegue, sin contraseña, con acceso como usuario `deploy` (no usar una clave personal).
- `CSF_DEPLOY_KNOWN_HOSTS`: clave pública del host SSH **comprobada por el propietario** para evitar suplantación.

La clave pública correspondiente debe autorizarse en `/home/deploy/.ssh/authorized_keys`, restringiendo permisos según necesidades. La clave y la huella deben verificarse de forma segura. El usuario `deploy` necesita permisos de lectura/escritura en el checkout y sudo no interactivo para los comandos Docker usados. Configurar protección del entorno `production` y, inicialmente, aprobación manual.

El script `scripts/deploy-frontend.sh` crea imagen etiquetada por commit, actualiza Compose, recrea solo frontend, hace un test HTTP local y restaura la imagen anterior si falla. No borra imágenes ni volúmenes.

## Primera activación
1. Crear la clave SSH exclusiva de Actions y verificar su huella sin publicarla.
2. Configurar secrets del entorno production en GitHub y sus reglas de aprobación.
3. Ejecutar `Deploy frontend VPS` manualmente desde la pestaña Actions.
4. Verificar la portada y el panel; posteriormente, si se desea, desactivar la aprobación manual para el frontend.
5. No habilitar despliegues automáticos de backend hasta disponer de un flujo separado con respaldo de base de datos, migraciones y recuperación.

## Comando manual de emergencia
Desde el VPS:
```bash
cd /opt/consaborflamenco
bash frontend/scripts/deploy-frontend.sh
```
