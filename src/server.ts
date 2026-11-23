import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
const app = express();
const engine = new AngularNodeAppEngine();
// El documento HTML siempre se revalida: evita enlazar a bundles antiguos
// después de desplegar otra versión. Los JS/CSS hasheados siguen cacheándose.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }
  next();
});
// El panel nunca debe indexarse, ni siquiera su HTML vacío.
app.use('/admin', (_req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Cache-Control', 'no-store'); next(); });
app.use(express.static(join(import.meta.dirname, '../browser'), {
  maxAge: '1y', immutable: true, index: false, redirect: false
}));
app.use((req, res, next) => { engine.handle(req).then(response => response ? writeResponseToNodeResponse(response, res) : next()).catch(next); });
if (isMainModule(import.meta.url)) { app.listen(Number(process.env['PORT'] || 4000)); }
export const reqHandler = createNodeRequestHandler(app);
