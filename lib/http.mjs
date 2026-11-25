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
