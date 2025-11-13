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
            // Check if this is a duplicate by _id
            const duplicateById = msgs.some(msg => msg._id === m._id);
            if (duplicateById) {
              return msgs; // Already exists, don't add
            }

            // Check if this matches a temp message (optimistic update) - replace it
            // Match by content and sender (since temp messages have temp_ IDs)
            const tempMessageIndex = msgs.findIndex(msg => {
              const isTemp = msg._id?.toString().startsWith('temp_');
              const sameContent = msg.content === m.content;
              const sameSender = (msg.sender === user._id || msg.sender === user._id.toString()) &&
                                 (m.sender === user._id || m.sender === user._id.toString());
              const timeClose = Math.abs(new Date(msg.createdAt) - new Date(m.createdAt)) < 10000; // 10 seconds
              
              return isTemp && sameContent && sameSender && timeClose;
            });

            if (tempMessageIndex !== -1) {
              // Replace temp message with real message
              const updated = [...msgs];
              updated[tempMessageIndex] = m;
              console.log('✅ Replaced temp message with real message:', m._id);
              return updated;
            }

            // Check for duplicate by content and time (fallback - for messages from others)
            // Only check this for messages NOT from current user (to avoid duplicates)
            const isFromCurrentUser = m.sender === user._id || m.sender === user._id.toString();
            
            if (!isFromCurrentUser) {
              // This is a message from someone else
              const duplicateByContent = msgs.some(msg => 
                msg._id !== m._id && // Not the same message
                !msg._id?.toString().startsWith('temp_') && // Not a temp message
                msg.content === m.content &&
                (msg.sender === m.sender || msg.sender?.toString() === m.sender?.toString()) &&
                Math.abs(new Date(msg.createdAt) - new Date(m.createdAt)) < 1000
              );
              
              if (!duplicateByContent) {
                // Mark as read if user is viewing
                setTimeout(() => s.emit('markRead', { roomId }), 100);
                return [...msgs, m];
              }
            } else {
              // For messages from current user: 
              // If we didn't find a temp message to replace, check if there's already a real message with this content
              // This prevents duplicates if temp replacement failed for some reason
              const hasRealMessage = msgs.some(msg => 
                msg._id === m._id || // Exact match
                (!msg._id?.toString().startsWith('temp_') && 
                 msg.content === m.content &&
                 (msg.sender === user._id || msg.sender === user._id.toString()) &&
                 Math.abs(new Date(msg.createdAt) - new Date(m.createdAt)) < 2000)
              );
              
              if (!hasRealMessage) {
                // Mark as read if user is viewing
                setTimeout(() => s.emit('markRead', { roomId }), 100);
                return [...msgs, m];
              }
              // If hasRealMessage is true, don't add (already exists)
            }
          }
        }
        return msgs;
      });

      // Update unread count for received messages (only if not from current user)
      if ((m.recipient === user._id || m.recipient === user._id.toString()) && 
          (m.sender !== user._id && m.sender !== user._id.toString())) {
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

  // Note: Message handling is done in the main socket connection useEffect above
  // This separate useEffect is removed to avoid duplicate listeners

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
      // Also filter out any temp messages that might be lingering
      const sorted = (data || [])
        .filter(msg => !msg._id?.toString().startsWith('temp_'))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
