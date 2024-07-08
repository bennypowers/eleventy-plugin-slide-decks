import { readdir, readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { load } from 'cheerio';
import { lookup } from 'mime-types';
import { bundle } from './scripts/bundle.js';

/** @import { UserConfig } from '@11ty/eleventy' */

/**
 * @param {string} content HTML content of the page
 * @param {string} selector CSS selector (all) to apply `reveal` attr to
 *
 */
function addRevealAttrs(content, selector) {
  if (!selector) return content;
  const $ = load(content, null, false);
  $(selector).each(function() {
    const closest = $(this).closest('[slot="notes"]');
    if (!closest.length)
      $(this).attr('reveal', '');
  });
  return $.html();
}

const assignMetadata = x => Object.assign(x, {
  deck: x.data.page.filePathStem.split('/').at(2),
  data: Object.assign(x.data, {
    name: x.data.name ?? basename(x.data.page.filePathStem).replace(/^\d+-/, '')
  }),
});

const byInputPath = (a, b) =>
    a.inputPath < b.inputPath ? -1
  : a.inputPath > b.inputPath ? 1
  : 0;

/**
 * @typedef {object} Polyfills
 * @prop {boolean}   [esmoduleShims=false] load the es-module-shims polyfills
 * @prop {boolean}   [webcomponents=false] load the webcomponents polyfills
 * @prop {boolean}   [constructibleStyleSheets=true] load the constructible stylesheets polyfills
 */

/**
 * @typedef {object} EleventyPluginSlideDecksOptions
 * @prop {object}   [templateData={}] extra template data for decks. see decks.html
 * @prop {string}   [decksDir='decks'] directory off the 11ty input dir which contains slides
 * @prop {string[]} [assetsExtensions] file extensions to pass-through copy from the decks dir
 * @prop {Polyfills}[polyfills] which polyfills to load
 * @prop {string}   [target=es2020] esbuild build target when bundling dependencies
 */

/**
 * @param {UserConfig} eleventyConfig
 * @param {EleventyPluginSlideDecksOptions} options Options for the decks
 * Create Slide Decks using eleventy.
 *
 * Create a `decks` dir in your eleventy root to hold your slide decks, one per directory.
 * Each deck dir should contain a template with frontmatter metadata for the deck,
 * and a `slides` dir containing templates for each slide. You must add a `slides` 11ty data file
 * containing `{"permalink":false}`, otherwise your slides will be published individually as well
 * as part of the slide deck.
 * @example
 * ```tree
 * decks
 * └── 11ty-deck
 *     ├── deck-graphic.svg
 *     └── slides
 *         ├── 00-title-card.md
 *         ├── 01-intro.md
 *         ├── 10-code.md
 *         ├── 99-thanks.md
 *         └── slides.json
 * ```
 */
export async function slideDecksPlugin(eleventyConfig, options = {}) {
  const {
    decksDir = 'decks',
    assetsExtensions = [
      'css',
      'jpeg',
      'jpg',
      'js',
      'mp4',
      'png',
      'svg',
      'webp',
    ]
  } = options ?? {};

  const polyfills = options?.polyfills ?? {};
  polyfills.constructibleStyleSheets ??= true;
  polyfills.webcomponents ??= false;
  polyfills.esmoduleShims ??= false;

  eleventyConfig.addGlobalData('polyfills', polyfills);

  eleventyConfig.addFilter('mime', url => lookup(url));
  eleventyConfig.addFilter('trim', str => typeof str === 'string' ? str.trim() : str);
  eleventyConfig.addFilter('stringifyCSSStyle', strOrObj =>
      typeof strOrObj === 'string' ? strOrObj.trim()
    : Object.entries(strOrObj).map(([k, v]) => `${k}:${v}`).join(';'));

  /** Add the `reveal` attribute to all elements matching the selector */
  eleventyConfig.addFilter('reveal', addRevealAttrs);

  eleventyConfig.addFilter('byInputPath', byInputPath);

  for (const ext of assetsExtensions)
    eleventyConfig.addPassthroughCopy(`${decksDir}/**/*.${ext}`);

  /** Get all the slides, sort and assign their deck id */
  eleventyConfig.addCollection('slides', collectionApi => collectionApi
    .getFilteredByGlob(`./${decksDir}/*/slides/*`)
    .map(assignMetadata)
    .sort(byInputPath));

  const templateDir = new URL('./templates/', import.meta.url);
  for (const filename of await readdir(templateDir)) {
    eleventyConfig.addTemplate(
      'deck.html',
      await readFile(new URL(filename, templateDir), 'utf8'),
      {
        ...options?.templateData ?? {},
        layout: false,
        eleventyExcludeFromCollections: ['slides'],
        eleventyImport: {
          collections: ['slides'],
        },
      },
    )
  }

  /** bundle slidem deck dependencies */
  eleventyConfig.on('eleventy.before', bundle.bind(this, eleventyConfig, options));
}

