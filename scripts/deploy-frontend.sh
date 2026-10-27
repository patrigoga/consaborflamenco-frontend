#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=/opt/consaborflamenco
REV="${1:?Se necesita el SHA del commit}"
[[ "$REV" =~ ^[a-f0-9]{40}$ ]] || { echo "SHA no válido" >&2; exit 2; }
cd "$ROOT"
ARCHIVE="/tmp/csf-frontend-${REV}.tgz"
[[ -f "$ARCHIVE" ]] || { echo "Falta el código empaquetado" >&2; exit 2; }
BUILD_DIR="$(mktemp -d /tmp/csf-frontend-build.XXXXXX)"
trap 'rm -rf "$BUILD_DIR"; rm -f "$ARCHIVE"' EXIT
tar -xzf "$ARCHIVE" -C "$BUILD_DIR"

NEW_IMAGE="consaborflamenco-frontend:auto-${REV:0:12}"
OLD_IMAGE="$(sudo docker inspect consaborflamenco-frontend-1 --format '{{.Config.Image}}')"
echo "Construyendo $NEW_IMAGE"
sudo docker build -t "$NEW_IMAGE" "$BUILD_DIR"

# Editar exclusivamente la sección frontend y respetar cualquier override de Compose.
FILES=(compose.yaml)
[[ ! -f compose.override.yaml ]] || FILES+=(compose.override.yaml)
update_image() {
  local target="$1" file
  for file in "${FILES[@]}"; do
    if grep -qE '^[[:space:]]*image:[[:space:]]*consaborflamenco-frontend:' "$file"; then
      sed -i -E "s|^([[:space:]]*image:[[:space:]]*)consaborflamenco-frontend:[^[:space:]]+|\\1$target|" "$file"
    fi
  done
}
restore() {
  echo "Error de despliegue. Recuperando $OLD_IMAGE"
  update_image "$OLD_IMAGE"
  sudo docker compose up -d --no-deps --no-build --force-recreate frontend || true
}
trap restore ERR
update_image "$NEW_IMAGE"
sudo docker compose config --quiet
EFFECTIVE="$(sudo docker compose config --format json | python3 -c 'import json,sys;print(json.load(sys.stdin)["services"]["frontend"]["image"])')"
[[ "$EFFECTIVE" == "$NEW_IMAGE" ]] || { echo "Compose apunta a $EFFECTIVE, no a $NEW_IMAGE" >&2; false; }
sudo docker compose up -d --no-deps --no-build --force-recreate frontend

OK=0
for n in {1..12}; do
  if sudo docker compose exec -T frontend node -e "fetch('http://127.0.0.1:4000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then OK=1; break; fi
  sleep 4
done
[[ "$OK" == 1 ]] || { echo "Angular SSR no respondió" >&2; false; }
trap - ERR
echo "Despliegue verificado: $NEW_IMAGE"
