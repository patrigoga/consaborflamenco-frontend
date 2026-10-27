#!/usr/bin/env bash
set -Eeuo pipefail

# Ejecutar desde el VPS. También acepta un SHA de GitHub para un despliegue reproducible.
ROOT=/opt/consaborflamenco
cd "$ROOT"
NEW_REF="${1:-main}"
cd frontend
git fetch origin main
if [[ "$NEW_REF" == "main" ]]; then
  git checkout main
  git pull --ff-only origin main
else
  # Solo SHA hexadecimal; no aceptar expresiones arbitrarias.
  [[ "$NEW_REF" =~ ^[a-f0-9]{40}$ ]] || { echo "SHA inválido" >&2; exit 2; }
  git checkout --detach "$NEW_REF"
fi
REV="$(git rev-parse --short=12 HEAD)"
cd "$ROOT"
NEW_IMAGE="consaborflamenco-frontend:auto-${REV}"
OLD_IMAGE="$(sudo docker inspect consaborflamenco-frontend-1 --format '{{.Config.Image}}')"
echo "Desplegando $NEW_IMAGE; anterior: $OLD_IMAGE"

sudo docker build -t "$NEW_IMAGE" ./frontend

# El frontend se define en compose.yaml; un posible override tiene prioridad.
FILES=(compose.yaml)
if [[ -f compose.override.yaml ]]; then FILES+=(compose.override.yaml); fi
for file in "${FILES[@]}"; do
  if grep -qE '^[[:space:]]*image:[[:space:]]*consaborflamenco-frontend:' "$file"; then
    sed -i -E "s|^([[:space:]]*image:[[:space:]]*)consaborflamenco-frontend:[^[:space:]]+|\\1$NEW_IMAGE|" "$file"
  fi
done

restore() {
  echo "Falló el despliegue; restaurando $OLD_IMAGE"
  for file in "${FILES[@]}"; do
    sed -i -E "s|^([[:space:]]*image:[[:space:]]*)consaborflamenco-frontend:[^[:space:]]+|\\1$OLD_IMAGE|" "$file"
  done
  sudo docker compose up -d --no-deps --no-build --force-recreate frontend || true
}
trap restore ERR
sudo docker compose config --quiet
sudo docker compose up -d --no-deps --no-build --force-recreate frontend

# Comprobar respuesta HTTP de Angular SSR antes de declarar éxito.
OK=0
for n in 1 2 3 4 5 6 7 8 9 10; do
  if sudo docker compose exec -T frontend node -e "fetch('http://127.0.0.1:4000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    OK=1; break
  fi
  sleep 3
done
if [[ "$OK" != 1 ]]; then false; fi
trap - ERR
echo "Frontend operativo: $NEW_IMAGE"
