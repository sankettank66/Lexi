import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import ResultCard from './components/ResultCard.jsx';
import Logo from './components/Logo.jsx';

const PHASES = { IDLE: 0, DOT: 1, LOADING: 2, RESULT: 3, ERROR: 4 };

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional', description: 'Formal, polished, business-appropriate' },
  { id: 'casual', label: 'Casual', description: 'Relaxed, conversational, friendly' },
  { id: 'formal', label: 'Formal', description: 'Academic, precise, structured' },
  { id: 'friendly', label: 'Friendly', description: 'Warm, approachable, personable' },
  { id: 'concise', label: 'Concise', description: 'Brief, direct, to-the-point' },
];

let processing = false;

function stripOuterQuotes(text) {
  if (!text || text.length < 2) return text;
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('\'') && text.endsWith('\''))) {
    return text.slice(1, -1).trim();
  }
  return text;
}

export default function App() {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [selInfo, setSelInfo] = useState(null);
  const [action, setAction] = useState(null);
  const [selectedTone, setSelectedTone] = useState(null);
  const [instruction, setInstruction] = useState(null);
  const [resumeInstruction, setResumeInstruction] = useState(null);
  const [corrected, setCorrected] = useState('');
  const [original, setOriginal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pageTheme, setPageTheme] = useState('dark');
  const dotRef = useRef(null);
  const selRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const h = (msg, sender, sendResponse) => {
      if (msg.action === 'saveSelection') {
        const sel = window.getSelection();
        const text = sel?.toString()?.trim();
        if (!text) { sendResponse({ ok: false }); return; }
        window.__lexiSel = { type: 'textNode', range: sel.getRangeAt(0).cloneRange(), text };
        sendResponse({ ok: true });
      } else if (msg.action === 'showLoading') {
        setPhase(PHASES.LOADING);
        sendResponse({ ok: true });
      } else if (msg.action === 'showResult') {
        setOriginal(msg.original);
        setCorrected(stripOuterQuotes(msg.corrected));
        setAction(msg.menuItemId);
        setSelectedTone(msg.tone || null);
        setPhase(PHASES.RESULT);
        sendResponse({ ok: true });
      } else if (msg.action === 'showError') {
        setErrorMsg(msg.message);
        setPhase(PHASES.ERROR);
        sendResponse({ ok: true });
      }
      return true;
    };
    chrome.runtime.onMessage.addListener(h);
    return () => chrome.runtime.onMessage.removeListener(h);
  }, []);

  useEffect(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const lum = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3];
      setPageTheme(lum > 160 ? 'light' : 'dark');
    }
  }, []);

  const capture = useCallback(() => {
    if (processing) return;
    if (phaseRef.current !== PHASES.IDLE) return;
    const active = document.activeElement;
    const tag = active?.tagName;
    let text, info, rect;

    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      if (start === null || start === end) return;
      text = active.value.substring(start, end).trim();
      if (!text) return;
      info = { type: tag === 'TEXTAREA' ? 'textarea' : 'input', element: active, start, end, text };
      try {
        const { x, y, height } = active.getBoundingClientRect();
        const lineH = parseInt(getComputedStyle(active).lineHeight) || 16;
        const linesUpToCursor = active.value.substr(0, start).split('\n').length;
        rect = { right: x + 2, top: y + (linesUpToCursor * lineH) - 2 };
      } catch { rect = { right: 8, top: 8 }; }
    } else {
      const sel = window.getSelection();
      text = sel?.toString()?.trim();
      if (!text) { setPhase(PHASES.IDLE); return; }
      const range = sel.getRangeAt(0);
      rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      if (active?.isContentEditable) {
        info = { type: 'contenteditable', element: active, range: range.cloneRange(), text };
      } else {
        info = { type: 'textNode', range: range.cloneRange(), text };
      }
    }

    selRef.current = info;
    window.__lexiSel = info;
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
    const h = (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (dotRef.current && !path.includes(dotRef.current)) {
        setPhase(PHASES.IDLE);
      }
    };
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

  const doAction = useCallback((act, tone, custInstruction) => {
    const info = selRef.current;
    if (!info?.text || processing) return;
    processing = true;
    setAction(act);
    setSelectedTone(tone || null);
    setInstruction(custInstruction || null);
    setPhase(PHASES.LOADING);
    chrome.runtime.sendMessage({ action: 'processText', text: info.text, menuItemId: act, tone, instruction: custInstruction }, (r) => {
      processing = false;
      if (chrome.runtime.lastError) { setErrorMsg(chrome.runtime.lastError.message); setPhase(PHASES.ERROR); return; }
      if (r?.error) { setErrorMsg(r.error); setPhase(PHASES.ERROR); return; }
      setCorrected(stripOuterQuotes(r.result));
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
    if (action === 'custom') {
      setResumeInstruction(instruction);
      setPhase(PHASES.DOT);
      return;
    }
    processing = true;
    setOriginal(corrected);
    setPhase(PHASES.LOADING);
    chrome.runtime.sendMessage({ action: 'processText', text: corrected, menuItemId: action, tone: selectedTone, instruction }, (r) => {
      processing = false;
      if (chrome.runtime.lastError) { setErrorMsg(chrome.runtime.lastError.message); setPhase(PHASES.ERROR); return; }
      if (r?.error) { setErrorMsg(r.error); setPhase(PHASES.ERROR); return; }
      setCorrected(stripOuterQuotes(r.result));
      setPhase(PHASES.RESULT);
    });
  }, [corrected, action, selectedTone, instruction]);

  const doDecline = useCallback(() => setPhase(PHASES.IDLE), []);

  return (
    <div style={{ all: 'initial', position: 'fixed', zIndex: 2147483647, inset: 0, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        {(phase === PHASES.DOT || phase === PHASES.LOADING) && (
          <InlineDot ref={dotRef} x={dotPos.x} y={dotPos.y}
            loading={phase === PHASES.LOADING}
            onFix={() => doAction('fix')}
            onRewrite={() => doAction('rewrite')}
            onChangeTone={(tone) => doAction('changeTone', tone)}
            onAskAI={(instr) => doAction('custom', null, instr)}
            resumeInstruction={resumeInstruction}
            onClearResume={() => setResumeInstruction(null)}
            pageTheme={pageTheme} />
        )}
        {phase === PHASES.RESULT && (
          <ResultCard original={original} corrected={corrected} action={action} tone={selectedTone} instruction={instruction}
            onAccept={doAccept} onDecline={doDecline} onRefix={doRefix} selInfo={selInfo} pageTheme={pageTheme} />
        )}
        {phase === PHASES.ERROR && <ErrorCard message={errorMsg} onClose={() => setPhase(PHASES.IDLE)} pageTheme={pageTheme} />}
      </div>
    </div>
  );
}

/* ─── InlineDot - Apple glass; spinner + random loading phrase ─── */
const loadingPhrases = [
  'Analyzing text…',
  'Checking grammar…',
  'Polishing words…',
  'Rewriting…',
  'Reviewing flow…',
  'Refining tone…',
  'Reading carefully…',
  'Sharpening sentences…',
  'Smoothing edges…',
  'Tweaking phrases…',
  'Improving clarity…',
  'Tidying up…',
  'Making it flow…',
  'Brushing up…',
  'Trimming fat…',
  'Finding better words…',
  'Untangling…',
  'Fixing quirks…',
  'Applying polish…',
  'Rethinking phrasing…',
  'Cleaning up…',
  'Crafting better…',
  'Adjusting tone…',
  'Streamlining…',
  'Tuning language…',
  'Following your instruction…',
  'Understanding your request…',
  'Working on it…',
  'Applying your changes…',
];

const InlineDot = forwardRef(function InlineDot({ x, y, onFix, onRewrite, onChangeTone, onAskAI, loading, resumeInstruction, onClearResume, pageTheme }, ref) {
  const [open, setOpen] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [loadingPhrase, setLoadingPhrase] = useState('');
  const inputRef = useRef(null);
  const toneLeaveRef = useRef(null);

  useEffect(() => {
    if (resumeInstruction) {
      setOpen(true);
      setCustomMode(true);
      setCustomInput(resumeInstruction);
      onClearResume();
    }
  }, [resumeInstruction]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (ref.current && !path.includes(ref.current)) {
        setOpen(false);
        setToneOpen(false);
        setCustomMode(false);
        setCustomInput('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => {
    if (loading) {
      setLoadingPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
    }
  }, [loading]);

  useEffect(() => {
    if (customMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customMode]);

  const MARGIN = 8;
  const TOOLS_W = 196, TOOLS_H = 215, CUSTOM_W = 248, CUSTOM_H = 155, LOADING_H = 40;

  const calcPos = (w, h) => {
    let left = x - w / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - w - MARGIN));
    const below = y + 28 + h + 10 <= window.innerHeight - MARGIN;
    const top = below ? y + 28 + 10 : y - h - 10;
    return { left, top, below };
  };

  const toolsPos = calcPos(TOOLS_W, TOOLS_H);
  const customPos = calcPos(CUSTOM_W, CUSTOM_H);
  const loadingPos = calcPos(200, LOADING_H);

  const submenuLeft = toolsPos.left + TOOLS_W + 6;
  const submenuRight = submenuLeft + 155 > window.innerWidth - MARGIN;

  const handleSend = () => {
    const val = customInput.trim();
    if (!val) return;
    setCustomInput('');
    setCustomMode(false);
    setOpen(false);
    if (onClearResume) onClearResume();
    onAskAI(val);
  };

  return (
    <div ref={ref} style={{ position: 'fixed', left: x, top: y, zIndex: 2147483647 }}>
      <div
        onClick={loading ? undefined : () => { setOpen(v => !v); setCustomMode(false); setCustomInput(''); if (onClearResume) onClearResume(); }}
        className={loading ? 'animate-ai-glass-loading-pulse' : ''}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: loading
            ? (pageTheme === 'light' ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.22)')
            : (pageTheme === 'light' ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.16)'),
          backdropFilter: 'blur(50px)',
          WebkitBackdropFilter: 'blur(50px)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease',
          boxShadow: loading
            ? '0 0 20px rgba(59,130,246,0.25), 0 2px 12px rgba(0,0,0,0.35)'
            : '0 2px 12px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={loading ? undefined : e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.35)'; }}
        onMouseLeave={loading ? undefined : e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.35)'; }}
        onMouseDown={loading ? undefined : e => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={loading ? undefined : e => e.currentTarget.style.transform = 'scale(1.2)'}
        aria-label={loading ? `Lexi - ${loadingPhrase}` : 'Lexi - AI Writing Assistant'}>
        {loading ? (
          <span className="animate-ai-glass-spin"
            style={{ display: 'block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6' }} />
        ) : (
          <Logo width={14} height={14} />
        )}
      </div>

      {/* Loading tooltip with cycling phrases */}
      {loading && (
        <div className={`${pageTheme === 'light' ? 'ai-glass-tooltip-light' : 'ai-glass-tooltip'} animate-ai-glass-enter`} style={{
          position: 'fixed', left: loadingPos.left, top: loadingPos.top,
          borderRadius: 10, padding: '8px 14px',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 450 }}>
            {loadingPhrase}
          </span>
        </div>
      )}

      {/* Tools tooltip */}
      {!loading && open && !customMode && (
        <div className={`${pageTheme === 'light' ? 'ai-glass-tooltip-light' : 'ai-glass-tooltip'} animate-ai-glass-enter`} style={{
          position: 'fixed', left: toolsPos.left, top: toolsPos.top,
          borderRadius: 14, padding: 8, width: TOOLS_W,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', marginBottom: 4 }}>
            <Logo width={14} height={14} style={{ opacity: 0.45, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Instrument Serif', serif" }}>Lexi - Assistant</span>
          </div>

          <button onClick={onFix}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; e.currentTarget.style.paddingLeft = '12px'; }}>
            Fix
          </button>

          <button onClick={onRewrite}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; e.currentTarget.style.paddingLeft = '12px'; }}>
            Rewrite
          </button>

          <div style={{ position: 'relative' }}
            onMouseEnter={() => { if (toneLeaveRef.current) clearTimeout(toneLeaveRef.current); setToneOpen(true); }}
            onMouseLeave={() => { toneLeaveRef.current = setTimeout(() => setToneOpen(false), 120); }}>
            <button
              onClick={() => { if (toneLeaveRef.current) clearTimeout(toneLeaveRef.current); setToneOpen(v => !v); }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
              onMouseLeave={e => { e.currentTarget.style.background = toneOpen ? 'rgba(59,130,246,0.1)' : 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; e.currentTarget.style.paddingLeft = '12px'; }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '9px 12px', borderRadius: 10,
                fontSize: 13, fontWeight: 500, color: toneOpen ? '#fff' : 'rgba(255,255,255,0.88)',
                background: toneOpen ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}>
              Change Tone
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.35)', transition: 'transform 0.15s', transform: toneOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
            </button>
            {toneOpen && (
              <div className="ai-glass-tooltip animate-ai-glass-enter"
                onMouseEnter={() => { if (toneLeaveRef.current) clearTimeout(toneLeaveRef.current); }}
                onMouseLeave={() => { toneLeaveRef.current = setTimeout(() => setToneOpen(false), 120); }}
                style={{
                position: 'absolute',
                [submenuRight ? 'right' : 'left']: '100%',
                top: 0,
                [submenuRight ? 'marginRight' : 'marginLeft']: 6,
                borderRadius: 12, padding: 6,
                width: 155,
              }}>
                {TONE_OPTIONS.map(t => (
                  <button key={t.id} onClick={() => onChangeTone(t.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 8,
                      fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.82)',
                      background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '14px'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; e.currentTarget.style.paddingLeft = '10px'; }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setCustomMode(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.88)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'all 0.15s', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '16px'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; e.currentTarget.style.paddingLeft = '12px'; }}>
            Ask AI
          </button>
        </div>
      )}

      {/* Custom input mode */}
      {!loading && open && customMode && (
        <div className={`${pageTheme === 'light' ? 'ai-glass-tooltip-light' : 'ai-glass-tooltip'} animate-ai-glass-enter`} style={{
          position: 'fixed', left: customPos.left, top: customPos.top,
          borderRadius: 14, padding: 10, width: CUSTOM_W,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', marginBottom: 10 }}>
            <Logo width={14} height={14} style={{ opacity: 0.45, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Instrument Serif', serif" }}>Ask AI</span>
          </div>

          <input ref={inputRef}
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') { setCustomMode(false); setCustomInput(''); } }}
            placeholder='e.g. make it formal, shorten it, translate...'
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              fontSize: 13, color: 'rgba(255,255,255,0.85)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              outline: 'none', resize: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }} />

          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => { setCustomMode(false); setCustomInput(''); }}
              style={{
                padding: '7px 14px', borderRadius: 8,
                fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
              Back
            </button>
            <button onClick={handleSend}
              disabled={!customInput.trim()}
              style={{
                padding: '7px 16px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, color: customInput.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                background: customInput.trim() ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${customInput.trim() ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.03)'}`,
                cursor: customInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (customInput.trim()) { e.currentTarget.style.background = 'rgba(59,130,246,0.4)'; } }}
              onMouseLeave={e => { if (customInput.trim()) { e.currentTarget.style.background = 'rgba(59,130,246,0.25)'; } }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

/* ─── ErrorCard - Apple glass with neutral red accent ─── */
function ErrorCard({ message, onClose, pageTheme }) {
  return (
    <div className="ai-glass-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 2147483647,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'auto',
    }}>
      <div className={`${pageTheme === 'light' ? 'ai-glass-elevated-light' : 'ai-glass-elevated'} animate-ai-glass-enter`} style={{
        maxWidth: 400, width: 'calc(100vw - 32px)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div className={`${pageTheme === 'light' ? 'ai-glass-header-light' : 'ai-glass-header'}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <span style={{ color: '#ef4444', fontSize: 15, opacity: 0.7 }}>&#9888;</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Error</span>
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px' }} className={`${pageTheme === 'light' ? 'ai-glass-header-light' : 'ai-glass-header'}`}>
          <button onClick={onClose}
            className="ai-glass-btn"
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.03)',
              cursor: 'pointer', background: 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
