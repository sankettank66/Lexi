(function () {
  let savedRange = null;
  let overlay = null;

  const ACTION_LABELS = {
    'fix-grammar': 'Fix Grammar',
    'rephrase': 'Rephrase'
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'saveSelection':
        saveCurrentSelection();
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
        sendResponse({ ok: false, error: `Unknown action: ${message.action}` });
        break;
    }
  });

  function saveCurrentSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

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

    if (savedRange) {
      const rect = savedRange.getBoundingClientRect();
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;

      if (left + 480 > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - 496);
      }
      if (top + overlay.offsetHeight > window.scrollY + window.innerHeight - 16) {
        top = rect.top + window.scrollY - overlay.offsetHeight - 8;
      }

      overlay.style.top = `${Math.max(8, top)}px`;
      overlay.style.left = `${Math.max(8, left)}px`;
    } else {
      overlay.style.top = `${window.scrollY + 60}px`;
      overlay.style.left = `${window.scrollX + Math.max(16, (window.innerWidth - 400) / 2)}px`;
    }
  }

  function showLoadingOverlay() {
    const el = createOverlay();
    el.innerHTML = `
      <div class="ai-grammar-loading">
        <div class="ai-grammar-spinner"></div>
        <span class="ai-grammar-loading-text">Processing&hellip;</span>
      </div>
    `;
    positionOverlay();
    window.addEventListener('scroll', positionOverlay, { once: true });
    window.addEventListener('resize', positionOverlay, { once: true });
  }

  function showResultOverlay(original, corrected, menuItemId) {
    const label = ACTION_LABELS[menuItemId] || 'AI Grammar';
    const el = createOverlay();
    el.innerHTML = `
      <div class="ai-grammar-header">
        <span class="ai-grammar-dot ${menuItemId}"></span>
        ${label}
      </div>
      <div class="ai-grammar-body">
        <div class="ai-grammar-section">
          <div class="ai-grammar-section-label">Original</div>
          <div class="ai-grammar-text original">${escapeHtml(original)}</div>
        </div>
        <div class="ai-grammar-section">
          <div class="ai-grammar-section-label">${label === 'Rephrase' ? 'Rephrased' : 'Corrected'}</div>
          <div class="ai-grammar-text corrected">${escapeHtml(corrected)}</div>
        </div>
      </div>
      <div class="ai-grammar-footer">
        <button class="ai-grammar-btn ai-grammar-btn-secondary" data-action="cancel">Cancel</button>
        <button class="ai-grammar-btn ai-grammar-btn-retry" data-action="retry">Try Again</button>
        <button class="ai-grammar-btn ai-grammar-btn-primary" data-action="accept">Accept</button>
      </div>
    `;

    el.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'accept') replaceText(corrected);
        else if (action === 'retry') retry(original, menuItemId);
        removeOverlay();
      });
    });

    positionOverlay();
    window.addEventListener('scroll', positionOverlay, { once: true });
    window.addEventListener('resize', positionOverlay, { once: true });
  }

  function showErrorOverlay(message) {
    const el = createOverlay();
    el.innerHTML = `
      <div class="ai-grammar-error">
        <div class="ai-grammar-error-icon">&#9888;</div>
        <div class="ai-grammar-error-title">Error</div>
        <div class="ai-grammar-error-message">${escapeHtml(message)}</div>
      </div>
      <div class="ai-grammar-footer">
        <button class="ai-grammar-btn ai-grammar-btn-secondary" data-action="cancel">Close</button>
        <button class="ai-grammar-btn ai-grammar-btn-settings" data-action="settings">Open Settings</button>
      </div>
    `;

    el.querySelector('[data-action="cancel"]').addEventListener('click', removeOverlay);
    el.querySelector('[data-action="settings"]').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openOptions' });
      removeOverlay();
    });

    positionOverlay();
    window.addEventListener('scroll', positionOverlay, { once: true });
    window.addEventListener('resize', positionOverlay, { once: true });
  }

  function replaceText(newText) {
    if (!savedRange) {
      tryReplaceSelection(newText);
      return;
    }

    try {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);

      const node = savedRange.startContainer;
      const isInput = node.nodeType === Node.TEXT_NODE &&
        (node.parentNode?.tagName === 'INPUT' || node.parentNode?.tagName === 'TEXTAREA');
      const isContentEditable = node.nodeType === Node.TEXT_NODE &&
        node.parentNode?.isContentEditable;

      if (isInput) {
        const input = node.parentNode;
        const start = savedRange.startOffset;
        const end = savedRange.endOffset;
        const val = input.value;
        input.value = val.substring(0, start) + newText + val.substring(end);
        input.selectionStart = input.selectionEnd = start + newText.length;
      } else if (isContentEditable) {
        document.execCommand('insertText', false, newText);
      } else {
        if (selection.rangeCount > 0) {
          selection.getRangeAt(0).deleteContents();
          selection.getRangeAt(0).insertNode(document.createTextNode(newText));
        }
      }

      selection.removeAllRanges();
    } catch {
      tryReplaceSelection(newText);
    }
  }

  function tryReplaceSelection(newText) {
    try {
      const active = document.activeElement;
      if (active) {
        if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
          const start = active.selectionStart;
          const end = active.selectionEnd;
          if (start !== null && end !== null) {
            const val = active.value;
            active.value = val.substring(0, start) + newText + val.substring(end);
            active.selectionStart = active.selectionEnd = start + newText.length;
            return;
          }
        }
        if (active.isContentEditable) {
          document.execCommand('insertText', false, newText);
          return;
        }
      }

      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        sel.getRangeAt(0).deleteContents();
        sel.getRangeAt(0).insertNode(document.createTextNode(newText));
        sel.removeAllRanges();
      }
    } catch {
      console.warn('AI Grammar: could not replace text automatically');
    }
  }

  function retry(text, menuItemId) {
    chrome.runtime.sendMessage({ action: 'tryAgain', text, menuItemId });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.addEventListener('selectionchange', () => {
    if (!overlay) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (overlay && !overlay.contains(e.target)) {
      removeOverlay();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removeOverlay();
  });
})();
