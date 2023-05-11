import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { minifyHTMLLiteralsPlugin } from 'esbuild-plugin-minify-html-literals'

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {EleventyPluginSlideDecksOptions} [options] Options for the decks
 */
export async function bundle(eleventyConfig, options) {
  const start = performance.now();
  const prefix = '[eleventy-plugin-slide-decks]:';

  const {
    outfile = '_site/assets/decks.min.js',
    target = 'es2020',
  } = options ?? {};

  eleventyConfig.logger.info(`${prefix} bundling with esbuild`);

  await build({
    outfile,
    entryPoints: [fileURLToPath(new URL('./components.js', import.meta.url))],
    format: 'esm',
    target: 'es2022',
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

  const seconds = ((performance.now() - start) / 1000).toFixed(2);

  eleventyConfig.logger.info(`${prefix}   ...done bundling in ${seconds}s`);
}
