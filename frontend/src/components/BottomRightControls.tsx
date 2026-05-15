import React from 'react';
import { HelpCircle, Map, Minus, Plus } from 'lucide-react';
import { useCanvasStore, canvasEvents } from '../store/useCanvasStore';

export const BottomRightControls: React.FC = () => {
  const zoom = useCanvasStore((state) => state.zoom);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const { setHelpOpen, isHelpOpen, setMinimapOpen, isMinimapOpen } = useCanvasStore();

  const handleZoomIn = () => {
    const newZoom = Math.min(5, zoom + 0.1);
    setZoom(newZoom);
    canvasEvents.dispatchEvent(new CustomEvent('zoom', { detail: newZoom }));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, zoom - 0.1);
    setZoom(newZoom);
    canvasEvents.dispatchEvent(new CustomEvent('zoom', { detail: newZoom }));
  };
  return (
    <div style={{
      position: 'absolute',
      right: '20px',
      bottom: '20px',
      zIndex: 100,
      pointerEvents: 'none'
    }}>
      <div className="floating-panel" style={{ padding: '4px', pointerEvents: 'auto', gap: '4px' }}>
        <button className="tool-btn" style={{ padding: '8px' }} onClick={handleZoomOut} title="Zoom Out">
          <Minus size={18} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: 500, width: '48px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="tool-btn" style={{ padding: '8px' }} onClick={handleZoomIn} title="Zoom In">
          <Plus size={18} />
        </button>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 4px' }} />
        
        <button 
          className={`tool-btn ${isHelpOpen ? 'active' : ''}`} 
          style={{ padding: '8px' }} 
          onClick={() => setHelpOpen(!isHelpOpen)}
          title="Shortcuts & Help"
        >
          <HelpCircle size={18} />
        </button>
        <button 
          className={`tool-btn ${isMinimapOpen ? 'active' : ''}`} 
          style={{ padding: '8px' }} 
          onClick={() => setMinimapOpen(!isMinimapOpen)}
          title="Minimap"
        >
          <Map size={18} />
        </button>
      </div>
    </div>
  );
};
