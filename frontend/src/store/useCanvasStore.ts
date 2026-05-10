import { create } from 'zustand';

export type CanvasAction = {
  type: 'add' | 'modify' | 'remove';
  objectId: string;
  previousState?: any;
  newState?: any;
};

export const canvasEvents = new EventTarget();

export type ToolType =
  | 'select' | 'text' | 'sticky'
  | 'pen' | 'marker' | 'smart-pen' | 'eraser' | 'pixel-eraser' | 'lasso'
  | 'shape-line' | 'shape-arrow' | 'shape-elbow-arrow' | 'shape-block-arrow'
  | 'shape-rectangle' | 'shape-oval' | 'shape-rhombus' | 'shape-triangle' | 'shape-divider'
  | 'square' | 'circle'
  | 'line' | 'database' | 'server' | 'client' | 'queue' | 'cache';

interface CanvasState {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;
  isShareModalOpen: boolean;
  setShareModalOpen: (isOpen: boolean) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  undoStack: CanvasAction[];
  redoStack: CanvasAction[];
  pushAction: (action: CanvasAction) => void;
  undo: () => void;
  redo: () => void;
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  isDeveloperMode: false,
  toggleDeveloperMode: () => set((state) => ({ isDeveloperMode: !state.isDeveloperMode })),
  isShareModalOpen: false,
  setShareModalOpen: (isOpen) => set({ isShareModalOpen: isOpen }),
  penSize: 3,
  setPenSize: (size) => set({ penSize: size }),
  
  undoStack: [],
  redoStack: [],
  pushAction: (action) => set((state) => ({ 
    undoStack: [...state.undoStack, action],
    redoStack: []
  })),
  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const newUndo = [...state.undoStack];
      const action = newUndo.pop()!;
      canvasEvents.dispatchEvent(new CustomEvent('undo', { detail: action }));
      return { undoStack: newUndo, redoStack: [...state.redoStack, action] };
    });
  },
  redo: () => {
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const newRedo = [...state.redoStack];
      const action = newRedo.pop()!;
      canvasEvents.dispatchEvent(new CustomEvent('redo', { detail: action }));
      return { redoStack: newRedo, undoStack: [...state.undoStack, action] };
    });
  },
  
  zoom: 1,
  setZoom: (newZoom) => set((state) => ({
    zoom: typeof newZoom === 'function' ? newZoom(state.zoom) : newZoom
  })),
}));
