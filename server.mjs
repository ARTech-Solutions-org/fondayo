import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname } from 'node:path';
import { readWallBody } from './lib/http.mjs';
import { advanceWall, createWallState, operateWall, wallSnapshot } from './lib/wall.mjs';

const port = Number(process.argv[2] ?? 8080);
const databaseUrl = process.env.DATABASE_URL;
const stateFile = new URL('.fondayo-state.json', import.meta.url);
const temporaryStateFile = new URL('.fondayo-state.tmp', import.meta.url);
const clients = new Set();

async function readLocalJson(name) {
  try {
    return JSON.parse(await readFile(new URL(name, import.meta.url), 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) console.warn('Could not read ' + name);
    else if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

let state = await readLocalJson('.fondayo-state.json');
if (!state) {
  const [settings, comments] = await Promise.all([
    readLocalJson('.display-settings.json'),
    readLocalJson('.display-comments.json')
  ]);
  state = createWallState(settings, comments);
}
const cloudTransaction = databaseUrl
  ? (await import('./lib/neon-store.mjs')).createNeonStore(databaseUrl, {
      initialState: createWallState(state.config, state.queue)
    })
  : null;
const synchronizationMs = cloudTransaction ? 1100 : 0;
const cloudPage = cloudTransaction
  ? (await readFile(new URL('public/index.html', import.meta.url), 'utf8'))
      .replace('<head>', '<head>\n  <meta name="wall-transport" content="poll">')
  : null;

function event() {
  return 'data: ' + JSON.stringify(wallSnapshot(state, Date.now())) + '\n\n';
}

function broadcast() {
  const update = event();
  for (const client of clients) {
    if (!client.write(update)) client.destroy();
  }
}

let operations = Promise.resolve();
function transactLocal(action) {
  const result = operations.then(async () => {
    const draft = structuredClone(state);
    const before = JSON.stringify(draft);
    const value = action(draft);
    const after = JSON.stringify(draft);
    if (after !== before) {
      await writeFile(temporaryStateFile, after, 'utf8');
      await rename(temporaryStateFile, stateFile);
      state = draft;
      broadcast();
    }
    return value;
  });
  operations = result.catch(() => {});
  return result;
}
const transact = cloudTransaction ?? transactLocal;

if (!cloudTransaction) {
  setInterval(broadcast, 5000).unref();
  let advancing = false;
  setInterval(() => {
    if (advancing || (state.activeGroup === null && !state.queue.some(comment => comment.compactAt > Date.now()))) return;
    advancing = true;
    transact(draft => advanceWall(draft, Date.now(), 0))
      .catch(error => console.error('Could not update wall state:', error))
      .finally(() => { advancing = false; });
  }, 100).unref();
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf'
};

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(value === undefined ? undefined : JSON.stringify(value));
}

async function serve(request, response) {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (path === '/favicon.ico') return response.writeHead(204).end();
  if (path === '/api/events' && request.method === 'GET') {
    if (cloudTransaction) return json(response, 409, { error: 'Reload the display to use the Neon connection.' });
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    response.write(event());
    clients.add(response);
    response.on('close', () => clients.delete(response));
    return;
  }
  const operation = path.match(/^\/api\/(settings|comments|writing|state)$/)?.[1];
  if (operation) {
    let input;
    if (request.method === 'POST' || request.method === 'PUT') {
      const parsed = await readWallBody(request, request.headers['content-type']);
      if (parsed.error) return json(response, parsed.status, { error: parsed.error });
      input = parsed.input;
    }
    const result = await transact(draft => operateWall(draft, operation, request.method, input, Date.now(), synchronizationMs));
    return json(response, result.status, result.body);
  }
  if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405).end();

  let file;
  if (/^\/(?:(?:tablet(?:\/[1-9]\d?)?|wall|settings)\/?|screen\/[1-3]\/?|)$/.test(path)) file = 'public/index.html';
  if (cloudPage && file === 'public/index.html') {
    response.writeHead(200, { 'Content-Type': mime['.html'], 'Cache-Control': 'no-cache' });
    return response.end(request.method === 'HEAD' ? undefined : cloudPage);
  }
  if (/^\/(?:app\.js|scenes\.js|comment-layout\.js|settings\.js|styles\.css|media\/post-[1-6]\.webp|media\/comment-(?:frame|heart)-[1-6]\.png)$/.test(path)) file = `public${path}`;
  if (/^\/Fonts\/[\w-]+\.(otf|ttf)$/i.test(path)) file = path.slice(1);
  if (/^\/design\/design\/(?:tablet|post1\/screen[1-6]|screen sever post 1\/screen-saver[1-3])\/Asset \d+\.png$/.test(path)) {
    file = path.slice(1);
  }
  if (!file) return response.writeHead(404).end('Page not found');
  const url = new URL(file, import.meta.url);
  let size;
  try {
    size = (await stat(url)).size;
  } catch (error) {
    if (error.code === 'ENOENT') return response.writeHead(404).end('File not found');
    throw error;
  }
  response.writeHead(200, {
    'Content-Type': mime[extname(file).toLowerCase()],
    'Content-Length': size,
    'Cache-Control': /\.(?:png|webp|otf|ttf)$/i.test(file) ? 'public, max-age=3600' : 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') return response.end();
  const stream = createReadStream(url);
  stream.on('error', () => response.destroy());
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}

createServer((request, response) => {
  serve(request, response).catch(error => {
    if (response.headersSent || response.destroyed) return response.destroy();
    if (error instanceof URIError) return response.writeHead(400).end('Invalid URL');
    console.error('Wall request failed:', error.name, error.code ?? '');
    json(response, 500, { error: 'The server could not process the request. Try again.' });
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Foundayo · http://localhost:${port}`);
  if (cloudTransaction) console.log('Storage · Neon Postgres');
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) console.log(`LAN · http://${entry.address}:${port}`);
    }
  }
});
