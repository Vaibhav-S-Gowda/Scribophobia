import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '../store/useCanvasStore';

export const Minimap: React.FC = () => {
  const { isMinimapOpen, setMinimapOpen } = useCanvasStore();
  const [mapUrl, setMapUrl] = useState<string>('');
  const [viewportBox, setViewportBox] = useState({ left: 0, top: 0, width: 100, height: 100 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMinimapOpen) return;
    const canvas = (window as any).fabricCanvas;
    if (!canvas) return;

    let timeout: ReturnType<typeof setTimeout>;

    const updateMinimap = () => {
      if (!canvas) return;
      const objects = canvas.getObjects();
      if (objects.length === 0) {
        setMapUrl('');
        return;
      }

      // Calculate bounding box of all objects
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      objects.forEach((obj: any) => {
        const br = obj.getBoundingRect();
        if (br.left < minX) minX = br.left;
        if (br.top < minY) minY = br.top;
        if (br.left + br.width > maxX) maxX = br.left + br.width;
        if (br.top + br.height > maxY) maxY = br.top + br.height;
      });

      // Add padding
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      try {
        const url = canvas.toDataURL({
          left: minX,
          top: minY,
          width: contentWidth,
          height: contentHeight,
          multiplier: 200 / Math.max(contentWidth, contentHeight), // Scale down to fit 200px max
          format: 'png'
        });
        setMapUrl(url);

        // Calculate Viewport
        const vpt = canvas.viewportTransform;
        if (vpt) {
          const zoom = canvas.getZoom();
          const vpLeft = -vpt[4] / zoom;
          const vpTop = -vpt[5] / zoom;
          const vpWidth = canvas.getWidth() / zoom;
          const vpHeight = canvas.getHeight() / zoom;

          // Map viewport to minimap coordinates
          const scaleX = 200 / contentWidth;
          const scaleY = 150 / contentHeight; // Assuming map max is 200x150
          const mapScale = Math.min(scaleX, scaleY);
          
          const actualMapW = contentWidth * mapScale;
          const actualMapH = contentHeight * mapScale;
          
          const offsetX = (200 - actualMapW) / 2;
          const offsetY = (150 - actualMapH) / 2;

          setViewportBox({
            left: offsetX + (vpLeft - minX) * mapScale,
            top: offsetY + (vpTop - minY) * mapScale,
            width: vpWidth * mapScale,
            height: vpHeight * mapScale
          });
        }
      } catch (e) {
        // Taint error if images from cross-origin are on canvas
      }
    };

    const debouncedUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateMinimap, 300);
    };

    updateMinimap();

    canvas.on('object:added', debouncedUpdate);
    canvas.on('object:modified', debouncedUpdate);
    canvas.on('object:removed', debouncedUpdate);
    canvas.on('mouse:up', debouncedUpdate);
    canvas.on('mouse:wheel', debouncedUpdate);

    return () => {
      clearTimeout(timeout);
      canvas.off('object:added', debouncedUpdate);
      canvas.off('object:modified', debouncedUpdate);
      canvas.off('object:removed', debouncedUpdate);
      canvas.off('mouse:up', debouncedUpdate);
      canvas.off('mouse:wheel', debouncedUpdate);
    };
  }, [isMinimapOpen]);

  if (!isMinimapOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      right: '20px',
      bottom: '80px', // Above bottom controls
      width: '220px',
      height: '190px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 99,
      pointerEvents: 'auto',
      border: '1px solid #e1e3e5'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#f9fafb'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#050038' }}>Map</span>
        <button
          onClick={() => setMinimapOpen(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6e7787', display: 'flex', alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div 
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#f5f6f8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px'
        }}
      >
        {mapUrl ? (
          <div style={{ position: 'relative', width: '200px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mapUrl} alt="Minimap" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            <div style={{
              position: 'absolute',
              left: `${Math.max(0, viewportBox.left)}px`,
              top: `${Math.max(0, viewportBox.top)}px`,
              width: `${Math.min(200, viewportBox.width)}px`,
              height: `${Math.min(150, viewportBox.height)}px`,
              border: '2px solid #2d68ff',
              backgroundColor: 'rgba(45, 104, 255, 0.1)',
              boxSizing: 'border-box',
              pointerEvents: 'none'
            }} />
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#a0aabf' }}>Empty canvas</span>
        )}
      </div>
    </div>
  );
};
