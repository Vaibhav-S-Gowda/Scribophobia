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

export const setupCanvasHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const { boardId } = socket.handshake.query;
    
    if (!boardId || typeof boardId !== 'string') {
      socket.disconnect();
      return;
    }

    socket.join(boardId);
    console.log(`Socket ${socket.id} joined board ${boardId}`);

    stateClient.hgetall(`board:${boardId}:objects`).then(objects => {
      const parsedObjects = Object.values(objects).map(objStr => JSON.parse(objStr));
      socket.emit('canvas:sync', parsedObjects);
    });

    socket.on('object:moving', async (data: any) => {
      try {
        const validated = deltaSchema.parse(data);
        
        socket.to(boardId).volatile.emit('object:moving', validated);

        const currentObjStr = await stateClient.hget(`board:${boardId}:objects`, validated.id);
        let obj = currentObjStr ? JSON.parse(currentObjStr) : { id: validated.id };
        Object.assign(obj, validated.delta);
        
        await stateClient.hset(`board:${boardId}:objects`, validated.id, JSON.stringify(obj));

      } catch (err) {
        console.error('Validation or Redis error:', err);
      }
    });

    socket.on('object:added', async (data: any) => {
      if (!data || !data.id) return;
      
      socket.to(boardId).emit('object:added', data);
      await stateClient.hset(`board:${boardId}:objects`, data.id, JSON.stringify(data));
      
      stateClient.xadd(`board:${boardId}:history`, '*', 
        'action', 'add', 
        'target', data.id, 
        'payload', JSON.stringify(data)
      ).catch(err => console.error('Error logging to stream:', err));
    });

    socket.on('object:modified', async (data: any) => {
      try {
        const validated = modifiedSchema.parse(data);
        
        socket.to(boardId).emit('object:modified', validated);

        const currentObjStr = await stateClient.hget(`board:${boardId}:objects`, validated.id);
        let obj = currentObjStr ? JSON.parse(currentObjStr) : { id: validated.id };
        Object.assign(obj, validated.state);
        await stateClient.hset(`board:${boardId}:objects`, validated.id, JSON.stringify(obj));

        stateClient.xadd(`board:${boardId}:history`, '*', 
          'action', 'modify', 
          'target', validated.id, 
          'payload', JSON.stringify(validated.state)
        ).catch(err => console.error('Error logging to stream:', err));

      } catch (err) {
        console.error('Validation or Redis error in modified:', err);
      }
    });

    socket.on('canvas:clear', async () => {
      io.to(boardId).emit('canvas:clear');
      
      await stateClient.del(`board:${boardId}:objects`);
      await stateClient.del(`board:${boardId}:history`);
      console.log(`Board ${boardId} cleared by ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
