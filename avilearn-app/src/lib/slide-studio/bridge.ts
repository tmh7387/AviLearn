/**
 * Slide Studio — Iframe Bridge
 *
 * Injects a selection overlay script into lesson HTML so users can
 * click elements in the preview iframe to target them for AI editing.
 *
 * Communication: iframe → parent via window.postMessage()
 */

/**
 * Generate a reasonable CSS selector for an element.
 * Prefers ID > class chain > tag+nth-child.
 */
function buildSelectorScript(): string {
  return `
    function getCssSelector(el) {
      if (el.id) return '#' + el.id;
      const parts = [];
      let current = el;
      while (current && current !== document.body && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.trim().split(/\\s+/).filter(c => c && !c.startsWith('_'));
          if (classes.length > 0) {
            selector += '.' + classes.slice(0, 2).join('.');
            parts.unshift(selector);
            break;
          }
        }
        // Use nth-child for disambiguation
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
          if (siblings.length > 1) {
            const idx = siblings.indexOf(current) + 1;
            selector += ':nth-child(' + idx + ')';
          }
        }
        parts.unshift(selector);
        current = current.parentElement;
        if (parts.length >= 4) break;
      }
      return parts.join(' > ');
    }
  `;
}

/**
 * Build the full bridge script that gets injected into the iframe HTML.
 */
function buildBridgeScript(): string {
  return `
<script data-slide-studio="bridge">
(function() {
  ${buildSelectorScript()}

  var selectedEl = null;
  var overlayEl = null;
  var isStudioMode = true;
  var navBypass = false;

  // Create floating overlay indicator
  overlayEl = document.createElement('div');
  overlayEl.id = '__studio-overlay';
  overlayEl.style.cssText = 'position:fixed;top:8px;left:8px;background:rgba(45,212,191,0.9);color:#14171f;font-family:Inter,sans-serif;font-size:11px;font-weight:600;padding:4px 10px;border-radius:4px;z-index:99999;pointer-events:none;opacity:0;transition:opacity 0.15s ease;';
  document.body.appendChild(overlayEl);

  // --- Helper: detect if an element is a slide navigation control ---
  function isNavElement(el) {
    if (!el || !el.tagName) return false;
    var txt = (el.textContent || '').trim().toLowerCase();
    // Check text for common nav labels
    if (/^(prev|next|previous)/.test(txt)) return true;
    if (/^[←→‹›«»]/.test(txt)) return true;
    if (/^(← prev|next →|← previous)/.test(txt)) return true;
    // Check class/id for nav patterns
    var cls = ((typeof el.className === 'string' ? el.className : '') + ' ' + (el.id || '')).toLowerCase();
    if (/\\b(nav|prev|next|slide-nav|slide-control|pagination|arrow)\\b/.test(cls)) return true;
    // Check parent container
    var parent = el.parentElement;
    if (parent) {
      var pcls = ((typeof parent.className === 'string' ? parent.className : '') + ' ' + (parent.id || '')).toLowerCase();
      if (/\\b(nav|slide-nav|navigation|controls|pagination)\\b/.test(pcls)) return true;
    }
    return false;
  }

  // Hover highlight
  document.addEventListener('mouseover', function(e) {
    if (!isStudioMode) return;
    var t = e.target;
    if (t === document.body || t === document.documentElement || t.id === '__studio-overlay') return;
    if (isNavElement(t)) { t.style.cursor = 'pointer'; return; }
    t.style.outline = '1px dashed rgba(45,212,191,0.4)';
    t.style.outlineOffset = '2px';
    t.style.cursor = 'crosshair';
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (!isStudioMode) return;
    var t = e.target;
    if (t === selectedEl) return;
    t.style.outline = '';
    t.style.outlineOffset = '';
    t.style.cursor = '';
  }, true);

  // Click to select — but let nav buttons pass through
  document.addEventListener('click', function(e) {
    if (!isStudioMode || navBypass) return;
    if (isNavElement(e.target)) return;
    e.preventDefault();
    e.stopPropagation();

    if (selectedEl) {
      selectedEl.style.outline = '';
      selectedEl.style.outlineOffset = '';
    }

    selectedEl = e.target;
    selectedEl.style.outline = '2px solid #2dd4bf';
    selectedEl.style.outlineOffset = '2px';

    overlayEl.textContent = selectedEl.tagName.toLowerCase() +
      (selectedEl.className && typeof selectedEl.className === 'string'
        ? '.' + selectedEl.className.trim().split(/\\s+/)[0] : '');
    overlayEl.style.opacity = '1';
    setTimeout(function() { overlayEl.style.opacity = '0'; }, 2000);

    window.parent.postMessage({
      type: 'element-selected',
      tagName: selectedEl.tagName.toLowerCase(),
      cssSelector: getCssSelector(selectedEl),
      textPreview: (selectedEl.textContent || '').trim().slice(0, 200),
      outerHTML: selectedEl.outerHTML.slice(0, 2000),
    }, '*');
  }, true);

  // --- Helper: find and click a nav button ---
  function clickNavButton(direction) {
    var buttons = document.querySelectorAll('button, a, [role="button"]');
    var needle = direction === 'next'
      ? /next|→|›|»/i
      : /prev|←|‹|«/i;
    for (var i = 0; i < buttons.length; i++) {
      var txt = (buttons[i].textContent || '').trim();
      if (needle.test(txt) && buttons[i].offsetParent !== null) {
        navBypass = true;
        buttons[i].click();
        navBypass = false;
        return true;
      }
    }
    return false;
  }

  // --- Helper: read slide info from DOM text ---
  function getSlideInfo() {
    var text = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    var match = text.match(/Slide\\s+(\\d+)\\s*\\/\\s*(\\d+)/i);
    if (match) return { current: parseInt(match[1], 10), total: parseInt(match[2], 10) };
    return null;
  }

  // --- Helper: report slide info to parent ---
  function reportSlideInfo() {
    var info = getSlideInfo();
    if (info) {
      window.parent.postMessage({ type: 'slide-info', current: info.current, total: info.total }, '*');
    }
  }

  // Report initial slide info once loaded
  if (document.readyState === 'complete') { setTimeout(reportSlideInfo, 200); }
  else { window.addEventListener('load', function() { setTimeout(reportSlideInfo, 200); }); }

  // Listen for commands from parent
  window.addEventListener('message', function(e) {
    if (!e.data) return;

    if (e.data.type === 'studio-clear-selection') {
      if (selectedEl) {
        selectedEl.style.outline = '';
        selectedEl.style.outlineOffset = '';
        selectedEl = null;
      }
    }

    if (e.data.type === 'studio-toggle') {
      isStudioMode = !!e.data.enabled;
      if (!isStudioMode && selectedEl) {
        selectedEl.style.outline = '';
        selectedEl.style.outlineOffset = '';
        selectedEl = null;
      }
    }

    // Navigate prev/next via the slide deck's own buttons
    if (e.data.type === 'studio-nav') {
      clickNavButton(e.data.direction);
      setTimeout(reportSlideInfo, 150);
    }

    // Request current slide info
    if (e.data.type === 'studio-get-slide-info') {
      reportSlideInfo();
    }

    // Go to specific slide by clicking Next N times
    if (e.data.type === 'studio-goto-slide') {
      var idx = e.data.slideIndex;
      for (var k = 0; k < idx; k++) {
        clickNavButton('next');
      }
      setTimeout(reportSlideInfo, 200);
    }
  });
})();
</script>`;
}

/**
 * Build a one-shot script that navigates to a specific slide on load.
 * Clicks the Next button N times after the page loads.
 */
function buildGotoScript(slideIndex: number): string {
  if (slideIndex <= 0) return '';
  return `
<script data-slide-studio="goto">
(function() {
  var target = ${slideIndex};
  function go() {
    var buttons = document.querySelectorAll('button, a, [role="button"]');
    var needle = /next|→|›|»/i;
    for (var step = 0; step < target; step++) {
      for (var i = 0; i < buttons.length; i++) {
        var txt = (buttons[i].textContent || '').trim();
        if (needle.test(txt) && buttons[i].offsetParent !== null) {
          buttons[i].click();
          break;
        }
      }
    }
  }
  if (document.readyState === 'complete') { setTimeout(go, 100); }
  else { window.addEventListener('load', function() { setTimeout(go, 150); }); }
})();
</script>`;
}

/**
 * Inject the selection bridge script into an HTML document.
 * Optionally also injects a one-shot slide navigation script.
 * Inserts just before </body> (or at the end if no closing body tag).
 */
export function injectSelectionBridge(html: string, initialSlide?: number): string {
  const script = buildBridgeScript() + buildGotoScript(initialSlide ?? 0);
  if (html.includes('</body>')) {
    return html.replace('</body>', script + '\n</body>');
  }
  if (html.includes('</html>')) {
    return html.replace('</html>', script + '\n</html>');
  }
  return html + '\n' + script;
}

/**
 * Strip the bridge scripts from HTML (for saving clean HTML back to storage).
 */
export function stripSelectionBridge(html: string): string {
  return html
    .replace(/<script data-slide-studio="bridge">[\s\S]*?<\/script>/g, '')
    .replace(/<script data-slide-studio="goto">[\s\S]*?<\/script>/g, '')
    .trim();
}
