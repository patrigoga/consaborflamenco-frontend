// Servidor local del build SSR para pruebas, también en Windows.
import { createServer } from 'node:http';
import { reqHandler } from '../dist/consaborflamenco/server/server.mjs';

createServer(reqHandler).listen(4200, '127.0.0.1', () => console.log('Frontend de prueba: http://localhost:4200'));
