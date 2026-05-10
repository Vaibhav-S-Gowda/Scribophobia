# Scribophobia

> Conquer the blank canvas. A real-time, collaborative infinite whiteboard for sketching, diagramming, and system design.

<!-- ![Scribophobia Banner](Screenshot%202026-04-24%20183901.png) -->

---

## Overview

Scribophobia is a full-stack collaborative whiteboard built for teams. Multiple users can draw, annotate, and design system architectures together in real time — all changes sync instantly across every connected session.

---

## Features

### Drawing Tools
- **Pen** — smooth freehand drawing with a cursive stroke feel
- **Marker** — bold, thick strokes for emphasis
- **Smart Pen** — intelligent drawing mode
- **Lasso** — freehand selection of canvas objects
- **Eraser** — whiteboard-style block eraser
- **Pixel Eraser** — precise pixel-level erasure

### Shapes
- Connectors: Line, Arrow, Elbow Arrow, Block Arrow
- Primitives: Rectangle, Oval, Rhombus, Triangle, Divider
- All shapes are draggable, resizable, and synchronized in real time

### Text & Notes
- **Text Tool** — click to place editable inline text
- **Sticky Notes** — draggable annotation cards

### Developer Mode (Architecture Assist)
- Place architecture nodes: **Server**, **Database**, **Client**, **Queue**, **Cache**
- Draw connections between nodes using the **Line** tool
- Intelligent **Architecture Assist** — connecting a Server to a Database automatically suggests a Redis Cache node at the midpoint

### Canvas Controls
- **Infinite canvas** — pan with `Alt+Click` or middle mouse button
- **Zoom** — pinch/scroll to zoom or use the `+` / `−` buttons (10% increments), clamped between 10% and 500%
- **Zoom display** — real-time percentage shown in the bottom-right corner

### Collaboration
- Real-time multi-user sync over **WebSockets** (Socket.io)
- All object additions, modifications, and deletions broadcast instantly to all connected clients
- Canvas state persisted in **Redis** — new users receive full board sync on join
- **Share Modal** — copy invite link to bring others in

### History
- **Undo / Redo** — full object-level history with network synchronization, so undo/redo actions are reflected for all users

### Board Management
- **Clear Board** — wipe the canvas for all users with a confirmation prompt

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TypeScript |
| Canvas Engine | Fabric.js v7 |
| State Management | Zustand |
| Real-time | Socket.io (client + server) |
| Backend | Node.js + Express |
| WebSocket Adapter | `@socket.io/redis-adapter` |
| Persistence | Redis (hot state via hashes + event streams) |
| Database | PostgreSQL (Docker) |
| Infrastructure | Docker Compose |
| Input Validation | Zod |

---

## Project Structure

```
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── Canvas.tsx          # Core Fabric.js canvas engine
│       │   ├── LeftToolbar.tsx     # Tool palette, undo/redo controls
│       │   ├── TopBar.tsx          # Board title and share button
│       │   ├── BottomRightControls.tsx  # Zoom controls
│       │   ├── ShapePicker.tsx     # Shapes popup menu
│       │   ├── PenPicker.tsx       # Pen/marker/lasso popup
│       │   ├── EraserPicker.tsx    # Eraser type popup
│       │   └── ShareModal.tsx      # Invite link modal
│       ├── store/
│       │   └── useCanvasStore.ts   # Global Zustand state
│       └── lib/
│           └── socket.ts           # Socket.io client
│
├── backend/                # Node.js + Express WebSocket server
│   └── src/
│       ├── server.ts               # Express + Socket.io setup
│       ├── sockets/
│       │   └── canvasHandler.ts    # Real-time event handlers
│       └── redis/
│           └── redisClient.ts      # Redis pub/sub + state clients
│
└── docker-compose.yml      # Redis + PostgreSQL services
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### 1. Start Infrastructure
```bash
docker-compose up -d
```
This starts Redis on `6379` and PostgreSQL on `5432`.

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```
Server runs on `http://localhost:3001`.

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`.

### 4. Open in Browser
Navigate to `http://localhost:5173` in one or more browser tabs to see real-time collaboration in action.

---

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_SOCKET_URL=http://localhost:3001
```

### Backend (optional)
```env
REDIS_URL=redis://localhost:6379
PORT=3001
```

---

## Architecture

```
Browser A ──┐
            ├──► Socket.io Server ──► Redis Adapter ──► Redis
Browser B ──┘        │
                      └──► Redis Hash (board state)
                           Redis Stream (event history)
```

- **Hot State**: Every canvas object is stored in a Redis hash (`board:<id>:objects`) keyed by object ID. New clients receive a full sync immediately on connection.
- **Event Stream**: Object creation and modification events are appended to a Redis stream (`board:<id>:history`) for potential replay/rewind features.
- **Pub/Sub Adapter**: The Socket.io Redis Adapter enables horizontal scaling across multiple server instances.

---

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `canvas:sync` | Server → Client | Full board state on join |
| `object:added` | Bidirectional | New object placed on canvas |
| `object:moving` | Bidirectional | Real-time position delta (throttled, ~30fps) |
| `object:modified` | Bidirectional | Final state after transform |
| `canvas:clear` | Bidirectional | Wipe entire board |

---

## Health Check
```bash
curl http://localhost:3001/health
# {"status":"ok"}
```
