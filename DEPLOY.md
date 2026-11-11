# DEPLOY.md — Operación de ConSaborFlamenco

**Última revisión:** 28 de octubre de 2026.

## 1. Arquitectura actual
| Pieza | Ubicación / cometido | Despliegue |
| --- | --- | --- |
| Frontend | `patrigoga/consaborflamenco-frontend`, Angular SSR, puerto interno 4000 | **Automático** con GitHub Actions |
| Backend | `patrigoga/consaborflamencoback`, Spring Boot y Flyway | **Manual**, con revisión |
| Datos | MySQL 8.4 en Docker | Persistentes; no los modifica el flujo frontend |
| Proxy | Caddy en Docker | Independiente del frontend |
| VPS | Hostinger Ubuntu, `/opt/consaborflamenco` | Usuario `deploy` |

La configuración efectiva de Docker Compose combina `compose.yaml` con `compose.override.yaml`. Conservar `NG_TRUST_PROXY_HEADERS`, la red de servicios y los volúmenes de medios. Los comandos normales de frontend no deben reiniciar backend, MySQL ni Caddy.

## 2. Qué se ha validado realmente
El 27 de octubre de 2026, la ejecución **Deploy frontend VPS** del commit `2d03e3d` terminó con **Success** (aprox. 2 min 38 s): conexión SSH, transferencia del código, construcción/despliegue y comprobación HTTP interna.

Ese resultado confirma el recorrido automatizado básico, **no** constituye una prueba funcional exhaustiva ni garantiza tiempo de actividad externo. Revisar la portada y administración después de cambios importantes.

## 3. Publicación habitual del frontend
1. Trabajar en rama y crear pull request.
2. Esperar a **Frontend CI** y **Docker SSR CI**, y fusionar a `main` una vez aprobados.
3. El evento `workflow_run` de **Frontend CI** en `main` inicia `.github/workflows/deploy-frontend.yml`.
4. GitHub Actions verifica que el commit elegido tiene un **Frontend CI** exitoso, obtiene los secretos del entorno `production`, decodifica y valida la clave privada, empaqueta el checkout sin `.git`, sube el archivo por SCP y ejecuta `scripts/deploy-frontend.sh` vía SSH.
5. El script genera la imagen `consaborflamenco-frontend:auto-<sha12>`, edita las referencias de imagen en Compose, comprueba la configuración efectiva, recrea **solo frontend** y solicita `http://127.0.0.1:4000/` desde el contenedor.
6. Un exit code 0 en el workflow indica que pasó esta comprobación. Si falla tras cambiar Compose, el script **intenta** restaurar la imagen anterior.

Ejecución manual del workflow: <https://github.com/patrigoga/consaborflamenco-frontend/actions/workflows/deploy-frontend.yml> → **Run workflow** → rama `main`. Si GitHub solicita aprobación de entorno, revisarla antes de aprobar.

**No ejecutar `git pull` ni `docker build` manuales en el VPS por cada mejora de Angular.** La acción empaqueta el código desde GitHub y lo envía directamente.

## 4. Configuración SSH
Los secretos se almacenan en el entorno GitHub **production**, no en ficheros del repositorio:
- `CSF_DEPLOY_HOST`: host/IP del VPS.
- `CSF_DEPLOY_KNOWN_HOSTS`: línea pública del host SSH verificada contra la clave del propio servidor.
- `CSF_DEPLOY_SSH_KEY_B64`: clave privada exclusiva de GitHub Actions codificada Base64, no cifrada.

La clave pública correspondiente está autorizada en el usuario `deploy`. El usuario pertenece al grupo `docker` y tiene escritura sobre `compose.yaml` y `compose.override.yaml`. El grupo Docker concede privilegios equivalentes a root: restringir cuidadosamente quién puede modificar `main`, Actions y el entorno `production`; preferir aprobación y protección de rama, y rotar claves ante incidentes.

Nunca imprimir o copiar secretos en logs, commits, issues ni conversaciones. El secreto anterior `CSF_DEPLOY_SSH_KEY` (formato multilínea) fue reemplazado tras fallos `libcrypto`; comprobar si sigue existiendo y retirarlo cuando sea seguro.

## 5. Diagnóstico de incidencias
| Síntoma | Comprobación / acción |
| --- | --- |
| No se inicia workflow | Ver que **Frontend CI** terminó exitoso en `main` y el flujo esté habilitado |
| Falla la verificación CI | Revisar el commit elegido y los jobs de **Frontend CI** |
| Error de clave SSH Base64 | Comprobar nombre del secreto y decodificación; no revelar material privado |
| `Permission denied (publickey)` | Verificar autorización de clave pública y el usuario `deploy` |
| `Host key verification failed` | Comprobar huella pública del VPS y el secreto known_hosts |
| Docker `permission denied` | Verificar pertenencia de `deploy` a `docker` en una sesión SSH nueva |
| Compose apunta a imagen incorrecta | Revisar **ambos** Compose; el override tiene prioridad |
| Fallo compilación | Ver logs del build en Actions; evitar reinicios manuales indiscriminados |
| Falla el healthcheck SSR | Revisar logs frontend, configuración y respuesta interna |
| Workflow en verde pero fallo visible | Hacer comprobación externa y funcional; no basta el HTTP interno |

Para inspección manual, con sesión autorizada en el VPS:
```bash
cd /opt/consaborflamenco
docker compose config --quiet
docker compose ps
docker compose logs --tail=100 frontend
docker inspect consaborflamenco-frontend-1 --format '{{.Config.Image}}'
```

## 6. Recuperación y límites del rollback
El script intenta restaurar la etiqueta de imagen anterior y recrear frontend si falla después de preparar el cambio de Compose. **No es una garantía completa**: no cubre necesariamente un fallo de sistema, permisos, edición parcial de archivos, corte de energía o errores de datos. Tampoco prueba la web desde Internet.

Si fuera necesario recuperar manualmente:
1. Identificar la imagen conocida anterior con `docker images consaborflamenco-frontend` y logs/registro del deploy.
2. Inspeccionar `compose.yaml` y `compose.override.yaml`; apuntar el servicio frontend a la imagen válida, sin cambiar servicios ajenos.
3. Validar con `docker compose config --quiet`.
4. Recrear solo frontend: `docker compose up -d --no-deps --no-build --force-recreate frontend`.
5. Verificar web pública y logs.

No ejecutar `docker compose down -v`, no borrar volúmenes de MySQL o fotografías, y no purgar imágenes de respaldo durante una incidencia.

## 7. Backend y MySQL — procedimiento separado
El despliegue del backend **no está automatizado**. Para una nueva versión:
- Revisar cambios Java y migraciones Flyway (en octubre 2026 se aplicó V6 para portada protagonistas).
- Tomar una copia verificable de MySQL *antes* de cambiar el contenedor; comprobar permisos, espacio y recuperación.
- Compilar con pruebas, desplegar solo backend preservando mounts y variables de entorno; leer logs de Spring Boot/Flyway después del arranque.
- No asumir que "Started" de Docker significa que Spring Boot está sano; confirmar el mensaje de arranque.
- Cualquier rollback que implique migraciones de esquema necesita plan explícito; no basta con volver a una imagen anterior.

## 8. Próximas mejoras recomendadas (pendientes)
- Proteger `main` y `production` con revisiones/aprobaciones según la operativa deseada.
- Comprobar públicamente `https://consaborflamenco.com/` tras el healthcheck interno y monitorizar fallos.
- Reducir privilegios y rotar credenciales SSH de despliegue periódicamente.
- Crear flujo **separado** del backend con backup probado, autorización de migraciones y procedimiento de recuperación.
- Documentar en el repositorio del backend sus variables, volúmenes y operaciones de copia/restauración sin publicar valores secretos.
