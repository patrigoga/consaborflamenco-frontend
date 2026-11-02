# Perfiles de artistas · diseño y frontend

## Alcance de esta fase

- Las tarjetas con artistas reales del inicio y de `/revista/artistas` abren `/revista/artistas/:slug`.
- La ficha consulta únicamente el GET público existente `/api/v1/artistas/{slug}`. Muestra identidad, fotografía y biografía; no añade colecciones ficticias a los datos reales.
- El renderizado de servidor usa el origen fijo `https://consaborflamenco.com`, un límite de seis segundos y estado de transferencia para evitar repetir la consulta al arrancar el navegador. Conserva el HTTP 404 de artistas no publicados y usa 503 si falla el servicio. No se pasan credenciales de administración.
- La ficha genera título, descripción y canónica propios. Los errores y la demostración no se indexan.
- `/vista-previa/artista` permite revisar la ficha completa y un editor con seis pestañas: perfil, imágenes, vídeos, discografía, actuaciones y redes/contacto. Es una demostración abierta, sin autenticación, con datos explícitamente ficticios.
- Las imágenes elegidas se leen en memoria, nunca se suben. Aplicar muestra los cambios únicamente en esa pestaña; recargar restablece el ejemplo. No hay localStorage, autosalvado ni escrituras en la API.
- Los vídeos de YouTube solo conectan con el reproductor de `youtube-nocookie.com` tras una acción del visitante; se valida el identificador. No se cargan miniaturas de YouTube por adelantado.
- No se han modificado el backend, sus permisos, el registro, Google OAuth, las cuentas administrativas ni los textos legales. La demostración no habilita cuentas de artistas.

## Diseño adaptable

Portada panorámica con degradados, tipografía editorial, fondo carbón y acentos dorados, en continuidad con el inicio. La galería se amplía mediante un diálogo con cierre por botón, fondo y Escape. Secciones públicas opcionales: si no hay discos, vídeos o agenda, no se muestran pestañas vacías.

En escritorio el editor usa navegación lateral; en tablet reduce el ancho lateral; en móvil usa navegación horizontal y formularios a una columna. Se prueban 1440, 820, 390 y 320 px, sin desbordamientos de página y con controles de al menos 44 px. No hay acciones disponibles solo al pasar el ratón.

## Siguiente fase de backend (pendiente de autorización)

1. Sesión profesional propia y vínculo usuario–artista. Autorizar cada escritura en el servidor por propietario, sin otorgar roles administrativos.
2. Colecciones de imágenes con posición, descripción y créditos; vídeos con identificador YouTube; lanzamientos con portada, año y enlace; actuaciones con fecha/hora/zona, sala, ciudad y estado; enlaces oficiales.
3. Guardar borrador y publicar con validación y moderación; separar cambios privados de datos publicados. Subidas con límites, comprobación del contenido, tratamiento de imágenes y gestión de derechos.
4. Aplicar validación de enlaces en el servidor, gestión de errores y conflictos y pruebas que demuestren que un artista no puede editar otro perfil.
5. Conectar el editor real solo cuando existan las operaciones y permisos anteriores. Mantener pendiente el alta pública hasta completar autenticación y documentación legal.

## Validación

`npm run test:ci -- --runInBand` y `npm run build`.

Para las comprobaciones visuales, ejecutar `npm run serve:e2e` y después `npm run e2e:perfiles`. El servidor de prueba enlaza exclusivamente con 127.0.0.1:4200 y evita las diferencias de ruta de `isMainModule` de Angular en Windows. Opcionalmente definir `E2E_CHANNEL=msedge` o usar Chromium instalado por Playwright. El ensayo solo admite localhost, simula todos los endpoints de la API y verifica que no se envía ninguna escritura. Las capturas se guardan en `e2e/resultados/perfiles/` (ignorado por Git).
