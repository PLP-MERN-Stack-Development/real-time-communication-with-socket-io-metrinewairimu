// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState(['general']);
  const [roomMessages, setRoomMessages] = useState({});
  const [messageReactions, setMessageReactions] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [searchResults, setSearchResults] = useState([]);

  // Connect to socket server
  const connect = (username) => {
    socket.connect();
    if (username) {
      socket.emit('user_join', username);
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a message
  const sendMessage = (message) => {
    socket.emit('send_message', { message });
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  // Set typing status
  const setTyping = (isTyping) => {
    socket.emit('typing', isTyping);
  };

  // Join a room
  const joinRoom = (roomName) => {
    socket.emit('join_room', roomName);
    setCurrentRoom(roomName);
    if (!rooms.includes(roomName)) {
      setRooms(prev => [...prev, roomName]);
    }
  };

  // Send message to a room
  const sendRoomMessage = (message, room) => {
    socket.emit('send_room_message', { message, room });
  };

  // Send file
  const sendFile = (fileName, fileData, fileType, room) => {
    socket.emit('send_file', { fileName, fileData, fileType, room });
  };

  // Add reaction to message
  const addReaction = (messageId, reaction) => {
    socket.emit('add_reaction', { messageId, reaction });
  };

  // Mark message as read
  const markAsRead = (messageId) => {
    socket.emit('mark_as_read', messageId);
  };

  // Search messages
  const searchMessages = (query, room) => {
    socket.emit('search_messages', { query, room });
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      // You could add a system message here
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (user) => {
      // You could add a system message here
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Room events
    const onRoomMessages = (messages) => {
      setRoomMessages((prev) => ({ ...prev, [currentRoom]: messages }));
    };

    const onReceiveRoomMessage = (message) => {
      setRoomMessages((prev) => ({
        ...prev,
        [message.room]: [...(prev[message.room] || []), message]
      }));
    };

    // File events
    const onReceiveFile = (fileMessage) => {
      if (fileMessage.room && fileMessage.room !== 'general') {
        setRoomMessages((prev) => ({
          ...prev,
          [fileMessage.room]: [...(prev[fileMessage.room] || []), fileMessage]
        }));
      } else {
        setMessages((prev) => [...prev, fileMessage]);
      }
    };

    // Reaction events
    const onReactionUpdate = ({ messageId, reactions }) => {
      setMessageReactions((prev) => ({ ...prev, [messageId]: reactions }));
    };

    // Read receipt events
    const onReadReceiptUpdate = ({ messageId, readBy }) => {
      setReadReceipts((prev) => ({ ...prev, [messageId]: readBy }));
    };

    // Search events
    const onSearchResults = (results) => {
      setSearchResults(results);
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('room_messages', onRoomMessages);
    socket.on('receive_room_message', onReceiveRoomMessage);
    socket.on('receive_file', onReceiveFile);
    socket.on('reaction_update', onReactionUpdate);
    socket.on('read_receipt_update', onReadReceiptUpdate);
    socket.on('search_results', onSearchResults);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    currentRoom,
    rooms,
    roomMessages,
    messageReactions,
    readReceipts,
    searchResults,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    joinRoom,
    sendRoomMessage,
    sendFile,
    addReaction,
    markAsRead,
    searchMessages,
  };
};

export default socket; 