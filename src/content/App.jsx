import React, { useState, useEffect, useCallback, useRef } from 'react';
import FloatingDot from './components/FloatingDot.jsx';
import ResultCard from './components/ResultCard.jsx';

const PHASES = { IDLE: 0, DOT: 1, LOADING: 2, RESULT: 3, ERROR: 4 };

let processing = false;

export default function App() {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [selInfo, setSelInfo] = useState(null);
  const [action, setAction] = useState(null);
  const [corrected, setCorrected] = useState('');
  const [original, setOriginal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dotRef = useRef(null);
  const selRef = useRef(null);

  const capture = useCallback(() => {
    if (processing) return;
    const sel = window.getSelection();
    const text = sel?.toString()?.trim();
    if (!text) { setPhase(PHASES.IDLE); return; }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    const active = document.activeElement;
    const tag = active?.tagName;
    let info;

    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (start === null || start === end) return;
      info = { type: tag === 'TEXTAREA' ? 'textarea' : 'input', element: active, start, end, text };
    } else if (active?.isContentEditable) {
      info = { type: 'contenteditable', element: active, range: range.cloneRange(), text };
    } else {
      info = { type: 'textNode', range: range.cloneRange(), text };
    }

    selRef.current = info;
    window.__aiGrammarSel = info;
    setSelInfo(info);
    setOriginal(text);

    const x = Math.max(8, Math.min(rect.right - 12, window.innerWidth - 32));
    const y = Math.max(8, rect.top - 12);
    setDotPos({ x, y });
    setPhase(PHASES.DOT);
  }, []);

  useEffect(() => {
    const to = () => setTimeout(capture, 60);
    document.addEventListener('mouseup', to);
    document.addEventListener('keyup', (e) => { if (['Shift','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) setTimeout(capture, 60); });
    return () => { document.removeEventListener('mouseup', to); };
  }, [capture]);

  useEffect(() => {
    if (phase !== PHASES.DOT) return;
    const h = (e) => { if (dotRef.current && !dotRef.current.contains(e.target)) setPhase(PHASES.IDLE); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [phase]);

  useEffect(() => {
    if (phase !== PHASES.DOT) return;
    const up = () => {
      const info = selRef.current;
      if (info?.type === 'textNode' && info?.range) {
        const r = info.range.getBoundingClientRect();
        if (r.width > 0) setDotPos({ x: Math.max(8, r.right - 12), y: Math.max(8, r.top - 12) });
      }
    };
    window.addEventListener('scroll', up, true);
    window.addEventListener('resize', up);
    return () => { window.removeEventListener('scroll', up, true); window.removeEventListener('resize', up); };
  }, [phase]);

  const doAction = useCallback((act) => {
    const info = selRef.current;
    if (!info?.text || processing) return;
    processing = true;
    setAction(act);
    setPhase(PHASES.LOADING);
    chrome.runtime.sendMessage({ action: 'processText', text: info.text, menuItemId: act }, (r) => {
      processing = false;
      if (chrome.runtime.lastError) { setErrorMsg(chrome.runtime.lastError.message); setPhase(PHASES.ERROR); return; }
      if (r?.error) { setErrorMsg(r.error); setPhase(PHASES.ERROR); return; }
      setCorrected(r.result);
      setPhase(PHASES.RESULT);
    });
  }, []);

  const doAccept = useCallback(() => {
    const info = selRef.current;
    if (!info || !corrected) return;
    if (info.type === 'input' || info.type === 'textarea') {
      info.element.value = info.element.value.substring(0, info.start) + corrected + info.element.value.substring(info.end);
      try { info.element.selectionStart = info.element.selectionEnd = info.start + corrected.length; } catch {}
    } else if (info.range) {
      try {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(info.range);
        s.getRangeAt(0).deleteContents();
        s.getRangeAt(0).insertNode(document.createTextNode(corrected));
        s.removeAllRanges();
      } catch {}
    }
    setPhase(PHASES.IDLE);
  }, [corrected]);

  const doRefix = useCallback(() => {
    if (!corrected || processing) return;
    processing = true;
    setOriginal(corrected);
    setPhase(PHASES.LOADING);
    chrome.runtime.sendMessage({ action: 'processText', text: corrected, menuItemId: action }, (r) => {
      processing = false;
      if (chrome.runtime.lastError) { setErrorMsg(chrome.runtime.lastError.message); setPhase(PHASES.ERROR); return; }
      if (r?.error) { setErrorMsg(r.error); setPhase(PHASES.ERROR); return; }
      setCorrected(r.result);
      setPhase(PHASES.RESULT);
    });
  }, [corrected, action]);

  const doDecline = useCallback(() => setPhase(PHASES.IDLE), []);

  return (
    <div style={{ all: 'initial', position: 'fixed', zIndex: 2147483647, inset: 0, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        {phase === PHASES.DOT && (
          <FloatingDot ref={dotRef} x={dotPos.x} y={dotPos.y}
            onFix={() => doAction('fix-grammar')}
            onRephrase={() => doAction('rephrase')}
            onClose={() => setPhase(PHASES.IDLE)} />
        )}
        {phase === PHASES.LOADING && <LoadingCard />}
        {phase === PHASES.RESULT && (
          <ResultCard original={original} corrected={corrected} action={action}
            onAccept={doAccept} onDecline={doDecline} onRefix={doRefix} selInfo={selInfo} />
        )}
        {phase === PHASES.ERROR && <ErrorCard message={errorMsg} onClose={() => setPhase(PHASES.IDLE)} />}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl ai-grammar-shadow px-8 py-6 flex items-center gap-3 animate-ai-slide-up">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
        <span className="text-gray-400 text-sm font-medium">AI is thinking</span>
      </div>
    </div>
  );
}

function ErrorCard({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl ai-grammar-shadow max-w-sm w-full animate-ai-slide-up overflow-hidden">
        <div className="p-5 text-center">
          <div className="text-amber-400 text-2xl mb-2">&#9888;</div>
          <div className="text-red-400 font-semibold text-sm mb-1">Error</div>
          <div className="text-gray-400 text-xs">{message}</div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[#333] text-gray-400 hover:bg-[#444] hover:text-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
