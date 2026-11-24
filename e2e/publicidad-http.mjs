import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { reqHandler } from '../dist/consaborflamenco/server/server.mjs';

const servidor = createServer(reqHandler);
servidor.listen(0, 'localhost');
await once(servidor, 'listening');
const base = `http://localhost:${servidor.address().port}`;
try {
  const publicidad = await fetch(base + '/promocion');
  assert.equal(publicidad.status, 200, 'El acceso directo a publicidad debe responder HTTP 200');
  const html = await publicidad.text();
  assert.match(html, /Promociona tu arte o negocio/);
  assert.match(html, /app-root/);
  const script = html.match(/<script src="([^"]*main[^"<]*\.js)"/);
  assert.ok(script, 'El HTML debe incluir su bundle principal');
  assert.equal((await fetch(new URL(script[1], base))).status, 200);
  assert.equal((await fetch(base + '/admin/promocion')).status, 200, 'El panel debe servir el shell de acceso');
  assert.equal((await fetch(base + '/pagina-inexistente-prueba-publicidad')).status, 404);
  console.log('Publicidad SSR: página HTTP 200, bundle disponible, panel HTTP 200 y página inexistente HTTP 404.');
} finally {
  servidor.closeAllConnections();
  await new Promise((resolve, reject) => servidor.close(error => error ? reject(error) : resolve()));
}
