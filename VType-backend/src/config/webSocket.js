import { Server } from 'socket.io';
export const connectSocket = async (httpserver) => {
    const io = new Server(httpserver, {
      cors: {
        origin: '*', // change to specific origin in production
        methods: ['GET', 'POST']
      }
    });
    
    console.log('Socket.IO server is running');

    // Handle socket connections
    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);
    
      // Listen for messages from the client
      socket.on('message', (data) => {
        console.log('📨 Message from client:', data);
    
        // Send message to everyone (including sender)
        io.emit('message', data);
      });
    
      // When client disconnects
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });
}

