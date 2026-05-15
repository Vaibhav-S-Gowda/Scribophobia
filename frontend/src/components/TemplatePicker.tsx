import React, { useRef, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { canvasEvents } from '../store/useCanvasStore';

interface TemplatePickerProps {
  buttonRect: DOMRect;
  onClose: () => void;
}

const TEMPLATE_NAMES = ['Stickies', '2x2 Method', 'Icebreaker'];

// ── Preview Components ──────────────────────────────────────────

const StickiesPreview = () => {
  const colors = ['#b39bc8', '#e0a6bb', '#a3c4f3', '#8bd3c7', '#c7e57b', '#fde375'];
  return (
    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
      {colors.map((color, i) => (
        <div key={i} style={{ position: 'relative', width: '90px', height: '90px' }}>
          {[3, 2, 1, 0].map(offset => (
            <div key={offset} style={{
              position: 'absolute',
              left: offset * 6, top: offset * 6,
              width: '84px', height: '84px',
              backgroundColor: color,
              borderRadius: '2px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
};

const Method2x2Preview = () => (
  <div style={{ padding: '16px', width: '260px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', height: '220px', position: 'relative' }}>
      {[
        { bg: '#e5f2db', text: 'DO IT NOW', color: '#7cb342' },
        { bg: '#eef7e5', text: 'DO IT NEXT', color: '#9ccc65' },
        { bg: '#faead6', text: "DO IT IF/WHEN\nTHERE'S TIME", color: '#ffb74d' },
        { bg: '#e8e9ea', text: "DON'T DO IT", color: '#9e9e9e' },
      ].map((q, i) => (
        <div key={i} style={{ backgroundColor: q.bg, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: q.color, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{q.text}</span>
        </div>
      ))}
      {/* Axis lines */}
      <div style={{ position: 'absolute', left: '50%', top: '-8px', bottom: '-8px', width: '2px', backgroundColor: '#1e1e24', transform: 'translateX(-50%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '-8px', right: '-8px', height: '2px', backgroundColor: '#1e1e24', transform: 'translateY(-50%)' }} />
    </div>
    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', fontWeight: 500 }}>
      <span>LOW VALUE</span><span>HIGH VALUE</span>
    </div>
  </div>
);

const IcebreakerPreview = () => (
  <div style={{ padding: '16px', display: 'flex', gap: '12px', width: '280px' }}>
    {/* Dark Card */}
    <div style={{ flex: '0 0 110px', background: '#3c3c3c', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>Pick a question</div>
      {[140, 100, 60].map((w, i) => (
        <div key={i} style={{ height: '8px', backgroundColor: i === 0 ? '#b3b3b3' : i === 1 ? '#808080' : '#d9d9d9', borderRadius: '4px', width: w }} />
      ))}
    </div>
    {/* Light Card */}
    <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#050038', textAlign: 'center' }}>Visualize an answer</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, backgroundColor: '#4285f4', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', borderRadius: '2px' }} />
        <div style={{ width: 32, height: 32, backgroundColor: '#fbc02d', borderRadius: '6px' }} />
        <div style={{ width: 32, height: 32, backgroundColor: '#e53935', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
        <div style={{ width: 32, height: 32, backgroundColor: '#a3c4f3', borderRadius: '6px' }} />
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ buttonRect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items = [
    { label: 'Diagrams ChatGPT', isExternal: true },
    { label: 'Stickies' },
    { label: '2x2 Method' },
    { label: 'Icebreaker' },
    { label: 'Quick Retro' },
    { label: 'Flowcharts', isExternal: true },
    { label: 'View all...' },
  ];

  return (
    <div ref={pickerRef} style={{ position: 'absolute', left: '70px', top: Math.max(20, buttonRect.top - 80) + 'px', display: 'flex', alignItems: 'flex-start', gap: '8px', zIndex: 300, pointerEvents: 'auto' }}>
      {/* ── Main Menu ── */}
      <div className="floating-panel" style={{
        width: '180px', padding: '6px 0', display: 'flex', flexDirection: 'column',
        backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}>
        {items.map((item, idx) => {
          const isTemplateItem = TEMPLATE_NAMES.includes(item.label);
          const isHovered = hoveredTemplate === item.label;
          return (
            <div key={idx} style={{ padding: '2px 8px' }}>
              <button
                onClick={() => {
                  if (!item.isExternal && item.label !== 'View all...') {
                    canvasEvents.dispatchEvent(new CustomEvent('add-template', {
                      detail: { templateName: item.label }
                    }));
                  }
                  onClose();
                }}
                onMouseEnter={() => isTemplateItem && setHoveredTemplate(item.label)}
                onMouseLeave={() => isTemplateItem && setHoveredTemplate(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  width: '100%', padding: '8px 12px',
                  backgroundColor: isHovered ? '#eef2ff' : 'transparent',
                  borderRadius: '6px', border: 'none', color: '#050038',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                  transition: 'background-color 0.1s ease',
                }}
              >
                {item.label}
                {item.isExternal && <ExternalLink size={14} style={{ color: '#8e96a4' }} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Hover Preview Panel ── */}
      {hoveredTemplate && (
        <div className="floating-panel" style={{
          backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          borderRadius: '16px', overflow: 'hidden', pointerEvents: 'none',
        }}>
          {hoveredTemplate === 'Stickies' && <StickiesPreview />}
          {hoveredTemplate === '2x2 Method' && <Method2x2Preview />}
          {hoveredTemplate === 'Icebreaker' && <IcebreakerPreview />}
        </div>
      )}
    </div>
  );
};
