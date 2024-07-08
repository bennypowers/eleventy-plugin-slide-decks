export * from 'slidem/slidem-deck.js';
export * from 'slidem/slidem-slide.js';
export * from 'slidem/slidem-video-slide.js';

import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

const deck =
  /** @type {import('slidem/slidem-deck.js').SlidemDeck} */
  (document.querySelector('slidem-deck'));

const progress =
  /** @type {import('@shoelace-style/shoelace').SlProgressBar} */
  (document.getElementById('slides-progress'));

/** @param {Event} event */
function isInputEvent(event) {
  return event
    .composedPath()
    .some(/** @param {HTMLElement} x*/ x => (
         x.contentEditable === 'true'
      || x instanceof HTMLInputElement
      || x instanceof HTMLTextAreaElement
    ))
}

document.body.addEventListener('keydown', event => {
  // If event already processed, or if the event happens within an editor,
  if (event.defaultPrevented || isInputEvent(event))
    return;
  switch (event.key) {
    case 'f':
      if (document.fullscreenElement)
        document.exitFullscreen();
      else
        document.body.requestFullscreen();
      return true;
    default:
      return true;
  }
});

deck.addEventListener('change', event => {
  const curr = deck.currentSlideIndex + 1;
  const total = deck.slides.length;
  const oneSlide = (1 / total) * 100;
  const { steps, step } =
    /** @type {import('slidem/slidem-slide.js').SlidemSlide} */(deck.currentSlide);
  // Add in a fraction of one slide's worth of progress, if there are slide steps
  const stepProgress = steps <= 1 ? 0 : (((step / steps) * oneSlide) - oneSlide);
  const percentage = ((curr / total) * 100);
  progress.value = percentage + stepProgress;
});

(async () => {
  await customElements.whenDefined('slidem-deck');
  progress.indeterminate = false;
})();
