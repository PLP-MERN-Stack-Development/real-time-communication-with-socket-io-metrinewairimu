import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from './socket/socket.js';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    isConnected,
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
  } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      connect(username.trim());
      setIsJoined(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (selectedUser) {
        sendPrivateMessage(selectedUser.id, message.trim());
      } else {
        sendMessage(message.trim());
      }
      setMessage('');
    }
  };

  const handleLeave = () => {
    disconnect();
    setIsJoined(false);
    setUsername('');
    setSelectedUser(null);
    setNewRoomName('');
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      joinRoom(newRoomName.trim());
      setNewRoomName('');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result;
        sendFile(file.name, fileData, file.type, currentRoom);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReaction = (messageId, reaction) => {
    addReaction(messageId, reaction);
  };

  const handleMarkAsRead = (messageId) => {
    markAsRead(messageId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMessages(searchQuery.trim(), currentRoom);
      setShowSearch(true);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isJoined) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #007bff, #17a2b8)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <h1 style={{ marginBottom: '1.5rem', color: '#007bff' }}>Socket.io Chat</h1>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #dee2e6',
                borderRadius: '5px',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#007bff',
        color: 'white'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Chat Room</h2>
          <div style={{ marginTop: '0.25rem' }}>
            <span style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '20px',
              background: isConnected ? '#28a745' : '#dc3545'
            }}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {username}!</span>
          <button
            onClick={handleLeave}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Leave
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: '300px',
          background: '#f8f9fa',
          borderRight: '1px solid #dee2e6',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          {/* Search */}
          <div style={{ marginBottom: '1rem' }}>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '5px',
                  fontSize: '0.9rem'
                }}
              />
            </form>
          </div>

          {/* Create Room */}
          <div style={{ marginBottom: '1rem' }}>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                placeholder="Create/join room..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}
              />
              <button
                type="submit"
                disabled={!newRoomName.trim()}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: newRoomName.trim() ? '#28a745' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: newRoomName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Join Room
              </button>
            </form>
          </div>

          {/* Rooms */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#495057' }}>Rooms</h4>
            {rooms.map(room => (
              <div
                key={room}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.25rem',
                  background: currentRoom === room ? '#007bff' : 'white',
                  color: currentRoom === room ? 'white' : 'black',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => joinRoom(room)}
              >
                #{room}
              </div>
            ))}
          </div>

          {/* Users */}
          <h4 style={{ marginBottom: '0.5rem', color: '#495057' }}>Online Users ({users.length})</h4>
          <div>
            <div
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: selectedUser ? 'white' : '#007bff',
                color: selectedUser ? 'black' : 'white',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedUser(null)}
            >
              🌐 Global Chat
            </div>
            {users.filter(user => user.username !== username).map(user => (
              <div
                key={user.id}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: selectedUser?.id === user.id ? '#007bff' : 'white',
                  color: selectedUser?.id === user.id ? 'white' : 'black',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedUser(user)}
              >
                👤 {user.username}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            background: '#f8f9fa'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  maxWidth: '70%',
                  wordWrap: 'break-word',
                  background: msg.system ? '#ffc107' :
                             msg.sender === username ? '#007bff' : 'white',
                  color: msg.system || msg.sender === username ? 'white' : 'black',
                  marginLeft: msg.sender === username ? 'auto' : '0',
                  borderBottomRightRadius: msg.sender === username ? '0' : '10px',
                  borderBottomLeftRadius: msg.sender === username ? '10px' : '0',
                  border: msg.sender !== username && !msg.system ? '1px solid #dee2e6' : 'none'
                }}
              >
                {!msg.system && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{msg.sender}</span>
                    <span style={{
                      color: msg.sender === username ? 'rgba(255,255,255,0.7)' : '#6c757d',
                      fontSize: '0.8rem'
                    }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                )}
                <div>{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '1rem',
            background: 'white',
            borderTop: '1px solid #dee2e6'
          }}>
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                marginBottom: '0.5rem'
              }}
            >
              <input
                type="text"
                placeholder={`Message ${selectedUser ? selectedUser.username : currentRoom ? `#${currentRoom}` : 'everyone'}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #dee2e6',
                  borderRadius: '5px 0 0 5px',
                  fontSize: '1rem'
                }}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: message.trim() ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0 5px 5px 0',
                  cursor: message.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Send
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📎 Share File
              </button>

              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                Room: {currentRoom || 'general'} | Users: {users.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
