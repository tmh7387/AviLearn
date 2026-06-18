/**
 * Slide Utilities — Parse, extract, and replace individual slides
 * in HTML slide deck documents.
 *
 * Enables per-slide AI editing by isolating a single slide's content
 * from a potentially large document, sending only that to the AI,
 * and splicing the result back in.
 */

export interface ParsedSlides {
  /** The <head> content including all <style> blocks */
  head: string;
  /** Individual slide HTML strings */
  slides: string[];
  /** The wrapper opening tag around slides (e.g. <div class="slides">) */
  wrapperOpen: string;
  /** The wrapper closing tag */
  wrapperClose: string;
  /** Everything before the slide wrapper in <body> */
  bodyPrefix: string;
  /** Everything after the slide wrapper in <body> (nav buttons, scripts) */
  bodySuffix: string;
  /** The opening <html> + <body> tags */
  docPrefix: string;
  /** The closing </body></html> tags */
  docSuffix: string;
}

/**
 * Parse an HTML slide deck into its component parts.
 * Finds slide elements using common patterns and separates them.
 */
export function parseSlides(html: string): ParsedSlides | null {
  // Use DOMParser to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract head content
  const head = doc.head ? doc.head.innerHTML : '';

  // Try common slide selectors
  const selectors = [
    '.slide',
    '[data-slide]',
    'section.slide',
    '.slide-content',
    '.slides > div',
    '.slides > section',
  ];

  let slideElements: Element[] = [];
  let usedSelector = '';

  for (const sel of selectors) {
    const found = doc.querySelectorAll(sel);
    if (found.length > 1) {
      slideElements = Array.from(found);
      usedSelector = sel;
      break;
    }
  }

  if (slideElements.length === 0) {
    return null; // Can't identify slides
  }

  // Extract each slide's outerHTML
  const slides = slideElements.map(el => el.outerHTML);

  // Find the wrapper element (parent of slides)
  const wrapper = slideElements[0].parentElement;
  let wrapperOpen = '';
  let wrapperClose = '';

  if (wrapper && wrapper !== doc.body) {
    // Build the opening tag from the wrapper
    const tagName = wrapper.tagName.toLowerCase();
    let attrs = '';
    for (let i = 0; i < wrapper.attributes.length; i++) {
      const attr = wrapper.attributes[i];
      attrs += ` ${attr.name}="${attr.value}"`;
    }
    wrapperOpen = `<${tagName}${attrs}>`;
    wrapperClose = `</${tagName}>`;
  }

  // Get body content that's NOT slides and NOT the wrapper
  const body = doc.body;
  let bodyPrefix = '';
  let bodySuffix = '';

  if (body) {
    const bodyHtml = body.innerHTML;
    // Find where the wrapper/slides start and end
    const wrapperEl = wrapper && wrapper !== body ? wrapper : null;
    if (wrapperEl) {
      const wrapperHtml = wrapperEl.outerHTML;
      const wrapperIdx = bodyHtml.indexOf(wrapperHtml);
      if (wrapperIdx !== -1) {
        bodyPrefix = bodyHtml.substring(0, wrapperIdx);
        bodySuffix = bodyHtml.substring(wrapperIdx + wrapperHtml.length);
      }
    } else {
      // Slides are direct children of body — find first and last slide positions
      const firstSlide = slides[0];
      const lastSlide = slides[slides.length - 1];
      const firstIdx = bodyHtml.indexOf(firstSlide);
      const lastIdx = bodyHtml.lastIndexOf(lastSlide);
      if (firstIdx !== -1 && lastIdx !== -1) {
        bodyPrefix = bodyHtml.substring(0, firstIdx);
        bodySuffix = bodyHtml.substring(lastIdx + lastSlide.length);
      }
    }
  }

  return {
    head,
    slides,
    wrapperOpen,
    wrapperClose,
    bodyPrefix,
    bodySuffix,
    docPrefix: '<!DOCTYPE html>\n<html>',
    docSuffix: '</html>',
  };
}

/**
 * Build a minimal single-slide document for AI editing.
 * Includes all styles/head content + just the target slide.
 * This is what gets sent to the AI instead of the full 1M+ char document.
 */
export function extractSlideForEditing(html: string, slideIndex: number): {
  slideDoc: string;
  parsed: ParsedSlides;
} | null {
  const parsed = parseSlides(html);
  if (!parsed || slideIndex >= parsed.slides.length) return null;

  const slideDoc = `<!DOCTYPE html>
<html>
<head>
${parsed.head}
</head>
<body>
${parsed.bodyPrefix}
${parsed.wrapperOpen}
${parsed.slides[slideIndex]}
${parsed.wrapperClose}
${parsed.bodySuffix}
</body>
</html>`;

  return { slideDoc, parsed };
}

/**
 * Splice an AI-edited slide back into the full document.
 * Extracts the slide element from the AI's response and replaces
 * only that slide in the original HTML, preserving everything else.
 */
export function spliceSlideBack(
  fullHtml: string,
  slideIndex: number,
  editedHtml: string,
  parsed: ParsedSlides,
): string {
  // Parse the AI's edited output to extract the modified slide
  const editedParser = new DOMParser();
  const editedDoc = editedParser.parseFromString(editedHtml, 'text/html');

  // Find the slide element in the edited output
  const selectors = ['.slide', '[data-slide]', 'section.slide', '.slide-content'];
  let editedSlide: Element | null = null;

  for (const sel of selectors) {
    const found = editedDoc.querySelectorAll(sel);
    if (found.length >= 1) {
      editedSlide = found[0]; // Take the first (should be the only) slide
      break;
    }
  }

  if (!editedSlide) {
    // Fallback: if we can't find a slide element, try to extract the body content
    // This handles cases where the AI changed the slide structure
    const body = editedDoc.body;
    if (body) {
      // Look for any div/section that's not a script
      const candidates = body.querySelectorAll('div, section');
      for (const c of Array.from(candidates)) {
        if (c.children.length > 0 || (c.textContent || '').trim().length > 20) {
          editedSlide = c;
          break;
        }
      }
    }
  }

  if (!editedSlide) {
    // Can't parse the AI output — return the full edited HTML as fallback
    return editedHtml;
  }

  // Also extract any new/modified <style> content from the edited head
  const editedHead = editedDoc.head?.innerHTML || '';
  let updatedHead = parsed.head;

  // Check if the AI added new <style> blocks
  const editedStyles = editedHead.match(/<style[\s\S]*?<\/style>/gi) || [];
  const originalStyles = parsed.head.match(/<style[\s\S]*?<\/style>/gi) || [];
  if (editedStyles.length > originalStyles.length) {
    // AI added new styles — append them
    const newStyles = editedStyles.slice(originalStyles.length);
    updatedHead = parsed.head + '\n' + newStyles.join('\n');
  }

  // Replace the target slide in the full document
  const originalSlide = parsed.slides[slideIndex];
  const newSlideHtml = editedSlide.outerHTML;

  // Simple string replacement — replace only the first occurrence
  const updatedHtml = fullHtml.replace(originalSlide, newSlideHtml);

  // If head was updated, replace that too
  if (updatedHead !== parsed.head) {
    return updatedHtml.replace(parsed.head, updatedHead);
  }

  return updatedHtml;
}
