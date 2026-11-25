import { timingSafeEqual } from 'node:crypto';

export function requiresWallAdmin(operation, method) {
  return (operation === 'settings' && method === 'PUT') || (operation === 'comments' && method === 'DELETE');
}

export function wallAdminError(authorization, secret) {
  if (!secret) return { status: 503, error: 'Set FONDAYO_ADMIN_TOKEN on the server to enable changes.' };
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(authorization ?? '');
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { status: 401, error: 'Enter the correct settings access key.' };
  }
}

export async function readWallBody(body, contentType) {
  if (!/^application\/json(?:\s*;|$)/i.test(contentType ?? '')) {
    return { status: 415, error: 'Send JSON to this endpoint.' };
  }
  if (!body) return { status: 400, error: 'Invalid request.' };
  const chunks = [];
  let size = 0;
  for await (const chunk of body) {
    size += chunk.length;
    if (size <= 4096) chunks.push(chunk);
  }
  if (size > 4096) return { status: 413, error: 'This request is too large.' };
  try {
    return { input: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch {
    return { status: 400, error: 'Invalid request.' };
  }
}
