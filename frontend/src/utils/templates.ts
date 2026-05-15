import * as fabric from 'fabric';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getStickiesTemplate = (pointer: { x: number; y: number }): fabric.Object[] => {
  const objects: fabric.Object[] = [];
  const colors = ['#b39bc8', '#e0a6bb', '#a3c4f3', '#8bd3c7', '#c7e57b', '#fde375'];
  
  // 6 stacks of stickies (3 columns x 2 rows)
  const startX = pointer.x - 300;
  const startY = pointer.y - 200;
  
  colors.forEach((color, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const baseX = startX + col * 200;
    const baseY = startY + row * 200;
    
    // Create 4 staggered stickies per stack
    for (let i = 0; i < 4; i++) {
      const sticky = new fabric.Rect({
        left: baseX + i * 10,
        top: baseY + i * 10,
        fill: color,
        width: 140,
        height: 140,
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 8, offsetX: 2, offsetY: 2 }),
        id: generateId(),
      } as any);
      objects.push(sticky);
    }
  });

  return objects;
};

export const get2x2MethodTemplate = (pointer: { x: number; y: number }): fabric.Object[] => {
  const objects: fabric.Object[] = [];

  // Build from center outward so axes & quadrant borders align perfectly
  const cx = pointer.x;
  const cy = pointer.y;
  const W = 400; // half-width  (each quadrant is W wide)
  const H = 250; // half-height (each quadrant is H tall)

  const quadrants = [
    { fill: '#e5f2db', left: cx - W, top: cy - H, text: 'DO IT NOW',             color: '#7cb342' },
    { fill: '#eef7e5', left: cx,     top: cy - H, text: 'DO IT NEXT',             color: '#9ccc65' },
    { fill: '#faead6', left: cx - W, top: cy,     text: "DO IT IF/WHEN\nTHERE'S TIME", color: '#ffb74d' },
    { fill: '#e8e9ea', left: cx,     top: cy,     text: "DON'T DO IT",            color: '#9e9e9e' },
  ];

  quadrants.forEach(q => {
    const rect = new fabric.Rect({
      left: q.left, top: q.top,
      width: W, height: H,
      fill: q.fill,
      originX: 'left',
      originY: 'top',
      selectable: true,
      id: generateId()
    } as any);
    objects.push(rect);

    // Text centered in each quadrant
    const text = new fabric.IText(q.text, {
      left: q.left + W / 2,
      top: q.top + H / 2,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '700',
      fill: q.color,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      selectable: true,
      id: generateId()
    } as any);
    objects.push(text);
  });

  const OVERHANG = 40; // how far the axes extend beyond the quadrants

  // X-axis (horizontal, pointing right = HIGH EFFORT)
  const xAxis = new fabric.Line(
    [cx - W - OVERHANG, cy, cx + W + OVERHANG, cy],
    { stroke: '#1e1e24', strokeWidth: 2.5, id: generateId() } as any
  );

  // Y-axis (vertical, pointing up = HIGH VALUE)
  const yAxis = new fabric.Line(
    [cx, cy - H - OVERHANG, cx, cy + H + OVERHANG],
    { stroke: '#1e1e24', strokeWidth: 2.5, id: generateId() } as any
  );

  objects.push(xAxis, yAxis);

  // Arrow heads
  const arrowProps = (angle: number, lx: number, ly: number) => ({
    left: lx, top: ly,
    width: 12, height: 12,
    fill: '#1e1e24',
    angle,
    originX: 'center',
    originY: 'center',
    selectable: false,
    id: generateId()
  });

  objects.push(
    new fabric.Triangle(arrowProps(0,    cx,             cy - H - OVERHANG) as any),  // up
    new fabric.Triangle(arrowProps(180,  cx,             cy + H + OVERHANG) as any),  // down
    new fabric.Triangle(arrowProps(-90,  cx - W - OVERHANG, cy)             as any),  // left
    new fabric.Triangle(arrowProps(90,   cx + W + OVERHANG, cy)             as any),  // right
  );

  // Axis labels (outside the arrows)
  const labelStyle = {
    fontSize: 13, fontFamily: 'Inter', fontWeight: '600', fill: '#555',
    originX: 'center', originY: 'center', selectable: false,
  };

  const labelData = [
    { text: 'HIGH VALUE', left: cx,              top: cy - H - OVERHANG - 22, angle: 0   },
    { text: 'LOW VALUE',  left: cx,              top: cy + H + OVERHANG + 22, angle: 0   },
    { text: 'LOW EFFORT', left: cx - W - OVERHANG - 28, top: cy,             angle: -90  },
    { text: 'HIGH EFFORT',left: cx + W + OVERHANG + 28, top: cy,             angle: -90  },
  ];

  labelData.forEach(l => {
    objects.push(new fabric.IText(l.text, { ...labelStyle, left: l.left, top: l.top, angle: l.angle, id: generateId() } as any));
  });

  return objects;
};

export const getIcebreakerTemplate = (pointer: { x: number; y: number }): fabric.Object[] => {
  const objects: fabric.Object[] = [];

  // Build from center outward
  const cx = pointer.x;
  const cy = pointer.y;

  const leftCardW = 280;
  const cardH = 400;
  const rightCardW = 500;
  const gap = 20;

  // Total width = leftCardW + gap + rightCardW = 800
  // Center the whole thing around cx
  const totalW = leftCardW + gap + rightCardW;
  const leftCardX  = cx - totalW / 2;
  const rightCardX = leftCardX + leftCardW + gap;
  const cardY = cy - cardH / 2;

  // ── Left Dark Card ──
  const leftCard = new fabric.Rect({
    left: leftCardX, top: cardY,
    width: leftCardW, height: cardH,
    fill: '#3c3c3c', rx: 24, ry: 24,
    originX: 'left', originY: 'top',
    id: generateId()
  } as any);
  objects.push(leftCard);

  const leftTitle = new fabric.IText('Pick a question', {
    left: leftCardX + leftCardW / 2, top: cardY + 60,
    fontSize: 18, fontFamily: 'Inter', fontWeight: '600', fill: '#ffffff',
    originX: 'center', originY: 'center',
    id: generateId()
  } as any);
  objects.push(leftTitle);

  // Pill lines (centered in left card)
  const pills = [
    { w: 140, y: cardY + 110, fill: '#b3b3b3' },
    { w: 180, y: cardY + 145, fill: '#808080' },
    { w: 100, y: cardY + 180, fill: '#e6e6e6' },
  ];
  pills.forEach(p => {
    objects.push(new fabric.Rect({
      left: leftCardX + leftCardW / 2, top: p.y,
      width: p.w, height: 14,
      fill: p.fill, rx: 7, ry: 7,
      originX: 'center', originY: 'top',
      id: generateId()
    } as any));
  });

  // ── Right Light Card ──
  const rightCard = new fabric.Rect({
    left: rightCardX, top: cardY,
    width: rightCardW, height: cardH,
    fill: '#ffffff', rx: 24, ry: 24,
    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.12)', blur: 24, offsetX: 0, offsetY: 8 }),
    originX: 'left', originY: 'top',
    id: generateId()
  } as any);
  objects.push(rightCard);

  const rightTitle = new fabric.IText('Visualize an answer', {
    left: rightCardX + rightCardW / 2, top: cardY + 50,
    fontSize: 18, fontFamily: 'Inter', fontWeight: '600', fill: '#050038',
    originX: 'center', originY: 'center',
    id: generateId()
  } as any);
  objects.push(rightTitle);

  // ── Decorative shapes inside right card ──
  const shapeBaseX = rightCardX + 60;
  const shapeBaseY = cardY + 120;

  // Green squiggle path
  const greenSquiggle = new fabric.Path('M 0 0 Q 30 -50 60 0 T 120 0 T 180 0', {
    left: shapeBaseX, top: shapeBaseY,
    fill: '', stroke: '#7cb342', strokeWidth: 7, angle: 55,
    id: generateId()
  } as any);
  objects.push(greenSquiggle);

  // Blue 4-point star
  const blueStar = new fabric.Polygon(
    [{x:20,y:0},{x:25,y:15},{x:40,y:20},{x:25,y:25},{x:20,y:40},{x:15,y:25},{x:0,y:20},{x:15,y:15}],
    { left: shapeBaseX + 30, top: shapeBaseY + 140, fill: '#4285f4', scaleX: 1.6, scaleY: 1.6, originX: 'left', originY: 'top', id: generateId() } as any
  );
  objects.push(blueStar);

  // Red triangle
  objects.push(new fabric.Triangle({
    left: shapeBaseX + 130, top: shapeBaseY + 150,
    width: 65, height: 65, fill: '#e53935',
    originX: 'left', originY: 'top', id: generateId()
  } as any));

  // Yellow square
  objects.push(new fabric.Rect({
    left: shapeBaseX + 120, top: shapeBaseY + 60,
    width: 90, height: 90, fill: '#fbc02d', rx: 12, ry: 12,
    originX: 'left', originY: 'top', id: generateId()
  } as any));

  // Blue + pink overlapping squares
  objects.push(new fabric.Rect({
    left: shapeBaseX + 250, top: shapeBaseY + 30,
    width: 90, height: 90, fill: '#a3c4f3', rx: 12, ry: 12,
    originX: 'left', originY: 'top', id: generateId()
  } as any));
  objects.push(new fabric.Rect({
    left: shapeBaseX + 275, top: shapeBaseY + 75,
    width: 90, height: 90, fill: '#f8bbd0', rx: 12, ry: 12,
    originX: 'left', originY: 'top', id: generateId()
  } as any));

  // Smiley face
  objects.push(new fabric.Rect({ left: shapeBaseX + 255, top: shapeBaseY + 195, width: 5, height: 18, fill: '#fbc02d', angle: 10, rx: 2, ry: 2, originX: 'left', originY: 'top', id: generateId() } as any));
  objects.push(new fabric.Rect({ left: shapeBaseX + 285, top: shapeBaseY + 190, width: 5, height: 18, fill: '#fbc02d', angle: -5, rx: 2, ry: 2, originX: 'left', originY: 'top', id: generateId() } as any));
  objects.push(new fabric.Path('M 0 0 Q 40 35 80 0', {
    left: shapeBaseX + 235, top: shapeBaseY + 220,
    fill: '', stroke: '#fbc02d', strokeWidth: 5, strokeLineCap: 'round', id: generateId()
  } as any));

  return objects;
};

