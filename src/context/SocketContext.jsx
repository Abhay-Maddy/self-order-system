import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // In production / Vite proxy environment, socket connects to window.location.origin or fallback
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = (room) => {
    if (socket && connected) {
      socket.emit('join_room', room);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
