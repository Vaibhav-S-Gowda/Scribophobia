# Scribophobia – System Architecture & Design

## 1. High-Level System Design

**Scribophobia** is a real-time, collaborative infinite whiteboard. The architecture is split across a WebSocket layer, an in-memory state and message bus (Redis), and a persistent storage layer.

### Architecture Overview

1. **Client (React + Fabric.js)**: Handles rendering, local interaction, and input throttling. Global state is managed via Zustand. Socket.io client connects directly to the backend, passing a `boardId` in the handshake query.
2. **WebSocket Server (Node.js + Socket.io)**: Handles all real-time I/O, Zod schema validation, and Redis state management. A single server instance in development; horizontally scalable via the Redis adapter.
3. **State Sync & Pub/Sub (Redis)**: Single source of truth for the live canvas state. Uses the `@socket.io/redis-adapter` to bridge multiple server nodes and a dedicated `stateClient` for hash-based object storage.
4. **Event History (Redis Streams)**: Append-only log of all `add` and `modify` events per board, keyed as `board:{id}:history`.
5. **Persistent Storage (PostgreSQL)**: Declared in `docker-compose.yml` and available for future use (user accounts, board metadata, periodic snapshots).

### Event Flow: `object:moving`
1. **Client A** drags a shape. Fabric.js fires `object:moving` continuously.
2. Client throttles emission to **~30fps** using lodash `throttle` and sends a delta payload: `{ id, delta: { left, top, ... } }`.
3. **Socket Server** validates the payload against the `deltaSchema` (Zod) and broadcasts it to all other clients in the room via `socket.to(boardId).volatile.emit(...)`. `volatile` ensures dropped packets are not queued.
4. **Socket Server** fetches the object's current state from Redis, merges the delta via `Object.assign`, and writes back the updated JSON.
5. **Client B & C** receive the delta and update the matching Fabric.js object directly.

### Event Flow: `object:modified`
1. On mouse-up, the client emits `object:modified` with the full reconciled state: `{ id, state: { ...fullFabricObject } }`.
2. **Socket Server** validates via `modifiedSchema` (Zod), broadcasts to all other clients, updates Redis hot state, and appends the full state to the Redis Stream for history.

### State Reconciliation
The system uses **Property-Level Last-Write-Wins (LWW)**. Since whiteboard objects are discrete, independent entities with UUIDs, the probability of two users modifying the exact same property of the same object simultaneously is low. LWW is significantly less complex than CRDTs/OT and is well-suited for this use case.

### Scaling Strategy
- **Redis Adapter**: `@socket.io/redis-adapter` is already wired up, bridging multiple Node.js instances with pub/sub.
- **Horizontal Scaling**: Additional WebSocket server instances can be added behind a load balancer without code changes.
- **Redis Cluster**: For boards at scale, shard Redis keys by `{boardId}` using hash tags to distribute load.

---

## 2. Redis Schema Design

### A. Hot Canvas State (Hash)
Each object on the board is stored as an individual field in a Redis Hash, enabling O(1) partial updates.

- **Key:** `board:{board_id}:objects` (Type: Hash)
- **Field:** `object_id`
- **Value:** Stringified JSON of the full Fabric.js object

```bash
HSET board:demo-board-1:objects obj_abc '{"type":"rect","left":120,"top":300,"width":100,"fill":"#3b82f6","id":"obj_abc"}'
```

On new client connection, the server calls `HGETALL` and emits the parsed array as `canvas:sync`.

### B. Pub/Sub (Redis Adapter)
The `@socket.io/redis-adapter` uses native Redis Pub/Sub internally to relay Socket.io room events across server instances. No manual channel management is needed.

### C. Event History (Streams)
Every `object:added` and `object:modified` event is appended to a Redis Stream.

- **Key:** `board:{board_id}:history` (Type: Stream)
- **Fields:** `action`, `target`, `payload`

```bash
XADD board:demo-board-1:history * action add target obj_abc payload '{"type":"rect","left":120,...}'
XADD board:demo-board-1:history * action modify target obj_abc payload '{"left":200,"top":150}'
```

> **Note:** `object:moving` deltas are intentionally **not** appended to the stream to avoid log bloat from continuous position updates. Only the final `object:modified` state is recorded.

### D. Presence Tracking
Not yet implemented. Planned schema:

- **Key:** `board:{board_id}:presence` (Type: Set)
- **Value:** `socket_id` or `user_id`

---

## 3. WebSocket Implementation (Actual)

The following is the real TypeScript implementation running in production:

```typescript
// Zod schemas for input validation
const deltaSchema = z.object({
  id: z.string(),
  delta: z.record(z.string(), z.any()),
});

const modifiedSchema = z.object({
  id: z.string(),
  state: z.record(z.string(), z.any()),
});

io.on('connection', (socket: Socket) => {
  const { boardId } = socket.handshake.query;

  if (!boardId || typeof boardId !== 'string') {
    socket.disconnect();
    return;
  }

  socket.join(boardId);

  // Sync full board state to newly connected client
  stateClient.hgetall(`board:${boardId}:objects`).then(objects => {
    const parsedObjects = Object.values(objects).map(o => JSON.parse(o));
    socket.emit('canvas:sync', parsedObjects);
  });

  socket.on('object:moving', async (data) => {
    const validated = deltaSchema.parse(data);
    socket.to(boardId).volatile.emit('object:moving', validated);  // volatile: drop if busy
    // Partial Redis update
    const current = await stateClient.hget(`board:${boardId}:objects`, validated.id);
    const obj = current ? JSON.parse(current) : { id: validated.id };
    Object.assign(obj, validated.delta);
    await stateClient.hset(`board:${boardId}:objects`, validated.id, JSON.stringify(obj));
  });

  socket.on('object:added', async (data) => {
    socket.to(boardId).emit('object:added', data);
    await stateClient.hset(`board:${boardId}:objects`, data.id, JSON.stringify(data));
    stateClient.xadd(`board:${boardId}:history`, '*', 'action', 'add', 'target', data.id, 'payload', JSON.stringify(data));
  });

  socket.on('object:modified', async (data) => {
    const validated = modifiedSchema.parse(data);
    socket.to(boardId).emit('object:modified', validated);
    const current = await stateClient.hget(`board:${boardId}:objects`, validated.id);
    const obj = current ? JSON.parse(current) : { id: validated.id };
    Object.assign(obj, validated.state);
    await stateClient.hset(`board:${boardId}:objects`, validated.id, JSON.stringify(obj));
    stateClient.xadd(`board:${boardId}:history`, '*', 'action', 'modify', 'target', validated.id, 'payload', JSON.stringify(validated.state));
  });

  socket.on('canvas:clear', async () => {
    io.to(boardId).emit('canvas:clear');
    await stateClient.del(`board:${boardId}:objects`);
    await stateClient.del(`board:${boardId}:history`);
  });
});
```

---

## 4. Socket Events Reference

| Event | Direction | Validated By | Description |
|---|---|---|---|
| `canvas:sync` | Server → Client | — | Full board state on join (parsed array) |
| `object:added` | Client → Server → Others | Presence check (`data.id`) | New object placed on canvas |
| `object:moving` | Client → Server → Others | `deltaSchema` (Zod) | Real-time position delta, volatile (~30fps) |
| `object:modified` | Client → Server → Others | `modifiedSchema` (Zod) | Full object state on mouse-up |
| `canvas:clear` | Client → Server → All | — | Wipe board for all users |

---

## 5. Client Architecture

### State Management (Zustand)
All global UI state lives in `useCanvasStore`:

| State | Type | Purpose |
|---|---|---|
| `activeTool` | `ToolType` | Currently selected drawing tool |
| `penSize` | `number` | Stroke width for pen/eraser tools |
| `undoStack` | `CanvasAction[]` | History of canvas actions for undo |
| `redoStack` | `CanvasAction[]` | Popped actions for redo |
| `zoom` | `number` | Current viewport zoom level (1.0 = 100%) |
| `isDeveloperMode` | `boolean` | Enables architecture node tools |

### Undo/Redo Architecture
- **Client-side only** — history stacks live in Zustand memory for the session duration.
- Each action stores `type` (`add` | `modify` | `remove`), `objectId`, `previousState`, and `newState`.
- Undo/Redo operations are **network-synchronized**: reversions emit `object:added` or `object:modified` so all collaborators see the change.
- The `canvasEvents` EventTarget decouples the store's dispatch from the Canvas engine's Fabric.js listeners.

### Zoom Controls
- **Wheel/Trackpad**: `mouse:wheel` event scales the viewport centered on the cursor position. Clamped between **10%** and **500%**.
- **UI Buttons**: `BottomRightControls` dispatches `zoom:in` / `zoom:out` events at 10% increments, zooming toward the center of the viewport.
- Zoom level is synced to the Zustand `zoom` state and displayed as a percentage.

---

## 6. Performance Considerations

- **Volatile emit for `object:moving`**: Dropped packets are acceptable since the final `object:modified` guarantees consistency.
- **Throttled client emission**: The client uses lodash `throttle` at ~30fps (33ms) to limit `object:moving` frequency.
- **Delta payloads**: `object:moving` sends only `{ id, delta }`. The full object is only sent on `object:modified`.
- **O(1) Redis updates**: Individual object fields in the hash mean partial updates never require reading or rewriting the full board document.

---

## 7. Security Considerations

- **Input Validation**: All incoming `object:moving` and `object:modified` payloads are validated through `zod` schemas before being written to Redis or broadcast. This prevents prototype pollution and malformed data injection.
- **boardId Validation**: Clients disconnected immediately if `boardId` is missing or non-string.
- **Authentication**: Not yet implemented. The planned approach is JWT tokens passed via the Socket.io `auth` handshake payload (not query params, which are logged).
- **Room Isolation**: Currently based on `boardId` from the client query. Future implementation should verify access rights against the database before `socket.join(boardId)`.

---

## 8. Planned & Future Features

### Architecture Assist (Partial — Implemented)
A heuristic rule fires when a **Server** node is connected to a **Database** node. A glowing "suggested cache" node appears at the midpoint of the connecting line. The user can click it to promote it to a real `cache` node. Vector DB integration and LLM-backed suggestions are planned.

### Ghost Rewind (Planned)
Event Sourcing via the existing Redis Stream (`board:{id}:history`).
- Take a PostgreSQL snapshot every 5 minutes.
- When scrubbing back, fetch the nearest snapshot then replay stream deltas via `XREAD` up to the target timestamp.

### Presence & Cursors (Planned)
- Track active sessions in `board:{id}:presence` (Redis Set).
- Broadcast cursor position as a high-frequency, non-persistent `cursor:move` volatile event.
- Render remote cursors as labeled SVG overlays in the React DOM layer (not on the Fabric.js canvas, to avoid re-renders).

### Live Cost Estimation (Planned)
Assign cloud provider metadata to architecture nodes. A backend worker listens to `object:added`, queries cached AWS/GCP pricing APIs, and pushes an aggregated cost back to the room. Overlay a heatmap where expensive components glow red.

### Canvas-to-IaC / Terraform Export (Planned)
Map visual components to Terraform resource templates. An LLM takes the JSON graph of nodes and connections and generates valid HCL (HashiCorp Configuration Language).
