import { io } from 'socket.io-client';

const BOARD_ID = 'demo-board-1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  query: {
    boardId: BOARD_ID
  },
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
