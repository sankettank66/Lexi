import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo.jsx';

const ACCENT = '#3b82f6';

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'concise', label: 'Concise' },
];

const btnGlass = {
  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
};

export default function ResultCard({ original, corrected, action, tone, instruction, onAccept, onDecline, onRefix, selInfo, pageTheme }) {
  const cardRef = useRef(null);
  const [cardPos, setCardPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startTop: 0, startLeft: 0 });

  const isRewrite = action === 'rewrite';
  const isChangeTone = action === 'changeTone';
  const isCustom = action === 'custom';

  const toneLabel = tone ? TONE_OPTIONS.find(t => t.id === tone)?.label || tone : null;

  const titleLabel = isChangeTone
    ? `Change Tone${toneLabel ? ` - ${toneLabel}` : ''}`
    : isCustom ? `Ask AI${instruction ? ` - ${instruction}` : ''}`
    : isRewrite ? 'Rewrite' : 'Fix';

  const actionLabel = isChangeTone
    ? `Changed Tone${toneLabel ? ` - ${toneLabel}` : ''}`
    : isCustom ? 'Result'
    : isRewrite ? 'Rewritten' : 'Corrected';

  const againLabel = isChangeTone
    ? 'Change Tone Again'
    : isCustom ? 'Ask Again'
    : isRewrite ? 'Rewrite Again' : 'Fix Again';

  const getPos = () => {
    const info = selInfo;
    if (!info) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    if (info.type === 'input' || info.type === 'textarea') {
      const r = info.element.getBoundingClientRect();
      const t = Math.min(r.bottom + 8, window.innerHeight - 400);
      if (t < 8) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
      return { top: t, left: Math.max(8, r.left + 8) };
    }
    if (info.range) {
      const r = info.range.getBoundingClientRect();
      let t = r.bottom + 8;
      let l = r.left;
      if (t + 400 > window.innerHeight) t = r.top - 400;
      if (t < 8 || l + 400 > window.innerWidth - 16) {
        return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
      }
      return { top: Math.max(8, t), left: Math.max(8, l) };
    }
    return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  };

  const handleDragStart = (e) => {
    if (e.button !== 0) return;
    const rect = cardRef.current.getBoundingClientRect();
    const startTop = cardPos ? cardPos.top : rect.top;
    const startLeft = cardPos ? cardPos.left : rect.left;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startTop, startLeft };
    if (!cardPos) setCardPos({ top: startTop, left: startLeft });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const rect = cardRef.current.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      let top = dragRef.current.startTop + dy;
      let left = dragRef.current.startLeft + dx;
      top = Math.max(-ch + 40, Math.min(top, window.innerHeight - 8));
      left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));
      setCardPos({ top, left });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

  const autoPos = getPos();
  const pos = cardPos || autoPos;
  const animClass = !cardPos ? 'animate-ai-glass-enter' : '';

  return (
    <div ref={cardRef}
      className={`${pageTheme === 'light' ? 'ai-glass-elevated-light' : 'ai-glass-elevated'} ${animClass} ${isDragging ? 'transition-none' : ''}`}
      style={{
        ...pos, position: 'fixed', zIndex: 2147483647,
        width: 400, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)',
        borderRadius: 16, overflow: 'hidden',
      }}>
      {/* Header */}
      <div className={`${pageTheme === 'light' ? 'ai-glass-header-light' : 'ai-glass-header'} flex items-center gap-2.5 px-4 py-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
        onMouseDown={handleDragStart}>
        <Logo width={14} height={14} style={{ opacity: pageTheme === 'light' ? 0.65 : 0.45, flexShrink: 0 }} />
        <span title={titleLabel} className="truncate flex-1 min-w-0" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {titleLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }} className="max-h-[300px] overflow-y-auto">
        <div className="animate-ai-glass-fade" style={{ marginBottom: 14, animationDelay: '0.05s' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Original</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, textDecoration: 'line-through', fontStyle: 'italic', wordBreak: 'break-word' }}>{original}</div>
        </div>
        <div className="animate-ai-glass-fade" style={{ animationDelay: '0.1s' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {actionLabel}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 450, lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {corrected}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`${pageTheme === 'light' ? 'ai-glass-header-light' : 'ai-glass-header'}`} style={{
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        padding: '10px 16px',
      }}>
        <button onClick={onDecline}
          className="ai-glass-btn"
          style={{
            ...btnGlass, color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
          Decline
        </button>
        <button onClick={onRefix}
          style={{
            ...btnGlass, color: '#fff',
            background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}35`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}18`; }}>
          {againLabel}
        </button>
        <button onClick={onAccept}
          style={{
            ...btnGlass, color: '#fff',
            background: `${ACCENT}22`, border: `1px solid ${ACCENT}35`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}45`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}22`; }}>
          Accept
        </button>
      </div>
    </div>
  );
}
