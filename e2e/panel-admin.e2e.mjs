// Prueba de extremo a extremo del panel: Chromium → Angular → Spring Boot → MySQL.
// SOLO para un entorno local de desarrollo: crea artistas y una cuenta de prueba.
//
//   npx ng serve                      (con el backend en localhost:8080)
//   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run e2e
//
// Requiere un navegador de Playwright: npx playwright install chromium
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4200';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error('Por seguridad esta prueba solo se ejecuta contra localhost: ' + BASE);
  process.exit(2);
}
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASS = process.env.E2E_ADMIN_PASSWORD;
if (!EMAIL || !PASS) { console.error('Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD (administrador principal local).'); process.exit(2); }
const OUT = 'e2e/resultados';
mkdirSync(OUT, { recursive: true });
const SUFIJO = Date.now().toString(36);
const NOMBRE = 'Prueba E2E ' + SUFIJO;
const SLUG = 'prueba-e2e-' + SUFIJO;
const EDITORA = `editora-${SUFIJO}@consabor.test`;

function pngDePrueba(w = 500, h = 620) {
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, Buffer.from([0xcd, 0xa1, 0x5c]))]);
  const datos = deflateSync(Buffer.concat(Array.from({ length: h }, () => fila)));
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([Buffer.from(t), d]))); return Buffer.concat([l, Buffer.from(t), d, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 2, 0, 0, 0], 8);
  return { name: 'foto.png', mimeType: 'image/png', buffer: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', datos), chunk('IEND', Buffer.alloc(0))]) };
}

const b = await chromium.launch(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {});
const res = []; const ok = (c, m) => { res.push((c ? 'OK   ' : 'FALLO') + ' ' + m); };
const ctx = await b.newContext(); const page = await ctx.newPage();
const fallosApi = []; page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) fallosApi.push(r.status() + ' ' + r.url()); });

await page.goto(BASE + '/admin/artistas', { waitUntil: 'networkidle' });
ok(page.url().includes('/admin/login') && page.url().includes('volver='), 'sin sesión /admin/artistas lleva al login recordando la página');
await page.fill('#email', EMAIL); await page.fill('#password', 'incorrecta'); await page.click('button[type=submit]');
await page.waitForSelector('.adm-alerta'); ok(true, 'login con contraseña errónea muestra el error');
const xsrfAntes = (await ctx.cookies()).find(c => c.name === 'XSRF-TOKEN')?.value;
await page.fill('#password', PASS); await page.click('button[type=submit]');
await page.waitForURL('**/admin/artistas'); await page.waitForLoadState('networkidle'); ok(true, 'login correcto vuelve a la página pedida');
for (let i = 0; i < 30 && !(await ctx.cookies()).some(c => c.name === 'XSRF-TOKEN'); i++) await page.waitForTimeout(100);
const cookies = await ctx.cookies();
const ses = cookies.find(c => c.name === 'CSF_SESSION'); const xsrf = cookies.find(c => c.name === 'XSRF-TOKEN');
ok(ses && ses.httpOnly && ses.sameSite === 'Lax', 'cookie de sesión CSF_SESSION HttpOnly y SameSite=Lax');
ok(xsrf && !xsrf.httpOnly && xsrf.value !== xsrfAntes, 'cookie XSRF-TOKEN legible por Angular y rotada al iniciar sesión');

// Crear borrador
await page.goto(BASE + '/admin/artistas/nuevo', { waitUntil: 'networkidle' });
await page.fill('#nombre', NOMBRE); await page.selectOption('#disciplina', 'Cante'); await page.selectOption('#provincia', 'Cádiz');
await page.fill('#biografia', 'Cantaora de prueba.\nSegunda línea.');
await page.click('button[form=ficha-artista]'); await page.waitForURL(/\/admin\/artistas\/\d+$/);
const id = page.url().split('/').pop();
await page.waitForFunction(() => document.querySelector('#slug')?.value);
ok(await page.locator('#slug').inputValue() === SLUG, 'borrador creado con dirección generada ' + SLUG);
let pub = await (await page.request.get(BASE + '/api/v1/artistas/' + SLUG)).status();
ok(pub === 404, 'un borrador no es visible en la API pública');

// Foto
await page.setInputFiles('adm-foto-subida input[type=file]', pngDePrueba());
await page.waitForSelector('.adm-foto__marco img[src^="/media/artistas/"]', { timeout: 15000 });
const src = await page.getAttribute('.adm-foto__marco img', 'src');
const img = await page.request.get(BASE + src);
ok(img.status() === 200 && img.headers()['content-type'].startsWith('image/png'), 'foto subida, recodificada y servida en ' + src);

// Publicar y destacar
await page.click('text=Publicar en la web'); await page.waitForSelector('text=Destacar en portada');
await page.click('text=Destacar en portada'); await page.waitForSelector('text=Quitar de destacados');
const publica = await (await page.request.get(BASE + '/api/v1/artistas?provincia=C%C3%A1diz')).json();
const item = publica.content.find(a => a.slug === SLUG);
ok(item && item.destacado && Object.keys(item).length === 8 && item.fotoUrl === src, 'publicado y destacado: aparece en la API pública con sus 8 campos');
await page.screenshot({ path: OUT + '/e2e-ficha.png', fullPage: true });

// Token CSRF perdido: el interceptor pide otro y reintenta
await ctx.clearCookies({ name: 'XSRF-TOKEN' });
await page.click('text=Quitar de destacados'); await page.waitForSelector('text=Destacar en portada', { timeout: 10000 });
ok(true, 'sin cookie XSRF la escritura se recupera sola (Spring 403 CSRF → nuevo token → reintento)');
// Se vuelve a destacar para que salga en la portada (que muestra primero los destacados).
await page.click('text=Destacar en portada'); await page.waitForSelector('text=Quitar de destacados');

// Escritura forjada sin cabecera CSRF desde la propia sesión
const forjada = await page.request.post(BASE + '/api/v1/admin/artistas/' + id + '/archivar');
ok(forjada.status() === 403, 'POST con la cookie de sesión pero sin cabecera X-XSRF-TOKEN → 403');

// Portada pública
await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
ok((await page.textContent('#artistas')).includes(NOMBRE), 'la portada pública muestra el artista publicado');

// Archivar con el diálogo
await page.goto(BASE + '/admin/artistas/' + id, { waitUntil: 'networkidle' });
await page.click('text=Archivar artista'); await page.waitForSelector('dialog[open]');
await page.screenshot({ path: OUT + '/e2e-dialogo.png' });
await page.locator('dialog[open]').getByRole('button', { name: 'Archivar', exact: true }).click(); await page.waitForSelector('text=Restaurar como borrador');
pub = await (await page.request.get(BASE + '/api/v1/artistas/' + SLUG)).status();
ok(pub === 404, 'archivado: desaparece de la API pública');
await page.click('text=Restaurar como borrador'); await page.waitForSelector('text=Publicar en la web');
ok(true, 'restaurado como borrador');

// Cuentas: crear editora, entrar con ella y revocarla
await page.goto(BASE + '/admin/cuentas', { waitUntil: 'networkidle' });
await page.fill('#u-nombre', 'Editora'); await page.fill('#u-email', EDITORA); await page.click('text=Crear cuenta');
const temporal = (await page.textContent('.adm-codigo', { timeout: 10000 })).trim();
ok(/^[a-zA-Z2-9]{5}(-[a-zA-Z2-9]{5}){3}$/.test(temporal), 'cuenta creada con contraseña temporal generada en el navegador');
const ctx2 = await b.newContext(); const p2 = await ctx2.newPage();
await p2.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
await p2.fill('#email', EDITORA); await p2.fill('#password', temporal); await p2.click('button[type=submit]');
await p2.waitForURL(BASE + '/admin');
ok(await p2.locator('text=Cuentas de acceso').count() === 0, 'la editora no ve la gestión de cuentas');
await p2.goto(BASE + '/admin/cuentas', { waitUntil: 'networkidle' });
ok(p2.url() === BASE + '/admin', 'y no puede entrar en /admin/cuentas');
ok((await p2.request.get(BASE + '/api/v1/admin/usuarios')).status() === 403, 'la API de cuentas le devuelve 403');
await page.reload({ waitUntil: 'networkidle' });
await page.locator('.adm-cuentas__fila', { hasText: EDITORA }).getByRole('button', { name: 'Desactivar', exact: true }).click();
await page.locator('dialog[open]').getByRole('button', { name: 'Desactivar', exact: true }).click(); await page.waitForSelector('text=Desactivada');
await p2.goto(BASE + '/admin/artistas', { waitUntil: 'networkidle' }); await p2.waitForTimeout(500);
ok(p2.url().includes('/admin/login'), 'al desactivarla, su sesión abierta queda expulsada al momento');

// Logout
await page.click('text=Cerrar sesión'); await page.waitForURL('**/admin/login');
ok((await page.request.get(BASE + '/api/v1/admin/auth/sesion')).status() === 401, 'tras cerrar sesión la API devuelve 401');
ok(fallosApi.length === 0, 'ningún error 5xx de la API' + (fallosApi.length ? ': ' + fallosApi.join(', ') : ''));
console.log(res.join('\n'));
const fallos = res.filter(r => r.startsWith('FALLO')).length;
console.log(`\n${res.length - fallos} correctas, ${fallos} fallidas`);
await b.close();
process.exit(fallos ? 1 : 0);
