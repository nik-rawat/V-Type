// Frontend WebSocket client
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.currentChatUser = null;
  }

  connect(token) {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: token
      }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('new-message', (messageData) => {
      // Handle new message in UI
      this.displayMessage(messageData);
    });

    this.socket.on('user-typing', (data) => {
      // Show typing indicator
      this.showTypingIndicator(data.username);
    });

    this.socket.on('user-stopped-typing', (data) => {
      // Hide typing indicator
      this.hideTypingIndicator(data.userId);
    });

    this.socket.on('message-notification', (data) => {
      // Show notification for messages from users not in current chat
      this.showNotification(data);
    });

    this.socket.on('user-online', (data) => {
      // Update user status to online
      this.updateUserStatus(data.userId, 'online');
    });

    this.socket.on('user-offline', (data) => {
      // Update user status to offline
      this.updateUserStatus(data.userId, 'offline');
    });
  }

  startChat(targetUserId) {
    this.currentChatUser = targetUserId;
    this.socket.emit('join-chat', { targetUserId });
  }

  sendMessage(targetUserId, content, messageType = 'text') {
    this.socket.emit('send-message', {
      targetUserId,
      content,
      messageType
    });
  }

  startTyping(targetUserId) {
    this.socket.emit('typing-start', { targetUserId });
  }

  stopTyping(targetUserId) {
    this.socket.emit('typing-stop', { targetUserId });
  }

  markMessagesAsRead(targetUserId) {
    this.socket.emit('mark-messages-read', { targetUserId });
  }

  leaveChat(targetUserId) {
    this.socket.emit('leave-chat', { targetUserId });
    this.currentChatUser = null;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

//   // UI methods (implement based on your frontend framework)
//   displayMessage(messageData) {
//     // Add message to chat UI
//   }

//   showTypingIndicator(username) {
//     // Show "username is typing..." indicator
//   }

//   hideTypingIndicator(userId) {
//     // Hide typing indicator
//   }

//   showNotification(data) {
//     // Show browser notification or in-app notification
//   }

//   updateUserStatus(userId, status) {
//     // Update user's online/offline status in UI
//   }
}

export default ChatService;