import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { socket, BOARD_ID } from '../lib/socket';
import { useCanvasStore, canvasEvents, type CanvasAction } from '../store/useCanvasStore';
import { getStickiesTemplate, get2x2MethodTemplate, getIcebreakerTemplate } from '../utils/templates';

const generateId = () => Math.random().toString(36).substring(2, 11);

function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
}

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const penSize = useCanvasStore((state) => state.penSize);
  const pushAction = useCanvasStore((state) => state.pushAction);

  const saveToStorage = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const json = JSON.stringify((canvas as any).toJSON(['id', 'nodeType', 'fromId', 'toId']));
      localStorage.setItem(`scribophobia_canvas_${BOARD_ID}`, json);
    } catch (e) {
      // Ignore storage errors (e.g. quota exceeded)
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 'transparent',
      selection: true,
      isDrawingMode: false,
    });
    
    fabricRef.current = canvas;
    (window as any).fabricCanvas = canvas;

    const STORAGE_KEY = `scribophobia_canvas_${BOARD_ID}`;

    // Restore from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        canvas.loadFromJSON(parsed).then(() => {
          canvas.renderAll();
        });
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    socket.on('canvas:sync', (objects: any[]) => {
      if (objects.length === 0) {
        // If backend is empty but we have local objects, push them to the backend instead of wiping the canvas
        if (canvas.getObjects().length > 0) {
          canvas.getObjects().forEach((obj: any) => {
            const state = obj.toObject(['id', 'nodeType', 'fromId', 'toId']);
            socket.emit('object:added', state);
          });
        }
        return;
      }
      
      canvas.clear();
      fabric.util.enlivenObjects(objects).then((enlivened: any[]) => {
        enlivened.forEach((obj: any) => {
           if (obj.globalCompositeOperation === 'destination-out') {
              obj.set({ selectable: false, evented: false, hoverCursor: 'default' });
           }
           canvas.add(obj);
        });
        canvas.renderAll();
        saveToStorage();
      });
    });

    socket.on('canvas:clear', () => {
      canvas.clear();
      canvas.renderAll();
      localStorage.removeItem(STORAGE_KEY);
    });

    socket.on('object:moving', (data: { id: string; delta: any }) => {
      const obj = canvas.getObjects().find((o: any) => o.id === data.id);
      if (obj) {
        obj.set(data.delta);
        obj.setCoords();
        canvas.renderAll();
      }
    });

    socket.on('object:modified', (data: { id: string; state: any }) => {
      const obj = canvas.getObjects().find((o: any) => o.id === data.id);
      if (obj) {
        if (data.state.deleted) {
          canvas.remove(obj);
          canvas.renderAll();
        } else {
          if (obj.type !== data.state.type) {
            fabric.util.enlivenObjects([data.state]).then((enlivened: any[]) => {
              canvas.remove(obj);
              canvas.add(enlivened[0]);
              canvas.renderAll();
            });
          } else {
            obj.set(data.state);
            obj.setCoords();
            canvas.renderAll();
          }
        }
      }
    });

    socket.on('object:added', (data: any) => {
       const existingObj = canvas.getObjects().find((o: any) => o.id === data.id);
       if(!existingObj){
          fabric.util.enlivenObjects([data]).then((enlivened: any[]) => {
            const newObj = enlivened[0] as any;
            if (newObj.globalCompositeOperation === 'destination-out') {
               newObj.set({ selectable: false, evented: false, hoverCursor: 'default' });
            }
            canvas.add(newObj);
            canvas.renderAll();
          });
       }
    });

    const emitMove = throttle((id: string, delta: any) => {
      socket.emit('object:moving', { id, delta });
    }, 1000 / 30); // ~30 fps

    canvas.on('object:moving', (e: any) => {
      const obj = e.target as any;
      if (!obj) return;
      if (!obj.id) obj.set('id', generateId());

      const lines = canvas.getObjects().filter((o: any) => o.nodeType === 'line' || o.type === 'line');
      lines.forEach((line: any) => {
        if (line.fromId === obj.id) {
          line.set({ x1: obj.left + (obj.width * (obj.scaleX || 1)) / 2, y1: obj.top + (obj.height * (obj.scaleY || 1)) / 2 });
        }
        if (line.toId === obj.id) {
          line.set({ x2: obj.left + (obj.width * (obj.scaleX || 1)) / 2, y2: obj.top + (obj.height * (obj.scaleY || 1)) / 2 });
        }
      });

      const delta = {
        left: obj.left,
        top: obj.top,
        angle: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
      };

      emitMove(obj.id, delta);
    });

    canvas.on('object:modified', (e: any) => {
      const obj = e.target as any;
      if (!obj) return;
      if (!obj.id) obj.set('id', generateId());
      
      const state = obj.toObject(['id', 'nodeType', 'fromId', 'toId']);
      
      if (obj.id && obj._originalState) {
         pushAction({
            type: 'modify',
            objectId: obj.id,
            previousState: obj._originalState,
            newState: state
         });
         delete obj._originalState;
      }
      
      socket.emit('object:modified', { id: obj.id, state });
      saveToStorage();
    });

    canvas.on('path:created', (e: any) => {
      const path = e.path;
      if (!path) return;
      
      const currentTool = useCanvasStore.getState().activeTool;
      
      if (currentTool === 'lasso') {
         path.setCoords();
         const pathRect = path.getBoundingRect();
         const selectedObjects = canvas.getObjects().filter((o: any) => {
            if (o === path || !o.id || !o.selectable) return false;
            if (o.globalCompositeOperation === 'destination-out') return false;
            const objRect = o.getBoundingRect();
            // AABB Intersection check
            return (
               objRect.left <= pathRect.left + pathRect.width &&
               objRect.left + objRect.width >= pathRect.left &&
               objRect.top <= pathRect.top + pathRect.height &&
               objRect.top + objRect.height >= pathRect.top
            );
         });

         canvas.remove(path);

         if (selectedObjects.length > 0) {
            if (selectedObjects.length === 1) {
                canvas.setActiveObject(selectedObjects[0]);
            } else {
                const activeSelection = new fabric.ActiveSelection(selectedObjects, { canvas });
                canvas.setActiveObject(activeSelection);
            }
            canvas.requestRenderAll();
         }
         
         useCanvasStore.getState().setActiveTool('select');
         return;
      }

      if (currentTool === 'eraser' || currentTool === 'pixel-eraser') {
         const intersectingObjects = canvas.getObjects().filter(o => 
             o !== path && (o as any).id && o.intersectsWithObject(path)
         );
         
         if (intersectingObjects.length > 0) {
            intersectingObjects.forEach(obj => {
               Promise.all([path.clone(), obj.clone()]).then(([eraserClone, objClone]: any[]) => {
                  eraserClone.set({
                     globalCompositeOperation: 'destination-out',
                     stroke: 'rgba(255, 255, 255, 1)',
                  });
                  
                  const group = new fabric.Group([objClone, eraserClone], {
                     id: (obj as any).id,
                     nodeType: (obj as any).nodeType,
                     fromId: (obj as any).fromId,
                     toId: (obj as any).toId,
                  } as any);
                  
                  canvas.remove(obj);
                  canvas.add(group);
                  canvas.renderAll();
                  
                  const newState = (group as any).toObject(['id', 'nodeType', 'fromId', 'toId']);
                  pushAction({
                     type: 'modify',
                     objectId: (group as any).id,
                     previousState: (obj as any).toObject(['id', 'nodeType', 'fromId', 'toId']),
                     newState: newState
                  });
                  socket.emit('object:modified', { id: (group as any).id, state: newState });
               });
            });
         }
         
         canvas.remove(path);
      } else {
         path.set({ id: generateId() });
         canvas.renderAll();
         const state = path.toObject(['id', 'globalCompositeOperation']);
         pushAction({
            type: 'add',
            objectId: path.id,
            newState: state
         });
         socket.emit('object:added', state);
         saveToStorage();
      }
    });

    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on('mouse:down', (opt: any) => {
      const evt = opt.e;
      
      if (opt.target && opt.target.id) {
         opt.target._originalState = opt.target.toObject(['id', 'nodeType', 'fromId', 'toId']);
      }
      
      if (evt.altKey || evt.button === 1) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        evt.preventDefault();
      }
    });

    canvas.on('mouse:move', (opt: any) => {
      if (isDragging) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
        }
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      if (isDragging) {
        canvas.setViewportTransform(canvas.viewportTransform as [number, number, number, number, number, number]);
        isDragging = false;
        const currentTool = useCanvasStore.getState().activeTool;
        if (currentTool === 'select') canvas.selection = true;
      }
    });

    canvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;
      
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY } as any, zoom);
      useCanvasStore.getState().setZoom(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    const handleResize = () => {
      canvas.setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('canvas:sync');
      socket.off('canvas:clear');
      socket.off('object:moving');
      socket.off('object:modified');
      socket.off('object:added');
      canvas.dispose();
    };
  }, [pushAction]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const canvasEl = canvas.getElement().parentElement as HTMLElement | null;

    if (activeTool === 'eraser') {
      canvas.defaultCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Crect x=\'3\' y=\'12\' width=\'18\' height=\'9\' rx=\'2\' fill=\'%23fff\' stroke=\'%23555\' stroke-width=\'1.5\'/%3E%3Cpath d=\'M3 12 L9 4 L21 4 L21 12\' fill=\'%23f87171\' stroke=\'%23555\' stroke-width=\'1.5\'/%3E%3C/svg%3E") 0 24, cell';
      if (canvasEl) canvasEl.style.cursor = canvas.defaultCursor;
    } else if (activeTool === 'pen') {
      canvas.defaultCursor = 'crosshair';
    } else if (activeTool === 'select') {
      canvas.defaultCursor = 'default';
    } else {
      canvas.defaultCursor = 'crosshair';
      if (canvasEl) canvasEl.style.cursor = 'crosshair';
    }

    const penTools = ['pen', 'marker', 'pixel-eraser', 'eraser', 'smart-pen', 'lasso'];
    canvas.isDrawingMode = penTools.includes(activeTool);

    if (canvas.isDrawingMode) {
      if (!canvas.freeDrawingBrush && fabric.PencilBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }
      if (canvas.freeDrawingBrush) {
        const currentSize = penSize;
        if (activeTool === 'eraser') {
           canvas.freeDrawingBrush.color = 'rgba(255, 255, 255, 1)';
           canvas.freeDrawingBrush.width = currentSize * 8;
        } else if (activeTool === 'pixel-eraser') {
           canvas.freeDrawingBrush.color = 'rgba(255, 255, 255, 1)';
           canvas.freeDrawingBrush.width = currentSize * 3;
        } else if (activeTool === 'marker') {
           canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
           canvas.freeDrawingBrush.width = currentSize * 5;
        } else if (activeTool === 'lasso') {
           canvas.freeDrawingBrush.color = 'rgba(59, 130, 246, 0.6)';
           canvas.freeDrawingBrush.width = 2;
           if ((canvas.freeDrawingBrush as any).getPatternSrc) {
             (canvas.freeDrawingBrush as any).strokeDashArray = [4, 4];
           }
        } else {
           canvas.freeDrawingBrush.color = '#050038';
           canvas.freeDrawingBrush.width = currentSize;
        }
      }
    }

    if (activeTool === 'select') {
      canvas.selection = true;
      canvas.forEachObject(o => { 
        if (o.globalCompositeOperation === 'destination-out') {
           o.selectable = false;
           o.evented = false;
        } else {
           o.selectable = true; 
           o.evented = true; 
        }
      });
    } else if (!canvas.isDrawingMode) {
      canvas.selection = false;
      canvas.forEachObject(o => { o.selectable = false; o.evented = false; });
    }
  }, [activeTool, penSize]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    const handleMouseDown = (options: any) => {
       const skipTools = ['select', 'pen', 'marker', 'pixel-eraser', 'eraser', 'smart-pen', 'line', 'lasso'];
       if (skipTools.includes(activeTool)) return;

       const pointer = options.scenePoint
         || (canvas as any).getScenePoint?.(options.e)
         || { x: options.e.clientX || 100, y: options.e.clientY || 100 };

       let newObj: any = null;
       const id = generateId();

       if (activeTool === 'text') {
         newObj = new fabric.IText('Text', {
           left: pointer.x, top: pointer.y,
           fontFamily: 'Inter, sans-serif', fill: '#050038', fontSize: 24, id,
         } as any);

       } else if (activeTool === 'sticky') {
         const color = useCanvasStore.getState().stickyColor;
         newObj = new fabric.Rect({
           left: pointer.x - 75, top: pointer.y - 75,
           fill: color, width: 150, height: 150,
           shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.25)', blur: 12, offsetX: 4, offsetY: 4 }),
           id,
         } as any);

       } else if (['server', 'database', 'client', 'queue', 'cache'].includes(activeTool)) {
         const nodeColors: Record<string, string> = {
           server: '#3b82f6', database: '#10b981', client: '#8b5cf6', queue: '#f59e0b', cache: '#ef4444',
         };
         const bg = new fabric.Rect({ left: 0, top: 0, width: 120, height: 60, rx: 8, ry: 8, fill: nodeColors[activeTool], stroke: '#fff', strokeWidth: 2 });
         const label = new fabric.IText(activeTool.charAt(0).toUpperCase() + activeTool.slice(1), {
           left: 60, top: 30, originX: 'center', originY: 'center',
           fontFamily: 'Inter, sans-serif', fill: '#fff', fontSize: 16, fontWeight: 600,
         });
         newObj = new fabric.Group([bg, label], { left: pointer.x - 60, top: pointer.y - 30, id, nodeType: activeTool } as any);

       } else if (activeTool === 'shape-line') {
         newObj = new fabric.Line(
           [pointer.x - 60, pointer.y, pointer.x + 60, pointer.y] as [number,number,number,number],
           { stroke: '#050038', strokeWidth: 2, fill: 'transparent', id } as any
         );

       } else if (activeTool === 'shape-arrow') {
         newObj = new fabric.Path(
           `M ${pointer.x - 60} ${pointer.y} L ${pointer.x + 50} ${pointer.y} M ${pointer.x + 35} ${pointer.y - 12} L ${pointer.x + 50} ${pointer.y} L ${pointer.x + 35} ${pointer.y + 12}`,
           { stroke: '#050038', strokeWidth: 2, fill: 'transparent', id } as any
         );

       } else if (activeTool === 'shape-elbow-arrow') {
         const ex = pointer.x, ey = pointer.y;
         newObj = new fabric.Path(
           `M ${ex - 60} ${ey + 40} L ${ex - 60} ${ey} L ${ex + 40} ${ey} M ${ex + 26} ${ey - 12} L ${ex + 40} ${ey} L ${ex + 26} ${ey + 12}`,
           { stroke: '#050038', strokeWidth: 2, fill: 'transparent', id } as any
         );

       } else if (activeTool === 'shape-block-arrow') {
         const bx = pointer.x, by = pointer.y;
         newObj = new fabric.Polygon(
           [{x:bx-60,y:by-15},{x:bx+20,y:by-15},{x:bx+20,y:by-30},{x:bx+60,y:by},{x:bx+20,y:by+30},{x:bx+20,y:by+15},{x:bx-60,y:by+15}],
           { stroke: '#050038', strokeWidth: 2, fill: 'rgba(5,0,56,0.08)', id } as any
         );

       } else if (activeTool === 'shape-rectangle') {
         newObj = new fabric.Rect({
           left: pointer.x - 60, top: pointer.y - 40,
           width: 120, height: 80, rx: 4, ry: 4,
           fill: 'rgba(255,255,255,0.8)', stroke: '#050038', strokeWidth: 2, id,
         } as any);

       } else if (activeTool === 'shape-oval') {
         newObj = new fabric.Ellipse({
           left: pointer.x - 70, top: pointer.y - 45,
           rx: 70, ry: 45,
           fill: 'rgba(255,255,255,0.8)', stroke: '#050038', strokeWidth: 2, id,
         } as any);

       } else if (activeTool === 'shape-rhombus') {
         const cx = pointer.x, cy = pointer.y;
         newObj = new fabric.Polygon(
           [{x:cx,y:cy-55},{x:cx+80,y:cy},{x:cx,y:cy+55},{x:cx-80,y:cy}],
           { fill: 'rgba(255,255,255,0.8)', stroke: '#050038', strokeWidth: 2, id } as any
         );

       } else if (activeTool === 'shape-triangle') {
         newObj = new fabric.Triangle({
           left: pointer.x - 60, top: pointer.y - 50,
           width: 120, height: 100,
           fill: 'rgba(255,255,255,0.8)', stroke: '#050038', strokeWidth: 2, id,
         } as any);

       } else if (activeTool === 'shape-divider') {
         newObj = new fabric.Line(
           [pointer.x - 120, pointer.y, pointer.x + 120, pointer.y] as [number,number,number,number],
           { stroke: '#6e7787', strokeWidth: 2, fill: 'transparent', id } as any
         );
       }

       if (newObj) {
         canvas.add(newObj);
         canvas.setActiveObject(newObj);
         canvas.renderAll();
         const state = newObj.toObject(['id', 'nodeType', 'fromId', 'toId'] as any[]);
         
         pushAction({
            type: 'add',
            objectId: newObj.id,
            newState: state
         });
         
         socket.emit('object:added', state);
         saveToStorage();
         setActiveTool('select');
       }
    };

    canvas.on('mouse:down', handleMouseDown);
    return () => {
       canvas.off('mouse:down', handleMouseDown);
    };
  }, [activeTool, setActiveTool, pushAction]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    let isDrawingLine = false;
    let currentLine: any = null;
    let startObj: any = null;

    const onMouseDown = (opt: any) => {
      if (activeTool !== 'line') return;
      
      const target = opt.target;
      if (!target) return;

      isDrawingLine = true;
      startObj = target;
      
      const pointer = opt.scenePoint || (canvas as any).getScenePoint?.(opt.e) || { x: opt.e.clientX, y: opt.e.clientY };
      const points = [
        startObj.left + (startObj.width * (startObj.scaleX || 1)) / 2, 
        startObj.top + (startObj.height * (startObj.scaleY || 1)) / 2, 
        pointer.x, pointer.y
      ];
      
      currentLine = new fabric.Line(points as [number, number, number, number], {
        strokeWidth: 3,
        fill: '#999',
        stroke: '#999',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        id: generateId(),
        nodeType: 'line',
        fromId: startObj.id
      } as any);
      
      canvas.add(currentLine);
      canvas.sendObjectToBack(currentLine);
    };

    const onMouseMove = (opt: any) => {
      if (!isDrawingLine || !currentLine) return;
      const pointer = opt.scenePoint || (canvas as any).getScenePoint?.(opt.e) || { x: opt.e.clientX, y: opt.e.clientY };
      currentLine.set({ x2: pointer.x, y2: pointer.y });
      canvas.requestRenderAll();
    };

    const onMouseUp = (opt: any) => {
      if (!isDrawingLine || !currentLine) return;
      isDrawingLine = false;

      const target = opt.target;
      if (target && target !== startObj && target.nodeType !== 'line') {
        const endObj = target;
        currentLine.set({
          x2: endObj.left + (endObj.width * (endObj.scaleX || 1)) / 2,
          y2: endObj.top + (endObj.height * (endObj.scaleY || 1)) / 2,
          toId: endObj.id
        });
        currentLine.setCoords();
        canvas.renderAll();
        
        socket.emit('object:added', currentLine.toObject(['id', 'nodeType', 'fromId', 'toId'] as any[]));

        if ((startObj.nodeType === 'server' && endObj.nodeType === 'database') || 
            (startObj.nodeType === 'database' && endObj.nodeType === 'server')) {
            
            console.log("🤖 Architecture Assist: Suggested Redis Cache!");
            
            const midX = (currentLine.x1 + currentLine.x2) / 2;
            const midY = (currentLine.y1 + currentLine.y2) / 2;
            
            const cacheRect = new fabric.Rect({
              left: 0, top: 0, width: 120, height: 60, rx: 8, ry: 8,
              fill: 'rgba(239, 68, 68, 0.2)',
              stroke: '#ef4444', strokeWidth: 2,
              shadow: new fabric.Shadow({ color: '#ef4444', blur: 20 })
            });
            
            const cacheText = new fabric.IText("Suggested:\nRedis Cache", {
              left: 60, top: 30, originX: 'center', originY: 'center',
              fontFamily: 'sans-serif', fill: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center'
            });
            
            const suggestion = new fabric.Group([cacheRect, cacheText], {
              left: midX - 60, top: midY - 30,
              id: generateId(), nodeType: 'cache_suggestion',
              hoverCursor: 'pointer'
            } as any);

            suggestion.on('mousedown', () => {
              suggestion.set('nodeType', 'cache');
              const innerRect = suggestion._objects[0];
              const innerText = suggestion._objects[1] as fabric.IText;
              innerRect.set({ fill: '#ef4444', shadow: null as any });
              innerText.set({ text: 'Cache' });
              
              socket.emit('object:added', suggestion.toObject(['id', 'nodeType'] as any[]));
              canvas.renderAll();
            });

            canvas.add(suggestion);
        }

        setActiveTool('select');
      } else {
        canvas.remove(currentLine);
      }
      currentLine = null;
      startObj = null;
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [activeTool, setActiveTool]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    const handleUndoRedo = (isUndo: boolean, action: CanvasAction) => {
      const targetState = isUndo ? action.previousState : action.newState;

      if (action.type === 'add') {
         if (isUndo) {
            const obj = canvas.getObjects().find((o: any) => o.id === action.objectId);
            if (obj) {
               canvas.remove(obj);
               socket.emit('object:modified', { id: action.objectId, state: { deleted: true } });
            }
         } else {
            fabric.util.enlivenObjects([targetState]).then((enlivened: any[]) => {
               canvas.add(enlivened[0]);
               socket.emit('object:added', targetState);
            });
         }
      } else if (action.type === 'modify') {
         const obj = canvas.getObjects().find((o: any) => o.id === action.objectId);
         if (obj && targetState) {
            if (obj.type !== targetState.type) {
               fabric.util.enlivenObjects([targetState]).then((enlivened: any[]) => {
                 canvas.remove(obj);
                 canvas.add(enlivened[0]);
               });
            } else {
               obj.set(targetState);
               obj.setCoords();
            }
            socket.emit('object:modified', { id: action.objectId, state: targetState });
         }
      }
      canvas.renderAll();
    };

    const onUndo = (e: any) => handleUndoRedo(true, e.detail);
    const onRedo = (e: any) => handleUndoRedo(false, e.detail);
    const onZoom = (e: any) => {
      canvas.zoomToPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 } as any, e.detail);
    };
    const onClear = () => {
      canvas.clear();
      canvas.renderAll();
      localStorage.removeItem('scribophobia_canvas');
    };

    const onAddTemplate = (e: any) => {
      const { templateName } = e.detail;

      // Safe viewport center calculation (works in all Fabric v7 versions)
      const vpt = canvas.viewportTransform;
      const cx = (window.innerWidth / 2 - (vpt ? vpt[4] : 0)) / (vpt ? vpt[0] : 1);
      const cy = (window.innerHeight / 2 - (vpt ? vpt[5] : 0)) / (vpt ? vpt[3] : 1);
      const center = { x: cx, y: cy };

      let objects: fabric.Object[] = [];
      if (templateName === 'Stickies') {
        objects = getStickiesTemplate(center);
      } else if (templateName === '2x2 Method') {
        objects = get2x2MethodTemplate(center);
      } else if (templateName === 'Icebreaker') {
        objects = getIcebreakerTemplate(center);
      }

      const { pushAction: _pushAction } = useCanvasStore.getState();
      objects.forEach(obj => {
        canvas.add(obj);
        socket.emit('object:added', obj.toObject(['id', 'nodeType']));
        _pushAction({ type: 'add', objectId: (obj as any).id, newState: obj.toObject(['id', 'nodeType']) });
      });
      canvas.renderAll();
      // Save after all template objects are added
      saveToStorage();
    };

    canvasEvents.addEventListener('undo', onUndo);
    canvasEvents.addEventListener('redo', onRedo);
    canvasEvents.addEventListener('zoom', onZoom);
    canvasEvents.addEventListener('clear', onClear);
    canvasEvents.addEventListener('add-template', onAddTemplate);

    return () => {
      canvasEvents.removeEventListener('undo', onUndo);
      canvasEvents.removeEventListener('redo', onRedo);
      canvasEvents.removeEventListener('zoom', onZoom);
      canvasEvents.removeEventListener('clear', onClear);
      canvasEvents.removeEventListener('add-template', onAddTemplate);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }
      
      const canvas = fabricRef.current;
      if (!canvas) return;
      const activeObjects = canvas.getActiveObjects();

      // Tool selection shortcuts
      if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('pen');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useCanvasStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }

      // Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (activeObjects.length > 0) {
          if (activeObjects.some((obj: any) => obj.isEditing)) return;
          
          activeObjects.forEach((obj: any) => {
            if (!obj.id) return;
            const state = obj.toObject(['id', 'nodeType', 'fromId', 'toId']);
            pushAction({
              type: 'modify',
              objectId: obj.id,
              previousState: state,
              newState: { deleted: true }
            });
            canvas.remove(obj);
            socket.emit('object:modified', { id: obj.id, state: { deleted: true } });
          });
          
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          // Save after deletion
          saveToStorage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pushAction]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
