import { Server, Socket } from 'socket.io';
import { stateClient } from '../redis/redisClient';
import { z } from 'zod';

const deltaSchema = z.object({
  id: z.string(),
  delta: z.record(z.string(), z.any()),
});

const modifiedSchema = z.object({
  id: z.string(),
  state: z.record(z.string(), z.any()),
});

const boardState = new Map<string, Map<string, any>>();

export const setupCanvasHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const { boardId } = socket.handshake.query;
    
    if (!boardId || typeof boardId !== 'string') {
      socket.disconnect();
      return;
    }

    if (!boardState.has(boardId)) {
      boardState.set(boardId, new Map());
    }

    socket.join(boardId);
    console.log(`Socket ${socket.id} joined board ${boardId}`);

    const currentObjects = Array.from(boardState.get(boardId)!.values());
    socket.emit('canvas:sync', currentObjects);

    socket.on('object:moving', (data: any) => {
      try {
        const validated = deltaSchema.parse(data);
        socket.to(boardId).volatile.emit('object:moving', validated);

        const roomState = boardState.get(boardId)!;
        let obj = roomState.get(validated.id) || { id: validated.id };
        Object.assign(obj, validated.delta);
        roomState.set(validated.id, obj);
      } catch (err) {
        console.error('Validation error:', err);
      }
    });

    socket.on('object:added', (data: any) => {
      if (!data || !data.id) return;
      socket.to(boardId).emit('object:added', data);
      boardState.get(boardId)!.set(data.id, data);
    });

    socket.on('object:modified', (data: any) => {
      try {
        const validated = modifiedSchema.parse(data);
        socket.to(boardId).emit('object:modified', validated);

        const roomState = boardState.get(boardId)!;
        let obj = roomState.get(validated.id) || { id: validated.id };
        Object.assign(obj, validated.state);
        roomState.set(validated.id, obj);
      } catch (err) {
        console.error('Validation error in modified:', err);
      }
    });

    socket.on('canvas:clear', () => {
      io.to(boardId).emit('canvas:clear');
      boardState.get(boardId)!.clear();
      console.log(`Board ${boardId} cleared by ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
