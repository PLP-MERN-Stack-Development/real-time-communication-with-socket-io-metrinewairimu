// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
const users = {};
const messages = [];
const typingUsers = {};
const rooms = { 'general': [] };
const messageReactions = {};
const readReceipts = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (username) => {
    users[socket.id] = { username, id: socket.id };
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
    console.log(`${username} joined the chat`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    const message = {
      ...messageData,
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
    };
    
    messages.push(message);
    
    // Limit stored messages to prevent memory issues
    if (messages.length > 100) {
      messages.shift();
    }
    
    io.emit('receive_message', message);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      
      if (isTyping) {
        typingUsers[socket.id] = username;
      } else {
        delete typingUsers[socket.id];
      }
      
      io.emit('typing_users', Object.values(typingUsers));
    }
  });

  // Handle private messages
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
      console.log(`${username} left the chat`);
    }

    delete users[socket.id];
    delete typingUsers[socket.id];

    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });

  // Handle joining a room
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    socket.emit('room_messages', rooms[roomName]);
    io.to(roomName).emit('user_joined_room', {
      username: users[socket.id]?.username,
      room: roomName
    });
  });

  // Handle room messages
  socket.on('send_room_message', ({ room, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      room,
    };

    rooms[room].push(messageData);

    // Limit messages per room
    if (rooms[room].length > 100) {
      rooms[room].shift();
    }

    io.to(room).emit('receive_room_message', messageData);
  });

  // Handle file sharing
  socket.on('send_file', ({ fileName, fileData, fileType, room }) => {
    const fileMessage = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      fileName,
      fileData,
      fileType,
      timestamp: new Date().toISOString(),
      isFile: true,
      room: room || 'general',
    };

    if (room && rooms[room]) {
      rooms[room].push(fileMessage);
      io.to(room).emit('receive_file', fileMessage);
    } else {
      messages.push(fileMessage);
      io.emit('receive_file', fileMessage);
    }
  });

  // Handle message reactions
  socket.on('add_reaction', ({ messageId, reaction }) => {
    if (!messageReactions[messageId]) {
      messageReactions[messageId] = {};
    }
    if (!messageReactions[messageId][reaction]) {
      messageReactions[messageId][reaction] = [];
    }

    const username = users[socket.id]?.username;
    if (username && !messageReactions[messageId][reaction].includes(username)) {
      messageReactions[messageId][reaction].push(username);
      io.emit('reaction_update', { messageId, reactions: messageReactions[messageId] });
    }
  });

  // Handle read receipts
  socket.on('mark_as_read', (messageId) => {
    if (!readReceipts[messageId]) {
      readReceipts[messageId] = [];
    }

    const username = users[socket.id]?.username;
    if (username && !readReceipts[messageId].includes(username)) {
      readReceipts[messageId].push(username);
      io.emit('read_receipt_update', { messageId, readBy: readReceipts[messageId] });
    }
  });

  // Handle message search
  socket.on('search_messages', ({ query, room }) => {
    let searchMessages = room && rooms[room] ? rooms[room] : messages;
    const results = searchMessages.filter(msg =>
      msg.message && msg.message.toLowerCase().includes(query.toLowerCase())
    );
    socket.emit('search_results', results);
  });
});

// API routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 