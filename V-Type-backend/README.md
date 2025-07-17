# VType - Real-Time Chat Application

Nemotype is a real-time chat application that supports audio and video calls. Built with Node.js, Express, MongoDB, Redis, WebSockets, and WebRTC, it provides a seamless communication experience.

## Features

- User authentication and management
- Real-time chat functionality
- Audio and video calling capabilities
- Message storage and retrieval
- Session management using Redis

## Technologies Used

- **Node.js**: JavaScript runtime for building the backend
- **Express**: Web framework for Node.js
- **MongoDB**: NoSQL database for storing user and chat data
- **Redis**: In-memory data structure store for session management
- **WebSockets**: For real-time communication
- **WebRTC**: For peer-to-peer audio and video calls

## Project Structure

```
nemotype-backend
├── src
│   ├── app.js
│   ├── server.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── userController.js
│   │   └── callController.js
│   ├── models
│   │   ├── User.js
│   │   ├── Chat.js
│   │   └── Message.js
│   ├── routes
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── user.js
│   │   └── call.js
│   ├── middleware
│   │   ├── auth.js
│   │   └── validation.js
│   ├── services
│   │   ├── socketService.js
│   │   ├── redisService.js
│   │   └── webrtcService.js
│   ├── config
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── socket.js
│   └── utils
│       ├── logger.js
│       └── helpers.js
├── package.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/VType-backend.git
   ```
2. Navigate to the project directory:
   ```
   cd nemotype-backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up environment variables for MongoDB and Redis connections.

## Usage

1. Start the server:
   ```
   npm start
   ```
2. Access the application at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.