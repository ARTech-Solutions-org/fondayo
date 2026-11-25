import { timingSafeEqual } from 'node:crypto';
import { readWallBody } from '../lib/http.mjs';
import { createNeonStore } from '../lib/neon-store.mjs';
import { operateWall } from '../lib/wall.mjs';

const headers = { 'Cache-Control': 'no-store' };
let transact;

function json(status, value) {
  return Response.json(value, { status, headers });
}

function authorized(request, secret) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export default {
  async fetch(request) {
    const operation = new URL(request.url).searchParams.get('operation');
    if (!['settings', 'comments', 'writing', 'state'].includes(operation)) {
      return json(404, { error: 'Page not found.' });
    }
    if (operation === 'settings' && request.method === 'PUT') {
      const secret = process.env.FONDAYO_ADMIN_TOKEN;
      if (!secret) return json(503, { error: 'Set FONDAYO_ADMIN_TOKEN on the server to enable changes.' });
      if (!authorized(request, secret)) return json(401, { error: 'Enter the correct settings access key.' });
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return json(503, { error: 'Connect a Neon database to the deployment first.' });

    let input;
    if (request.method === 'POST' || request.method === 'PUT') {
      const parsed = await readWallBody(request.body, request.headers.get('content-type'));
      if (parsed.error) return json(parsed.status, { error: parsed.error });
      input = parsed.input;
    }
    try {
      transact ??= createNeonStore(databaseUrl);
      const result = await transact(state => operateWall(state, operation, request.method, input, Date.now(), 1100));
      if (result.status === 204) return new Response(null, { status: 204, headers });
      const body = operation === 'settings' && result.status === 200
        ? { ...result.body, adminRequired: true } : result.body;
      return json(result.status, body);
    } catch (error) {
      console.error('Wall operation failed:', error.name, error.code ?? '');
      return json(503, { error: 'The wall database is unavailable. Try again in a moment.' });
    }
  }
};
