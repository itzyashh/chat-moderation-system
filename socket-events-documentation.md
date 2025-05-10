# Socket.io Events Documentation

This document outlines the Socket.io events used in the chat moderation system for real-time communication.

## Client Events (Emitted from client to server)

### Connection

```javascript
// Connect to the server
const socket = io('http://localhost:5000');
```

### Room Management

```javascript
// Join a chat room
socket.emit('join_room', roomId);
```

### Messaging

```javascript
// Send a message
socket.emit('send_message', {
  messageId: 'temporary-id-1234', // Client-generated temporary ID
  roomId: 'room-id-1234',
  message: 'Hello, world!',
  senderId: 'user-id-1234',
  senderName: 'John Doe',
  timestamp: new Date()
});
```

### Typing Indicators

```javascript
// Indicate the user is typing
socket.emit('typing', {
  roomId: 'room-id-1234',
  userId: 'user-id-1234',
  username: 'John Doe'
});

// Indicate the user stopped typing
socket.emit('stop_typing', {
  roomId: 'room-id-1234',
  userId: 'user-id-1234'
});
```

### Disconnection

```javascript
// Disconnect from the server
socket.disconnect();
```

## Server Events (Emitted from server to client)

### Message Events

```javascript
// Listen for incoming messages that passed moderation
socket.on('receive_message', (data) => {
  // data contains:
  // {
  //   messageId: 'server-generated-id',
  //   roomId: 'room-id-1234',
  //   message: 'Hello, world!',
  //   sender: { id: 'user-id-1234', username: 'John Doe', profilePicture: 'url' },
  //   timestamp: Date
  // }
});

// Listen for message moderation flags
socket.on('message_flagged', (data) => {
  // data contains:
  // {
  //   messageId: 'temporary-id-1234',
  //   reasons: ['toxicity', 'threat', 'Potential scam or fraud message'],
  //   timestamp: Date
  // }
});
```

### Typing Indicators

```javascript
// Listen for typing indicators
socket.on('user_typing', (data) => {
  // data contains:
  // {
  //   roomId: 'room-id-1234',
  //   userId: 'user-id-1234',
  //   username: 'John Doe'
  // }
});

// Listen for stopped typing indicators
socket.on('user_stopped_typing', (data) => {
  // data contains:
  // {
  //   roomId: 'room-id-1234',
  //   userId: 'user-id-1234'
  // }
});
```

### Room Events

```javascript
// Listen for user join events
socket.on('user_joined', (data) => {
  // data contains:
  // {
  //   roomId: 'room-id-1234',
  //   user: { id: 'user-id-1234', username: 'John Doe' },
  //   timestamp: Date
  // }
});

// Listen for user leave events
socket.on('user_left', (data) => {
  // data contains:
  // {
  //   roomId: 'room-id-1234',
  //   userId: 'user-id-1234',
  //   username: 'John Doe',
  //   timestamp: Date
  // }
});
```

### Error Events

```javascript
// Listen for error events
socket.on('error', (data) => {
  // data contains:
  // {
  //   message: 'Error message',
  //   code: 'ERROR_CODE' (optional)
  // }
});
```

## Example Usage in React Native Client

Here's a basic example of how to use Socket.io in your React Native client:

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import io from 'socket.io-client';

const ChatScreen = ({ route }) => {
  const { roomId, userId, username } = route.params;
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Connect to socket server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join room
    newSocket.emit('join_room', roomId);

    // Set up event listeners
    newSocket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on('message_flagged', (data) => {
      // Handle flagged message (e.g., show warning to user)
      alert(`Message flagged: ${data.reasons.join(', ')}`);
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (inputText.trim() && socket) {
      const messageData = {
        messageId: `temp-${Date.now()}`,
        roomId,
        message: inputText,
        senderId: userId,
        senderName: username,
        timestamp: new Date()
      };
      
      socket.emit('send_message', messageData);
      setInputText('');
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.messageId}
        renderItem={({ item }) => (
          <View style={{ padding: 10, backgroundColor: item.senderId === userId ? '#e6f7ff' : '#f2f2f2', marginVertical: 5, borderRadius: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.senderName}</Text>
            <Text>{item.message}</Text>
            <Text style={{ fontSize: 12, color: 'gray' }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />
      
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: 'gray', borderRadius: 5, padding: 10 }}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

export default ChatScreen;
``` 