import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
await Promise.all([
  cp(new URL('public/', root), output, { recursive: true }),
  cp(new URL('design/', root), new URL('design/', output), { recursive: true }),
  cp(new URL('Fonts/', root), new URL('Fonts/', output), { recursive: true })
]);
const index = new URL('index.html', output);
const html = await readFile(index, 'utf8');
await writeFile(index, html.replace('<head>', '<head>\n  <meta name="wall-transport" content="poll">'));
console.log('Vercel static files built in dist.');
