import React, { useContext, useState, useMemo, useEffect, createContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../config/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null); // recipient user object
  const [messages, setMessages] = useState([]); // currently opened conversation
  const [loading, setLoading] = useState(false);

  // Init socket.io client on login
  useEffect(() => {
    if (!user) return;
    const s = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
      autoConnect: true,
      transports: ['websocket']
    });
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('newMessage', m => {
      if (activeChatUser && m.roomId === getRoomId(user._id, activeChatUser._id)) {
        setMessages(msgs => [...msgs, m]);
      }
    });
    return () => { s.disconnect(); };
    // eslint-disable-next-line
  }, [user]);

  // Join chat and fetch history
  const openChatWith = async (targetUser) => {
    setActiveChatUser(targetUser);
    if (!socket) return;
    socket.emit('joinRoom', { targetUserId: targetUser._id });
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${targetUser._id}`);
      setMessages(data);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  };

  // Send a new message
  const sendMessage = (text) => {
    if (!socket || !activeChatUser) return;
    socket.emit('sendMessage', { to: activeChatUser._id, content: text });
    // Optimistic update (will get echoed too, but keeps immediacy)
    setMessages(msgs => [...msgs, { sender: user._id, recipient: activeChatUser._id, content: text, createdAt: new Date().toISOString() }]);
  };

  const getRoomId = (id1, id2) => [id1, id2].sort().join('_');

  const value = useMemo(() => ({
    openChatWith, sendMessage, activeChatUser, setActiveChatUser,
    messages, loading, connected,
  }), [activeChatUser, messages, loading, connected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
