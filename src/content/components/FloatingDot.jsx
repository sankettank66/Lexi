import React, { useState, useRef, useEffect, forwardRef } from 'react';

const FloatingDot = forwardRef(function FloatingDot({ x, y, onFix, onRephrase, onClose }, ref) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const popRef = useRef(null);

  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 200); };

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) && ref?.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, ref]);

  const popStyle = {};
  const POP_HEIGHT = 112;
  if (y - POP_HEIGHT < 8) {
    popStyle.top = '100%';
    popStyle.marginTop = '8px';
  } else {
    popStyle.bottom = '100%';
    popStyle.marginBottom = '8px';
  }

  return (
    <div ref={ref}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 2147483647,
      }}
      onMouseEnter={show}
      onMouseLeave={hide}>
      {/* Dot */}
      <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 ai-grammar-shadow cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 ai-grammar-glow-green"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)' }} />

      {/* Tooltip */}
      {open && (
        <div ref={popRef}
          className="absolute left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl ai-grammar-shadow p-2 w-44 animate-ai-slide-up"
          style={popStyle}
          onMouseEnter={show}
          onMouseLeave={hide}>
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider px-2 pb-1.5 pt-0.5">AI Grammar</div>
          <button onClick={onFix}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            Fix Grammar
          </button>
          <button onClick={onRephrase}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            Rephrase
          </button>
        </div>
      )}
    </div>
  );
});

export default FloatingDot;
