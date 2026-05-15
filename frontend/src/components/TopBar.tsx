import React from 'react';
import { Share, Settings, User, Code } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export const TopBar: React.FC = () => {
  const { isDeveloperMode, toggleDeveloperMode } = useCanvasStore();
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      backgroundColor: 'transparent',
      zIndex: 100,
      pointerEvents: 'none'
    }}>
      
      {/* Left section: Logo */}
      <div className="floating-panel" style={{ padding: '8px 16px', pointerEvents: 'auto' }}>
        <div style={{ fontWeight: 600, fontSize: '15px' }}>Scribophobia</div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>The Best Drawing Board</div>
      </div>

      {/* Center section: Banner (Commented out for later use)
      <div className="floating-panel" style={{ padding: '4px 4px 4px 16px', pointerEvents: 'auto', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ fontWeight: 500, marginRight: '4px' }}>24h</span> left to save your board.
        </div>
        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
          Sign up for free
        </button>
      </div>
      */}

      {/* Developer Mode Toggle */}
      <div className="floating-panel" style={{ padding: '4px 12px', pointerEvents: 'auto', gap: '8px', position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '-45px' }}>
        <button 
          onClick={toggleDeveloperMode}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            background: isDeveloperMode ? 'rgba(45, 104, 255, 0.1)' : 'transparent',
            color: isDeveloperMode ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer',
            fontWeight: 500, fontSize: '13px'
          }}
        >
          <Code size={16} /> {isDeveloperMode ? 'Developer Mode: ON' : 'Developer Mode: OFF'}
        </button>
      </div>

        {/* Right section: Avatars & Share */}
        <div className="floating-panel" style={{ padding: '4px', pointerEvents: 'auto', gap: '8px' }}>
          <button className="tool-btn" style={{ padding: '8px' }}>
            <Settings size={18} />
          </button>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', gap: '6px', backgroundColor: '#fbbf24', color: '#050038' }}
            onClick={() => useCanvasStore.getState().setJoinModalOpen(true)}
          >
            <User size={16} /> Join board
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', gap: '6px' }}
            onClick={() => useCanvasStore.getState().setShareModalOpen(true)}
          >
            <Share size={16} /> Share board
          </button>
        </div>

    </div>
  );
};
