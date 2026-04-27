import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5000';

// Singleton socket instance
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Socket.io connected:', socket.id);
    });
    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
    });
    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.io connection error:', err.message);
    });
  }
  return socket;
};

// Join a hospital's real-time room
export const joinHospitalRoom = (hospitalId) => {
  const s = getSocket();
  s.emit('join_hospital', hospitalId);
};

// Leave a hospital's room
export const leaveHospitalRoom = (hospitalId) => {
  const s = getSocket();
  s.emit('leave_hospital', hospitalId);
};

// Emit emergency to a hospital
export const emitEmergency = (hospitalId, emergencyData) => {
  const s = getSocket();
  s.emit('new_emergency', { hospitalId, ...emergencyData });
};

// Disconnect completely
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
