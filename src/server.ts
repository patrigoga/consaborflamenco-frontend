import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
const app = express();
const engine = new AngularNodeAppEngine();
app.use(express.static(join(import.meta.dirname, '../browser'), { maxAge: '1y', index: false }));
app.use((req, res, next) => { engine.handle(req).then(response => response ? writeResponseToNodeResponse(response, res) : next()).catch(next); });
if (isMainModule(import.meta.url)) { app.listen(Number(process.env['PORT'] || 4000)); }
export const reqHandler = createNodeRequestHandler(app);
