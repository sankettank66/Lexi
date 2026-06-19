(function () {
  let overlay = null;

  const sel = {
    range: null,
    element: null,
    start: 0,
    end: 0,
    text: '',
    type: 'textNode'
  };

  const ACTION_LABELS = {
    'fix-grammar': 'Fix Grammar',
    'rephrase': 'Rephrase'
  };

  /* ── Selection Capture ── */
  function captureSelection() {
    const active = document.activeElement;
    const tag = active?.tagName;

    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (start !== null && end !== null && start !== end) {
        sel.element = active;
        sel.start = start;
        sel.end = end;
        sel.text = active.value.substring(start, end);
        sel.range = null;
        sel.type = tag === 'TEXTAREA' ? 'textarea' : 'input';
        return true;
      }
      return false;
    }

    if (active?.isContentEditable) {
      const s = window.getSelection();
      if (s && s.rangeCount > 0 && s.toString().trim()) {
        sel.element = active;
        sel.range = s.getRangeAt(0).cloneRange();
        sel.text = s.toString();
        sel.type = 'contenteditable';
        return true;
      }
      return false;
    }

    const s = window.getSelection();
    if (s && s.rangeCount > 0 && s.toString().trim()) {
      sel.range = s.getRangeAt(0).cloneRange();
      sel.text = s.toString();
      sel.element = null;
      sel.type = 'textNode';
      return true;
    }

    return false;
  }

  document.addEventListener('contextmenu', captureSelection, true);

  /* ── Message Handler ── */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'saveSelection':
        captureSelection();
        sendResponse({ ok: true });
        break;
      case 'showLoading':
        showLoadingOverlay();
        sendResponse({ ok: true });
        break;
      case 'showResult':
        showResultOverlay(message.original, message.corrected, message.menuItemId);
        sendResponse({ ok: true });
        break;
      case 'showError':
        showErrorOverlay(message.message);
        sendResponse({ ok: true });
        break;
      case 'hideOverlay':
        removeOverlay();
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ ok: false });
        break;
    }
  });

  /* ── Overlay Management ── */
  function createOverlay() {
    removeOverlay();
    overlay = document.createElement('div');
    overlay.id = 'ai-grammar-overlay';
    document.body.appendChild(overlay);
    return overlay;
  }

  function removeOverlay() {
    const existing = document.getElementById('ai-grammar-overlay');
    if (existing) existing.remove();
    overlay = null;
  }

  function positionOverlay() {
    if (!overlay) return;

    let top, left;
    const elW = overlay.offsetWidth || 400;
    const elH = overlay.offsetHeight || 200;
    const pad = 12;

    if (sel.element && (sel.type === 'input' || sel.type === 'textarea')) {
      const rect = sel.element.getBoundingClientRect();
      const lineH = parseInt(getComputedStyle(sel.element).lineHeight) || 20;
      const linesFromTop = sel.text.split('\n').length;
      const cursorY = rect.top + Math.min(sel.start / (sel.element.value.length || 1), 0.9) * rect.height;
      top = cursorY + lineH + pad;
      left = rect.left + pad;
    } else if (sel.range) {
      const rect = sel.range.getBoundingClientRect();
      top = rect.bottom + pad;
      left = rect.left;
    } else {
      top = window.innerHeight / 2 - elH / 2;
      left = window.innerWidth / 2 - elW / 2;
    }

    if (left + elW + pad > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - elW - pad);
    }
    if (top + elH + pad > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - elH - pad);
    }

    overlay.style.top = `${Math.max(pad, top)}px`;
    overlay.style.left = `${Math.max(pad, left)}px`;
  }

  /* ── Loading ── */
  function showLoadingOverlay() {
    const el = createOverlay();
    el.innerHTML = `
      <div class="ai-grammar-loading">
        <div class="ai-grammar-loading-dot"></div>
        <div class="ai-grammar-loading-dot"></div>
        <div class="ai-grammar-loading-dot"></div>
      </div>
    `;
    positionOverlay();
  }

  /* ── Result with Typing Effect ── */
  function showResultOverlay(original, corrected, menuItemId) {
    const label = ACTION_LABELS[menuItemId] || 'AI Grammar';
    const isRephrase = menuItemId === 'rephrase';

    const el = createOverlay();
    el.innerHTML = `
      <div class="ai-grammar-header">
        <span class="ai-grammar-dot ${menuItemId}"></span>
        ${label}
      </div>
      <div class="ai-grammar-body">
        <div class="ai-grammar-section">
          <div class="ai-grammar-section-label">Original</div>
          <div class="ai-grammar-text original">${esc(original)}</div>
        </div>
        <div class="ai-grammar-section">
          <div class="ai-grammar-section-label">${isRephrase ? 'Rephrased' : 'Corrected'}</div>
          <div class="ai-grammar-text corrected" id="ai-grammar-corrected-text">
            <span class="ai-grammar-typing-cursor ${isRephrase ? 'rephrase-mode' : ''}"></span>
          </div>
        </div>
      </div>
      <div class="ai-grammar-footer">
        <button class="ai-grammar-btn ai-grammar-btn-secondary" data-action="cancel">Cancel</button>
        <button class="ai-grammar-btn ai-grammar-btn-retry" data-action="retry">Try Again</button>
        <button class="ai-grammar-btn ai-grammar-btn-primary" data-action="accept" disabled>Accept</button>
      </div>
    `;

    el.querySelector('[data-action="cancel"]').addEventListener('click', removeOverlay);
    el.querySelector('[data-action="retry"]').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'tryAgain', text: original, menuItemId });
      removeOverlay();
    });

    const acceptBtn = el.querySelector('[data-action="accept"]');
    acceptBtn.addEventListener('click', () => {
      replaceText(corrected);
      removeOverlay();
    });

    positionOverlay();

    typeText(corrected, isRephrase, () => {
      acceptBtn.disabled = false;
    });
  }

  /* ── Typing Animation ── */
  function typeText(text, isRephrase, onDone) {
    const container = document.getElementById('ai-grammar-corrected-text');
    if (!container) { onDone(); return; }

    let idx = 0;
    const baseDelay = 30;
    const slowDownAt = Math.max(0, text.length - 15);
    const slowdownDelay = 50;

    const cursor = container.querySelector('.ai-grammar-typing-cursor');

    function tick() {
      if (idx >= text.length) {
        if (cursor) cursor.style.display = 'none';
        onDone();
        return;
      }

      const char = text[idx];
      const isSlow = idx >= slowDownAt;
      const delay = isSlow ? slowdownDelay : baseDelay;

      if (idx === 0) {
        container.textContent = '';
        container.appendChild(document.createTextNode(''));
        if (cursor) container.appendChild(cursor);
      }

      const textNode = container.childNodes[0] || container.appendChild(document.createTextNode(''));
      textNode.textContent += char;

      idx++;
      setTimeout(tick, delay);
    }

    tick();
  }

  /* ── Error ── */
  function showErrorOverlay(message) {
    const el = createOverlay();
    el.innerHTML = `
      <div class="ai-grammar-error">
        <div class="ai-grammar-error-icon">&#9888;</div>
        <div class="ai-grammar-error-title">Error</div>
        <div class="ai-grammar-error-message">${esc(message)}</div>
      </div>
      <div class="ai-grammar-footer">
        <button class="ai-grammar-btn ai-grammar-btn-secondary" data-action="cancel">Close</button>
        <button class="ai-grammar-btn ai-grammar-btn-settings" data-action="settings">Settings</button>
      </div>
    `;

    el.querySelector('[data-action="cancel"]').addEventListener('click', removeOverlay);
    el.querySelector('[data-action="settings"]').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openOptions' });
      removeOverlay();
    });

    positionOverlay();
  }

  /* ── Text Replacement ── */
  function replaceText(newText) {
    if (sel.element && (sel.type === 'input' || sel.type === 'textarea')) {
      const el = sel.element;
      const before = el.value.substring(0, sel.start);
      const after = el.value.substring(sel.end);
      el.value = before + newText + after;
      try { el.selectionStart = el.selectionEnd = sel.start + newText.length; } catch {}
      return;
    }

    if (sel.type === 'contenteditable' && sel.range) {
      try {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(sel.range);
        s.getRangeAt(0).deleteContents();
        s.getRangeAt(0).insertNode(document.createTextNode(newText));
        s.removeAllRanges();
        return;
      } catch {}
    }

    if (sel.range) {
      try {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(sel.range);

        const node = sel.range.startContainer;
        if (node.nodeType === 3) {
          const parent = node.parentNode;
          if (parent && (parent.tagName === 'INPUT' || parent.tagName === 'TEXTAREA')) {
            const start = sel.range.startOffset;
            const end = sel.range.endOffset;
            const val = parent.value;
            parent.value = val.substring(0, start) + newText + val.substring(end);
            return;
          }
        }

        s.getRangeAt(0).deleteContents();
        s.getRangeAt(0).insertNode(document.createTextNode(newText));
        s.removeAllRanges();
        return;
      } catch {}
    }

    fallbackReplace(newText);
  }

  function fallbackReplace(newText) {
    try {
      const active = document.activeElement;
      if (active) {
        const tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          const start = active.selectionStart;
          const end = active.selectionEnd;
          if (start !== null && end !== null && start !== end) {
            active.value = active.value.substring(0, start) + newText + active.value.substring(end);
            active.selectionStart = active.selectionEnd = start + newText.length;
            return;
          }
        }
        if (active.isContentEditable) {
          document.execCommand('insertText', false, newText);
          return;
        }
      }
      const s = window.getSelection();
      if (s.rangeCount > 0 && s.toString().trim()) {
        s.getRangeAt(0).deleteContents();
        s.getRangeAt(0).insertNode(document.createTextNode(newText));
        s.removeAllRanges();
      }
    } catch {}
  }

  /* ── Helpers ── */
  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Dismiss Events ── */
  document.addEventListener('mousedown', (e) => {
    if (overlay && !overlay.contains(e.target)) removeOverlay();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removeOverlay();
  });
})();
