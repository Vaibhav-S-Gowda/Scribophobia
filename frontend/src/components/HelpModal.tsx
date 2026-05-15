import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export const HelpModal: React.FC = () => {
  const { isHelpOpen, setHelpOpen } = useCanvasStore();

  if (!isHelpOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Select Tool' },
    { key: 'P', desc: 'Pen Tool' },
    { key: 'T', desc: 'Text Tool' },
    { key: 'Delete / Backspace', desc: 'Delete selected object(s)' },
    { key: 'Ctrl + Z', desc: 'Undo last action' },
    { key: 'Ctrl + Y', desc: 'Redo last action' },
    { key: 'Alt + Drag', desc: 'Pan canvas' },
    { key: 'Mouse Wheel', desc: 'Zoom in/out' },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setHelpOpen(false); }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '32px',
        width: '480px',
        maxWidth: 'calc(100vw - 40px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}>
        <button
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'absolute',
            top: '16px', right: '16px',
            width: '32px', height: '32px',
            backgroundColor: '#f5f6f8', color: '#050038',
            border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '10px', backgroundColor: '#eef2ff', borderRadius: '12px', color: '#2d68ff' }}>
            <Keyboard size={24} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#050038', margin: 0 }}>
            Keyboard Shortcuts
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx === shortcuts.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '15px', color: '#6e7787' }}>{shortcut.desc}</span>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#050038', 
                backgroundColor: '#f5f6f8', 
                padding: '4px 10px', 
                borderRadius: '6px',
                border: '1px solid #e1e3e5'
              }}>
                {shortcut.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
