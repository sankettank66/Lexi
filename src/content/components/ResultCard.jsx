import React, { useState, useEffect, useRef } from 'react';

export default function ResultCard({ original, corrected, action, onAccept, onDecline, onRefix, selInfo }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [pos, setPos] = useState({});
  const cardRef = useRef(null);

  /* Typing effect */
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!corrected) return;
    let i = 0;
    const slowAt = Math.max(0, corrected.length - 15);
    const tick = () => {
      if (i >= corrected.length) { setDone(true); return; }
      setDisplayed(corrected.slice(0, i + 1));
      i++;
      setTimeout(tick, i >= slowAt ? 50 : 30);
    };
    tick();
  }, [corrected]);

  /* Position near the selection */
  useEffect(() => {
    const info = selInfo;
    if (!info) {
      setPos({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
      return;
    }
    if (info.type === 'input' || info.type === 'textarea') {
      const r = info.element.getBoundingClientRect();
      setPos({ top: Math.min(r.bottom + 8, window.innerHeight - 300), left: Math.max(8, r.left + 8) });
      return;
    }
    if (info.range) {
      const r = info.range.getBoundingClientRect();
      let t = r.bottom + 8;
      let l = r.left;
      if (t + 300 > window.innerHeight) t = Math.max(8, r.top - 300);
      if (l + 400 > window.innerWidth - 16) l = Math.max(8, window.innerWidth - 416);
      setPos({ top: Math.max(8, t), left: Math.max(8, l) });
      return;
    }
    setPos({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
  }, [selInfo]);

  const label = action === 'rephrase' ? 'Rephrase' : 'Fix Grammar';
  const refixLabel = action === 'rephrase' ? 'Rephrase Again' : 'Fix Again';
  const correctedLabel = action === 'rephrase' ? 'Rephrased' : 'Corrected';

  return (
    <div ref={cardRef}
      className="fixed bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl ai-grammar-shadow w-[400px] animate-ai-slide-up overflow-hidden"
      style={{ ...pos, position: 'fixed', zIndex: 2147483647, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#242424] border-b border-[#2e2e2e]">
        <span className={`w-2 h-2 rounded-full shrink-0 ${action === 'rephrase' ? 'bg-blue-500' : 'bg-emerald-500'}`}
          style={action === 'rephrase' ? { boxShadow: '0 0 6px rgba(59,130,246,0.4)' } : { boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} />
        <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">{label}</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        <div>
          <div className="text-[10px] text-gray-600 font-medium uppercase tracking-wider mb-1">Original</div>
          <div className="text-sm text-gray-500 line-through italic break-words">{original}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-600 font-medium uppercase tracking-wider mb-1">{correctedLabel}</div>
          <div className="text-sm text-gray-100 font-[450] break-words whitespace-pre-wrap">
            {displayed}
            {!done && <span className={`inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom ${action === 'rephrase' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 justify-end px-4 py-3 bg-[#242424] border-t border-[#2e2e2e]">
        <button onClick={onDecline}
          className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#333] text-gray-400 hover:bg-[#444] hover:text-gray-200 transition-colors">
          Decline
        </button>
        <button onClick={onRefix}
          className="px-3.5 py-2 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: action === 'rephrase' ? '#3b82f6' : '#10b981' }}>
          {refixLabel}
        </button>
        <button onClick={onAccept} disabled={!done}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#10b981' }}>
          Accept
        </button>
      </div>
    </div>
  );
}
