import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { minifyHTMLLiteralsPlugin } from 'esbuild-plugin-minify-html-literals'

const deps = new URL('./components.js', import.meta.url);

export async function bundle(eleventyConfig, options) {
  const start = performance.now();

  const { outfile = '_site/assets/decks.min.js', } = options ?? {};

  eleventyConfig.logger.info('[eleventy-plugin-slide-decks]: bundling with esbuild');

  await build({
    outfile,
    entryPoints: [fileURLToPath(new URL('./components.js', import.meta.url))],
    format: 'esm',
    bundle: true,
    minifySyntax: true,
    minifyWhitespace: true,
    mangleQuoted: false,
    legalComments: 'linked',
    plugins: [
      minifyHTMLLiteralsPlugin({
        minifyOptions: {
          removeComments: true,
          minifyCSS: true,
        },
      })
    ],
  });

  const d = (performance.now() - start) / 1000;
  eleventyConfig.logger.info(`[eleventy-plugin-slide-decks]:   ...done bundling in ${d.toFixed(2)}s`);
}
