import { copyFile } from 'node:fs/promises';
import { build } from 'esbuild';

await build({
  entryPoints: ['client/main.tsx'],
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  target: 'es2022',
  minify: true,
  outfile: 'dist/client/app.js',
});

await copyFile('client/index.html', 'dist/client/index.html');
