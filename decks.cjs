const fs = require('node:fs/promises');
const path = require('node:path');
const cheerio = require('cheerio');
const mime = require('mime-types');

/**
 * @param {string} content HTML content of the page
 * @param {string} selector CSS selector (all) to apply `reveal` attr to
 *
 */
function addRevealAttrs(content, selector) {
  if (!selector) return content;
  const $ = cheerio.load(content, null, false);
  $(selector).each(function() {
    const closest = $(this).closest('[slot="notes"]');
    if (!closest.length)
      $(this).attr('reveal', '');
  });
  return $.html();
}

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} _eleventyConfig
 * @param {EleventyPluginSlideDecksOptions} _options Options for the decks
 * @param {*} outputOpts
 */
async function copyDeckLayout(_eleventyConfig, _options, { dir }) {
  const INPUT = path.join(__dirname, 'templates', 'deck.html');
  const OUTPUT = path.join(process.cwd(), dir.includes, 'deck.html');
  await fs.cp(INPUT, OUTPUT, {force: true});
}

/**
 * Bundle Slidem deck dependencies
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {EleventyPluginSlideDecksOptions} options Options for the decks
 */
const bundleSlidemDependencies = async (eleventyConfig, options) =>
  import('./scripts/bundle.js')
    .then(m => m.bundle(eleventyConfig, options));

const assignMetadata = x => Object.assign(x, {
  deck: x.data.page.filePathStem.split('/').at(2),
  data: Object.assign(x.data, {
    name: x.data.name ?? path.basename(x.data.page.filePathStem).replace(/^\d+-/, '')
  }),
});

const byInputPath = (a, b) =>
    a.inputPath < b.inputPath ? -1
  : a.inputPath > b.inputPath ? 1
  : 0;

/**
 * @typedef {object} EleventyPluginSlideDecksOptions
 * @prop {string}   [decksDir='decks'] directory off the 11ty input dir which contains slides
 * @prop {string[]} [assetsExtensions] file extensions to pass-through copy from the decks dir
 */

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
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
module.exports = function decksPlugin(eleventyConfig, options) {
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

  eleventyConfig.addFilter('mime', url => mime.lookup(url));
  eleventyConfig.addFilter('trim', str => typeof str === 'string' ? str.trim() : str);

  eleventyConfig.addFilter('decksTemplate', async p =>
    fs.readFile(path.join(__dirname, 'templates', p), 'utf-8'));

  /** Add the `reveal` attribute to all elements matching the selector */
  eleventyConfig.addFilter('reveal', addRevealAttrs);

  for (const ext of assetsExtensions)
    eleventyConfig.addPassthroughCopy(`${decksDir}/**/*.${ext}`);

  /** Get all the slides, sort and assign their deck id */
  eleventyConfig.addCollection('slides', collectionApi => collectionApi
    .getFilteredByGlob(`./${decksDir}/*/slides/*`)
    .map(assignMetadata)
    .sort(byInputPath));

  eleventyConfig.on('eleventy.before', copyDeckLayout.bind(this, eleventyConfig, options));

  /** bundle slidem deck dependencies */
  eleventyConfig.on('eleventy.before', bundleSlidemDependencies.bind(this, eleventyConfig, options));
}
