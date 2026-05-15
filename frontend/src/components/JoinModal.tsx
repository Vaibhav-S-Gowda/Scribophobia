import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export const JoinModal: React.FC = () => {
  const { isJoinModalOpen, setJoinModalOpen } = useCanvasStore();
  const [link, setLink] = useState('');

  if (!isJoinModalOpen) return null;

  const handleJoin = () => {
    if (link) {
      window.location.href = link;
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setJoinModalOpen(false); }}
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

        {/* ── Close Button ── */}
        <button
          onClick={() => setJoinModalOpen(false)}
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

        {/* ── Decorative Cursors ── */}
        <div style={{
          position: 'absolute', left: '-20px', top: '160px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#10b981" style={{ transform: 'rotate(-45deg)' }}>
            <path d="M4 4l16 6-7 2-2 7-7-15z" />
          </svg>
          <div style={{
            backgroundColor: '#10b981', color: '#fff',
            padding: '4px 12px', borderRadius: '16px',
            fontSize: '12px', fontWeight: 600, marginTop: '-5px',
          }}>
            Alex
          </div>
        </div>

        <div style={{ position: 'absolute', right: '-40px', top: '120px', pointerEvents: 'none' }}>
          <div style={{
            backgroundColor: '#3b82f6', color: '#fff',
            padding: '4px 12px', borderRadius: '16px',
            fontSize: '12px', fontWeight: 600,
            marginBottom: '4px', display: 'inline-block',
          }}>
            Sam
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6"
            style={{ transform: 'rotate(135deg)', position: 'absolute', left: '-10px', top: '20px' }}>
            <path d="M4 4l16 6-7 2-2 7-7-15z" />
          </svg>
        </div>

        {/* ── Heading ── */}
        <h1 style={{
          fontSize: '26px', fontWeight: 700, color: '#050038',
          marginBottom: '12px', lineHeight: 1.3,
        }}>
          Join a Collaborative Board<br />
          Paste the link below
        </h1>

        <p style={{ fontSize: '16px', color: '#050038', marginBottom: '24px' }}>
          Enter the board link shared with you to start collaborating.
        </p>

        {/* ── Link Input ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #e1e3e5',
          borderRadius: '30px',
          padding: '4px 4px 4px 20px',
          marginBottom: '24px',
          backgroundColor: '#f5f6f8',
        }}>
          <input
            type="text"
            placeholder="https://.../?boardId=..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: '16px', color: '#050038', background: 'transparent',
              minWidth: 0,
            }}
            autoFocus
          />
          <button
            onClick={handleJoin}
            style={{
              backgroundColor: '#fbbf24', color: '#050038', border: 'none',
              padding: '12px 32px', borderRadius: '24px',
              fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}>
            Join board
          </button>
        </div>

        {/* ── Footer ── */}
        <p style={{ fontSize: '14px', color: '#6e7787', lineHeight: 1.5 }}>
          Make sure you have the correct link from the board owner.
        </p>
      </div>
    </div>
  );
};
