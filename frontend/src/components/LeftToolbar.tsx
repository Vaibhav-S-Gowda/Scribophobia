import React, { useRef, useState } from 'react';
import {
  MousePointer2, StickyNote, Type, LayoutTemplate,
  Undo, Redo, Eraser, Pen, Trash2,
  Database, Server, Laptop, List, ArrowRight, Component,
  ChevronDown
} from 'lucide-react';
import { socket } from '../lib/socket';
import { useCanvasStore, type ToolType } from '../store/useCanvasStore';
import { ShapePicker } from './ShapePicker';
import { PenPicker } from './PenPicker';
import { EraserPicker } from './EraserPicker';

const ShapesGridIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1.5" y="1.5" width="8.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.6"/>
    <polygon points="17,1.5 21.5,8.5 12.5,8.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
    <circle cx="5.5" cy="16.5" r="4" stroke="currentColor" strokeWidth="1.6"/>
    <line x1="13.5" y1="20.5" x2="20.5" y2="13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <polyline points="16.5,13.5 20.5,13.5 20.5,17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const SHAPE_TOOLS: ToolType[] = [
  'shape-line', 'shape-arrow', 'shape-elbow-arrow', 'shape-block-arrow',
  'shape-rectangle', 'shape-oval', 'shape-rhombus', 'shape-triangle', 'shape-divider',
];

export const LeftToolbar: React.FC = () => {
  const { activeTool, setActiveTool, isDeveloperMode, undo, redo, undoStack, redoStack } = useCanvasStore();
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);
  const [penPickerRect, setPenPickerRect] = useState<DOMRect | null>(null);
  const [eraserPickerRect, setEraserPickerRect] = useState<DOMRect | null>(null);
  const shapeBtnRef = useRef<HTMLButtonElement>(null);
  const penBtnRef = useRef<HTMLButtonElement>(null);
  const eraserBtnRef = useRef<HTMLButtonElement>(null);

  const PEN_TOOLS = ['pen','marker','smart-pen','lasso'];
  const ERASER_TOOLS = ['eraser','pixel-eraser'];
  const isPenToolActive = PEN_TOOLS.includes(activeTool as string);
  const isEraserToolActive = ERASER_TOOLS.includes(activeTool as string);
  const isShapeActive = SHAPE_TOOLS.includes(activeTool as ToolType);

  const toolBtn = (tool: ToolType, icon: React.ReactNode, title: string) => {
    const active = activeTool === tool;
    return (
      <button
        key={tool}
        className={`tool-btn ${active ? 'active' : ''}`}
        style={{ width: '40px', height: '40px' }}
        title={title}
        onClick={() => setActiveTool(tool)}
      >
        {icon}
      </button>
    );
  };

  const openPicker = () => {
    if (!shapeBtnRef.current) return;
    const rect = shapeBtnRef.current.getBoundingClientRect();
    setPenPickerRect(null);
    setEraserPickerRect(null);
    setPickerRect(prev => (prev ? null : rect));
  };

  const handleClearBoard = () => {
    if (window.confirm('Are you sure you want to clear the entire board? This action cannot be undone.')) {
      socket.emit('canvas:clear');
    }
  };

  const openPenPicker = () => {
    if (!penBtnRef.current) return;
    const rect = penBtnRef.current.getBoundingClientRect();
    setPickerRect(null);
    setEraserPickerRect(null);
    setPenPickerRect(prev => (prev ? null : rect));
  };

  const openEraserPicker = () => {
    if (!eraserBtnRef.current) return;
    const rect = eraserBtnRef.current.getBoundingClientRect();
    setPickerRect(null);
    setPenPickerRect(null);
    setEraserPickerRect(prev => (prev ? null : rect));
  };

  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 200,
      pointerEvents: 'none',
    }}>

      {/* ── Main Tools Panel ── */}
      <div className="floating-panel" style={{
        flexDirection: 'column', padding: '8px', gap: '4px', pointerEvents: 'auto',
      }}>
        {toolBtn('select', <MousePointer2 size={20} />, 'Select')}

        {!isDeveloperMode ? (
          <>
            <button className="tool-btn" style={{ width: '40px', height: '40px' }} title="Templates">
              <LayoutTemplate size={20} />
            </button>
            {toolBtn('sticky', <StickyNote size={20} />, 'Sticky Note')}
            {toolBtn('text', <Type size={20} />, 'Text')}

            {/* Shapes button → opens ShapePicker */}
            <button
              ref={shapeBtnRef}
              className={`tool-btn ${isShapeActive ? 'active' : ''}`}
              style={{ width: '40px', height: '40px' }}
              title="Shapes"
              onClick={openPicker}
            >
              <ShapesGridIcon />
            </button>

            {/* Pen button → opens PenPicker */}
            <button
              ref={penBtnRef}
              className={`tool-btn ${isPenToolActive ? 'active' : ''}`}
              style={{ width: '40px', height: '40px' }}
              title="Pen"
              onClick={openPenPicker}
            >
              <Pen size={20} />
            </button>
            {/* Eraser button → opens EraserPicker */}
            <button
              ref={eraserBtnRef}
              className={`tool-btn ${isEraserToolActive ? 'active' : ''}`}
              style={{ width: '40px', height: '40px' }}
              title="Eraser"
              onClick={openEraserPicker}
            >
              <Eraser size={20} />
            </button>

            <button
              className="tool-btn"
              style={{ width: '40px', height: '40px', color: 'var(--color-text-secondary)' }}
              title="More tools"
            >
              <ChevronDown size={18} />
            </button>
          </>
        ) : (
          <>
            {toolBtn('line', <ArrowRight size={20} />, 'Connect (Line)')}
            <div style={{ height: '1px', width: '24px', backgroundColor: 'var(--color-border)', margin: '4px auto' }} />
            {toolBtn('server',   <Server size={20} />,    'Server')}
            {toolBtn('database', <Database size={20} />,  'Database')}
            {toolBtn('client',   <Laptop size={20} />,    'Client')}
            {toolBtn('queue',    <List size={20} />,      'Message Queue')}
            {toolBtn('cache',    <Component size={20} />, 'Cache Node')}
            {toolBtn('pen',      <Pen size={20} />,       'Pen')}
            {toolBtn('eraser',   <Eraser size={20} />,    'Eraser')}
          </>
        )}
      </div>

      {/* ── Undo / Redo Panel ── */}
      <div className="floating-panel" style={{
        flexDirection: 'column', padding: '8px', gap: '4px', pointerEvents: 'auto',
      }}>
        <button 
          className="tool-btn" 
          style={{ width: '40px', height: '40px', color: undoStack.length > 0 ? '#050038' : 'var(--color-text-secondary)', opacity: undoStack.length > 0 ? 1 : 0.5 }} 
          title="Undo"
          onClick={undo}
          disabled={undoStack.length === 0}
        >
          <Undo size={20} />
        </button>
        <button 
          className="tool-btn" 
          style={{ width: '40px', height: '40px', color: redoStack.length > 0 ? '#050038' : 'var(--color-text-secondary)', opacity: redoStack.length > 0 ? 1 : 0.5 }} 
          title="Redo"
          onClick={redo}
          disabled={redoStack.length === 0}
        >
          <Redo size={20} />
        </button>
        <div style={{ height: '1px', width: '24px', backgroundColor: 'var(--color-border)', margin: '4px auto' }} />
        <button 
          className="tool-btn" 
          style={{ width: '40px', height: '40px', color: '#ef4444' }} 
          title="Clear Board"
          onClick={handleClearBoard}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* ── Shape Picker Popup ── */}
      {pickerRect && (
        <ShapePicker
          buttonRect={pickerRect}
          onClose={() => setPickerRect(null)}
        />
      )}

      {/* ── Pen Picker Popup ── */}
      {penPickerRect && (
        <PenPicker
          buttonRect={penPickerRect}
          onClose={() => setPenPickerRect(null)}
        />
      )}

      {/* ── Eraser Picker Popup ── */}
      {eraserPickerRect && (
        <EraserPicker
          buttonRect={eraserPickerRect}
          onClose={() => setEraserPickerRect(null)}
        />
      )}
    </div>
  );
};
