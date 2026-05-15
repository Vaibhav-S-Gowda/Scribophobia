import { io } from 'socket.io-client';

const generateId = () => Math.random().toString(36).substring(2, 11);

const getBoardId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  let boardId = urlParams.get('boardId');
  if (!boardId) {
    boardId = 'board-' + generateId();
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('boardId', boardId);
    window.history.replaceState({}, '', newUrl.toString());
  }
  return boardId;
};

export const BOARD_ID = getBoardId();
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
