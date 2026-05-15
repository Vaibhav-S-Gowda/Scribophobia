import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './redis/redisClient';
import { setupCanvasHandlers } from './sockets/canvasHandler';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// io.adapter(createAdapter(pubClient, subClient)); // Removed redis adapter

setupCanvasHandlers(io);

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
