import React, { useContext, useState, useMemo, useEffect, createContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../config/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Helper function outside component
const getRoomId = (id1, id2) => {
  const ids = [String(id1), String(id2)].sort();
  return ids.join('_');
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null); // recipient user object
  const [messages, setMessages] = useState([]); // currently opened conversation
  const [loading, setLoading] = useState(false);
  const [chatList, setChatList] = useState([]); // List of all conversations
  const [unreadCounts, setUnreadCounts] = useState({}); // Unread message counts per room

  // Init socket.io client on login
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io('http://localhost:5000', {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    setSocket(s);

    s.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
      fetchChatList();
    });

    s.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    s.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Listen for new messages in real-time
    const handleNewMessage = (m) => {
      console.log('📨 New message received:', m);
      const roomId = getRoomId(user._id, m.sender === user._id.toString() || m.sender === user._id ? m.recipient : m.sender);
      
      // Update messages state using functional update to access latest activeChatUser
      setMessages(msgs => {
        // Check if this message is for the currently active chat
        const currentActiveChat = activeChatUser?._id;
        if (currentActiveChat) {
          const activeRoomId = getRoomId(user._id, currentActiveChat);
          if (roomId === activeRoomId) {
            // Avoid duplicates
            const exists = msgs.some(msg => 
              msg._id === m._id || 
              (msg.content === m.content && 
               Math.abs(new Date(msg.createdAt) - new Date(m.createdAt)) < 1000)
            );
            if (!exists) {
              // Mark as read if user is viewing
              setTimeout(() => s.emit('markRead', { roomId }), 100);
              return [...msgs, m];
            }
          }
        }
        return msgs;
      });

      // Update unread count for received messages
      if (m.recipient === user._id || m.recipient === user._id.toString()) {
        setUnreadCounts(prev => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1
        }));
      }

      // Refresh chat list to show latest message
      fetchChatList();
    };

    s.on('newMessage', handleNewMessage);

    s.on('messagesRead', ({ roomId }) => {
      // Clear unread count when messages are read
      setUnreadCounts(prev => {
        const updated = { ...prev };
        delete updated[roomId];
        return updated;
      });
    });

    return () => {
      s.off('newMessage');
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update messages when activeChatUser changes (listen for new messages)
  useEffect(() => {
    if (!socket || !activeChatUser) return;
    
    const handleActiveChatMessage = (m) => {
      const roomId = getRoomId(user._id, activeChatUser._id);
      const messageRoomId = getRoomId(user._id, m.sender === user._id.toString() || m.sender === user._id ? m.recipient : m.sender);
      
      if (roomId === messageRoomId) {
        setMessages(msgs => {
          const exists = msgs.some(msg => msg._id === m._id);
          if (!exists) return [...msgs, m];
          return msgs;
        });
      }
    };

    socket.on('newMessage', handleActiveChatMessage);
    
    return () => {
      socket.off('newMessage', handleActiveChatMessage);
    };
  }, [socket, activeChatUser, user]);

  // Fetch list of conversations
  const fetchChatList = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/messages');
      setChatList(data || []);
      
      // Fetch unread counts
      if (socket && data) {
        const counts = {};
        for (const chatUser of data) {
          try {
            const roomId = getRoomId(user._id, chatUser._id);
            const { data: msgs } = await api.get(`/messages/${chatUser._id}`);
            const unread = msgs.filter(m => 
              (m.recipient === user._id || m.recipient === user._id.toString()) && 
              !m.read
            ).length;
            if (unread > 0) counts[roomId] = unread;
          } catch (e) {
            console.error('Error fetching unread count:', e);
          }
        }
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching chat list:', error);
      setChatList([]);
    }
  }, [user, socket]);

  // Join chat and fetch history
  const openChatWith = async (targetUser) => {
    if (!targetUser || !targetUser._id) {
      console.error('Invalid target user');
      return;
    }

    setActiveChatUser(targetUser);
    
    if (!socket || !connected) {
      console.warn('Socket not connected, cannot join room');
      setLoading(false);
      return;
    }

    // Join the room for real-time updates
    socket.emit('joinRoom', { targetUserId: targetUser._id });
    
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${targetUser._id}`);
      // Ensure messages are sorted by creation date
      const sorted = (data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(sorted);
      
      // Mark messages as read
      const roomId = getRoomId(user._id, targetUser._id);
      socket.emit('markRead', { roomId });
      
      // Clear unread count
      setUnreadCounts(prev => {
        const updated = { ...prev };
        delete updated[roomId];
        return updated;
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = (text) => {
    if (!socket || !connected) {
      console.error('Socket not connected');
      alert('Not connected. Please refresh the page.');
      return;
    }
    
    if (!activeChatUser || !text || !text.trim()) {
      return;
    }

    const trimmedText = text.trim();
    
    // Optimistic update for immediate feedback
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      sender: user._id,
      recipient: activeChatUser._id,
      content: trimmedText,
      createdAt: new Date().toISOString(),
      roomId: getRoomId(user._id, activeChatUser._id)
    };
    
    setMessages(msgs => [...msgs, tempMessage]);
    
    // Send via socket
    socket.emit('sendMessage', { 
      to: activeChatUser._id, 
      content: trimmedText 
    }, (response) => {
      if (response && response.error) {
        console.error('Error sending message:', response.error);
        // Remove optimistic update on error
        setMessages(msgs => msgs.filter(m => m._id !== tempMessage._id));
        alert('Failed to send message. Please try again.');
      }
    });
  };

  const value = useMemo(() => ({
    openChatWith, 
    sendMessage, 
    activeChatUser, 
    setActiveChatUser,
    messages, 
    loading, 
    connected,
    chatList,
    fetchChatList,
    unreadCounts
  }), [activeChatUser, messages, loading, connected, chatList, unreadCounts, socket, user]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

