# eleventy-plugin-slide-decks

🎼 It makes an *itsy-bitsy*, *teeny-weeny*, *web-component* slide deck prezzy, 
which is basically a small SPA. 🎵

🎚️ Write slide decks with [eleventy](https://11ty.dev) and share them over the 
web. 🎴

Uses [`<slidem-deck>`](https://github.com/ruphin/slidem) to do most of the work 
for you.

## Installation and Setup

```
npm i eleventy-plugin-slide-decks
echo "_includes/deck.html" >> .gitignore
```

Then in your 11ty config:

```js
const DecksPlugin = require('eleventy-plugin-slide-decks');
eleventyConfig.addPlugin(DecksPlugin);
```

## Writing Decks

Create a `decks` directory in your 11ty source root (or use `decksDir` option).
Each slide deck is a single dir under the `decksDir`. Add an 11ty data file for 
each deck or for all decks.
You must add a single template to each deck's root dir, containing frontmatter 
for that deck. At minimum, that file should have `layout: deck.html` and  `deck: 
deckdir`. For example, if you have a deck in `decks/prezzo`, you must at very
least create `decks/prezzo/prezzo.md` with this content:

```md
---
layout: deck.html
deck: prezzo
---
```

Optional frontmatter keys:
```yaml
title: Slide deck title
author: slide deck author (used in open graph tags)
description: meta description (and og)
lang: en # default
dir: ltr # default
date: 2022-12-02
locale: en-US # default
origin: https://bennypowers.dev # slide deck origin (used in og:url)
coverImage: prezzo.png # used in open graph tags
icons:
  - rel: icon # required
    href: /assets/images/favicon.ico?v=2 # required
  - rel: shortcut icon
    href: /assets/icon.svg
  - rel: apple-touch-icon
    sizes: 72x72
    href: /assets/images/manifest/icon-72x72.png
preconnect:
  - https://fonts.googleapis.com
stylesheets:
  - href: /optional/urls/to/stylesheets.css
    async: true # optional
    media: 'screen and (prefers-color-scheme: dark)' # optional
scripts:
  - src: prezzo.js
    type: module
```

All urls are passed through the `url` filter for you.

It's possible to put content in this file, but you should expect that content to 
be invisible, for example, you can put an SVG sprite sheet in there:

```html
<svg id="icons">
  <defs>{% for icon in collections.icon %}
    <g id="{{ icon.fileSlug }}-icon" aria-label="{{ icon.data.title }}">{{ icon.templateContent | safe }}</g>{% endfor %}
  </defs>
</svg>
```

### Writing Slides

Each decks slides are located in it's `slides` directory, and ordered by name. 
It's recommended to name the slide files `00-first-slide.md`, 
`10-second-slide.md`, etc. You should also add an 11ty data file for the slides 
directory containing `permalink: false`, in order to prevent 11ty from rendering 
individual HTML pages for each slide, which would only duplicate the slide 
content.

So for example:

```
decks
├── decks.json
└── prezzo
    ├── img.png
    ├── prezo.css
    ├── prezzo.md
    └── slides
        ├── 00-first-slide.md
        ├── 10-second-slide.md
        ├── 99-last-slide.md
        └── slides.json
```

#### Stepping Through Slide Content

If you want certain elements of a slide to reveal one by one, specify a CSS 
selector in the `reveal` frontmatter key. Take for example this slide:

~~~md
---
reveal: li, img
---
## Using Slidem

- HTML wins
- JavaScript is p. cool too

![a satisfied and productive slide author](img.png)
~~~

When switching to this slide, on step 1 only the heading will be visible, on 
step 2 the first list item ("HTML wins") will appear, on step 3, the next list 
item, and on step 4, the image.

#### Styling Slides

Slides get the `name` attribute based on their filename, so `00-first-slide.md` 
would render as `<slide-slide name="first-slide">`. You can then style that 
slide with good-old CSS. Each slide exposes `container` and `content` [CSS 
Shadow Parts](https://developer.mozilla.org/en-US/docs/Web/CSS/::part):

```css
[name=first-slide] {
  background: hotpink;
}

[name=first-slide]::part(content) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
}
```

## Options

| option             | type     | default   | description                                             |
| ------------------ | -------- | --------- | ------------------------------------------------------- |
| `decksDir`         | string   | 'decks'   | directory off the 11ty input dir which contains slides  |
| `assetsExtensions` | string[] | see below | file extensions to pass-through copy from the decks dir |

By default, files matching `decks/**/*.{css|jpeg|jpg|js|mp4|png|svg|webp}` will 
passthrough copy to the output dir.
