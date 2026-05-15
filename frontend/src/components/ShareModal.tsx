import React from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export const ShareModal: React.FC = () => {
  const { isShareModalOpen, setShareModalOpen } = useCanvasStore();

  if (!isShareModalOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setShareModalOpen(false); }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: '35px',
        padding: '40px 48px 36px',
        width: '660px',
        maxWidth: 'calc(100vw - 80px)',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}>

        {/* ── Close Button (outside top-right corner) ── */}
        <button
          onClick={() => setShareModalOpen(false)}
          style={{
            position: 'absolute',
            top: '16px', right: '16px',
            width: '36px', height: '36px',
            backgroundColor: '#f5f6f8', color: '#050038',
            border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* ── Guido Cursor (left, outside modal) ── */}
        <div style={{
          position: 'absolute', left: '-20px', top: '160px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#c026d3" style={{ transform: 'rotate(-45deg)' }}>
            <path d="M4 4l16 6-7 2-2 7-7-15z" />
          </svg>
          <div style={{
            backgroundColor: '#c026d3', color: '#fff',
            padding: '4px 12px', borderRadius: '16px',
            fontSize: '12px', fontWeight: 600, marginTop: '-5px',
          }}>
            Guido
          </div>
        </div>

        {/* ── Kate Cursor with curl (right, outside modal) ── */}
        <div style={{ position: 'absolute', right: '-40px', top: '120px', pointerEvents: 'none' }}>
          <div style={{
            backgroundColor: '#fbbf24', color: '#fff',
            padding: '4px 12px', borderRadius: '16px',
            fontSize: '12px', fontWeight: 600,
            marginBottom: '4px', display: 'inline-block',
          }}>
            Kate
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24"
            style={{ transform: 'rotate(135deg)', position: 'absolute', left: '-10px', top: '20px' }}>
            <path d="M4 4l16 6-7 2-2 7-7-15z" />
          </svg>
          <svg width="100" height="150" style={{ position: 'absolute', top: '30px', left: '-20px' }}>
            <path d="M0,0 Q30,50 80,40 T30,120 Q50,150 100,150" fill="none" stroke="#fbbf24" strokeWidth="2" />
          </svg>
        </div>

        {/* ── Heading ── */}
        <h1 style={{
          fontSize: '26px', fontWeight: 700, color: '#050038',
          marginBottom: '12px', lineHeight: 1.3,
        }}>
          Don't keep these genius ideas to yourself.<br />
          Because two cursors are better than one
        </h1>

        <p style={{ fontSize: '16px', color: '#050038', marginBottom: '24px' }}>
          Share this link with other people.
        </p>

        {/* ── Link Input ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #e1e3e5',
          borderRadius: '30px',
          padding: '4px 4px 4px 20px',
          marginBottom: '24px',
        }}>
          <input
            type="text"
            readOnly
            value="https://webwhiteboard.com/board/uXj..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: '16px', color: '#6e7787', background: 'transparent',
              minWidth: 0,
            }}
          />
          <button style={{
            backgroundColor: '#2d68ff', color: '#fff', border: 'none',
            padding: '12px 32px', borderRadius: '24px',
            fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            flexShrink: 0,
          }}>
            Copy link
          </button>
        </div>

        {/* ── Footer ── */}
        <p style={{ fontSize: '14px', color: '#050038', lineHeight: 1.5 }}>
          Try Miro for business to make your boards private and<br />
          manage access.{' '}
          <a href="#" style={{ color: '#2d68ff', textDecoration: 'none' }}>Sign up for free</a>
        </p>
      </div>
    </div>
  );
};
