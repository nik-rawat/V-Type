# VType - Real-Time Chat Application

VType is a modern, real-time chat application built with Node.js, featuring secure authentication, instant messaging, and WebSocket communication. The application supports user management, secure token-based authentication with refresh tokens, and real-time messaging capabilities.

## ✨ Features

- **🔐 Secure Authentication**: JWT-based authentication with access and refresh tokens
- **💬 Real-time Messaging**: Instant chat functionality using WebSockets
- **👥 User Management**: Complete user registration, login, and profile management
- **🔄 Token Management**: Automatic token refresh and secure session handling
- **📱 Session Storage**: Redis-based session management for scalability
- **🛡️ Security**: Password hashing, token blacklisting, and input validation
- **🚀 Scalable Architecture**: Modular design with separation of concerns

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Redis** - In-memory data store for session management
- **Socket.IO** - Real-time bidirectional event-based communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing library

### Development Tools
- **Nodemon** - Development server with auto-restart
- **Express Validator** - Input validation and sanitization
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management

## 📁 Project Structure

```
VType/
├── VType-backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # MongoDB connection
│   │   │   ├── redis.js         # Redis connection
│   │   │   └── webSocket.js     # Socket.IO configuration
│   │   ├── middleware/
│   │   │   └── auth.js          # Authentication middleware
│   │   ├── models/
│   │   │   ├── user.js          # User data model
│   │   │   └── message.js       # Message data model
│   │   ├── routes/
│   │   │   └── auth.js          # Authentication routes
│   │   ├── utils/
│   │   │   ├── tokenUtils.js    # Token generation and validation
│   │   │   ├── logger.js        # Logging utilities
│   │   │   └── helper.js        # Helper functions
│   │   └── controllers/
│   │       └── userController.js # User-related logic
│   ├── server.js                # Main server file
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14.0.0 or higher)
- **MongoDB** (local installation or Atlas cloud)
- **Redis** (local installation or cloud service)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vtype.git
   cd vtype
   ```

2. **Navigate to backend directory**
   ```bash
   cd VType-backend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # JWT Secrets
   JWT_ACCESS_SECRET=your-super-secret-access-token-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-here
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d

   # Database
   MONGODB_URI=mongodb://localhost:27017/vtype
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vtype

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password

   # Server
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

#### Get User Profile
```http
GET /api/auth/me
Authorization: Bearer your-access-token-here
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer your-access-token-here
```

#### Logout from All Devices
```http
POST /api/auth/logout-all
Authorization: Bearer your-access-token-here
```

### Health Check
```http
GET /api/health
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_ACCESS_SECRET` | Secret key for access tokens | - | ✅ |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | - | ✅ |
| `JWT_ACCESS_EXPIRES` | Access token expiration time | `15m` | ❌ |
| `JWT_REFRESH_EXPIRES` | Refresh token expiration time | `7d` | ❌ |
| `MONGODB_URI` | MongoDB connection string | - | ✅ |
| `REDIS_HOST` | Redis server host | `localhost` | ✅ |
| `REDIS_PORT` | Redis server port | `6379` | ✅ |
| `REDIS_PASSWORD` | Redis server password | - | ✅ |
| `PORT` | Server port | `3000` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` | ❌ |

## 🔐 Security Features

- **Password Hashing**: Using bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Token Blacklisting**: Logout functionality with token invalidation
- **Input Validation**: Request validation using express-validator
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: Built-in protection against abuse (can be extended)

## 🧪 Testing

### Manual Testing with curl

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🚀 Deployment

### Using PM2 (Recommended for production)

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the application:
   ```bash
   pm2 start server.js --name "vtype-backend"
   ```

3. Enable startup script:
   ```bash
   pm2 startup
   pm2 save
   ```

### Using Docker

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and structure
- Add comments for complex logic
- Update documentation when adding new features
- Test your changes thoroughly before submitting

## 📋 TODO / Roadmap

- [ ] **Chat Functionality**: Complete message system implementation
- [ ] **File Uploads**: Support for image and file sharing
- [ ] **Voice/Video Calls**: WebRTC integration for calls
- [ ] **Group Chats**: Multi-user chat rooms
- [ ] **Message Encryption**: End-to-end encryption
- [ ] **Push Notifications**: Real-time notifications
- [ ] **User Presence**: Online/offline status
- [ ] **Message Search**: Full-text search functionality
- [ ] **Rate Limiting**: Advanced rate limiting implementation
- [ ] **Admin Panel**: User management interface

## 🐛 Known Issues

- WebSocket filename inconsistency (`webSocket.js` vs `websocket.js`)
- Some utility files are empty and need implementation
- Frontend integration pending

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Express.js community for the excellent framework
- MongoDB team for the robust database solution
- Redis team for the high-performance caching solution
- Socket.IO team for real-time communication capabilities

## 📞 Support

If you have any questions or need help with setup, please:

1. Check the [Issues](https://github.com/yourusername/vtype/issues) page
2. Create a new issue if your problem isn't already documented
3. Contact the development team

---

**Built with ❤️ for seamless communication**