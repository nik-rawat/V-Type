import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Message from '../models/message.js';

// Store active users
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

export const connectSocket = async (httpserver) => {
  const io = new Server(httpserver, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  console.log('Socket.IO server is running');

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.username} connected:`, socket.id);

    // Store user connection
    activeUsers.set(socket.userId, socket.id);
    userSockets.set(socket.id, socket.userId);

    // Notify user is online
    socket.broadcast.emit('user-online', {
      userId: socket.userId,
      username: socket.user.username
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining a chat room (for private chat between two users)
    socket.on('join-chat', ({ targetUserId }) => {
      // Create a consistent room name for two users
      const roomId = createRoomId(socket.userId, targetUserId);
      socket.join(roomId);
      
      console.log(`User ${socket.user.username} joined chat room: ${roomId}`);
      
      // Notify the other user if they're online
      const targetSocketId = activeUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('chat-joined', {
          roomId,
          userId: socket.userId,
          username: socket.user.username
        });
        // Make sure the target user also joins the room
        io.sockets.sockets.get(targetSocketId)?.join(roomId);
      }
    });

    // Handle private messages
    socket.on('send-message', async (data) => {
      try {
        const { targetUserId, content, messageType = 'text' } = data;

        // Validate target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          socket.emit('error', { message: 'Target user not found' });
          return;
        }

        // Create room ID for the two users
        const roomId = createRoomId(socket.userId, targetUserId);

        // Save message to database
        const message = new Message({
          sender: socket.userId,
          receiver: targetUserId,
          content,
          messageType
        });

        await message.save();
        await message.populate('sender', 'username profilePicture');

        // Prepare message data for clients
        const messageData = {
          _id: message._id,
          sender: {
            _id: message.sender._id,
            username: message.sender.username,
            profilePicture: message.sender.profilePicture
          },
          receiver: targetUserId,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
          roomId
        };

        // Send to both users in the room
        io.to(roomId).emit('new-message', messageData);

        // If target user is not in the room but online, send notification
        const targetSocketId = activeUsers.get(targetUserId);
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket && !targetSocket.rooms.has(roomId)) {
            io.to(targetSocketId).emit('message-notification', {
              ...messageData,
              from: socket.user.username
            });
          }
        }

        console.log(`Message sent from ${socket.user.username} to room ${roomId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', ({ targetUserId }) => {
      const roomId = createRoomId(socket.userId, targetUserId);
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('typing-stop', ({ targetUserId }) => {
      const roomId = createRoomId(socket.userId, targetUserId);
      socket.to(roomId).emit('user-stopped-typing', {
        userId: socket.userId
      });
    });

    // Handle message read status
    socket.on('mark-messages-read', async ({ targetUserId }) => {
      try {
        await Message.updateMany(
          { 
            sender: targetUserId, 
            receiver: socket.userId, 
            isRead: false 
          },
          { 
            isRead: true, 
            readAt: new Date() 
          }
        );

        // Notify sender that messages were read
        const targetSocketId = activeUsers.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('messages-read', {
            readBy: socket.userId,
            readAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle leaving chat room
    socket.on('leave-chat', ({ targetUserId }) => {
      const roomId = createRoomId(socket.userId, targetUserId);
      socket.leave(roomId);
      console.log(`User ${socket.user.username} left chat room: ${roomId}`);
    });

    // Handle getting online users
    socket.on('get-online-users', () => {
      const onlineUsers = Array.from(activeUsers.keys()).filter(userId => userId !== socket.userId);
      socket.emit('online-users', onlineUsers);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.user.username} disconnected:`, socket.id);
      
      // Remove user from active users
      activeUsers.delete(socket.userId);
      userSockets.delete(socket.id);

      // Notify others that user is offline
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });
  });

  return io;
};

// Helper function to create consistent room IDs for two users
function createRoomId(userId1, userId2) {
  return [userId1, userId2].sort().join('-');
}

// Helper function to get user's socket ID
export function getUserSocketId(userId) {
  return activeUsers.get(userId);
}

// Helper function to get all active users
export function getActiveUsers() {
  return Array.from(activeUsers.keys());
}

