import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Messages = () => {
  const { user } = useAuth();
  const { 
    chatList, 
    openChatWith, 
    activeChatUser, 
    setActiveChatUser,
    messages, 
    sendMessage, 
    unreadCounts, 
    fetchChatList, 
    connected,
    loading: chatLoading
  } = useChat();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [pinnedChats, setPinnedChats] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Fetch all available contacts
  const fetchAllContacts = useCallback(async () => {
    try {
      const { data } = await api.get('/messages');
      setAllContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setAllContacts([]);
    }
  }, []);

  useEffect(() => {
    if (connected) {
      fetchChatList();
      fetchAllContacts();
    }
  }, [connected, fetchChatList, fetchAllContacts]);

  useEffect(() => {
    // Separate pinned chats from regular chats
    const pinned = chatList.filter(chat => chat.pinned);
    const regular = chatList.filter(chat => !chat.pinned);
    setPinnedChats(pinned);
  }, [chatList]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigate to profile
  const handleViewProfile = (chatUser) => {
    if (!chatUser || !chatUser._id) return;
    
    const userId = chatUser._id || chatUser.id;
    const role = chatUser.role;
    
    if (role === 'student') {
      navigate(`/student/${userId}`);
    } else if (role === 'alumni') {
      navigate(`/alumnus/${userId}`);
    } else if (role === 'coordinator' || role === 'faculty') {
      navigate(`/faculty/${userId}`);
    } else {
      // Default or admin
      navigate(`/profile/${userId}`);
    }
  };

  // Handle video call redirect
  const handleVideoCall = (chatUser) => {
    if (!chatUser || !chatUser._id) return;
    // Navigate to video call page or implement video call functionality
    const userId = chatUser._id || chatUser.id;
    navigate(`/call/video/${userId}`);
  };

  // Handle phone call redirect
  const handlePhoneCall = (chatUser) => {
    if (!chatUser || !chatUser._id) return;
    const phoneNumber = chatUser.mobileNumber || chatUser.phone;
    
    if (phoneNumber) {
      // Use tel: link to initiate phone call
      window.location.href = `tel:${phoneNumber}`;
    } else {
      // Navigate to phone call page if no phone number
      const userId = chatUser._id || chatUser.id;
      navigate(`/call/phone/${userId}`);
    }
  };

  // Handle pin/unpin conversation
  const handlePinConversation = async () => {
    if (!activeChatUser) return;
    
    try {
      const userId = activeChatUser._id || activeChatUser.id;
      if (!userId) {
        console.error('Invalid user ID');
        return;
      }

      const response = await api.post(`/messages/${userId}/pin`);
      const data = response.data;
      
      if (response.status === 200 && data && data.success) {
        // Refresh chat list to show updated pinned status
        await fetchChatList();
        await fetchAllContacts();
        setShowMenu(false);
      } else {
        console.error('Unexpected response:', response);
      }
    } catch (error) {
      console.error('Error pinning conversation:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      // Don't show alert - let the user see the state doesn't change if there's an error
    }
  };

  // Handle remove conversation
  const handleRemoveConversation = async () => {
    if (!activeChatUser) return;
    
    if (!window.confirm('Are you sure you want to remove this conversation? This will hide it from your conversation list.')) {
      return;
    }
    
    try {
      const userId = activeChatUser._id || activeChatUser.id;
      if (!userId) {
        console.error('Invalid user ID');
        return;
      }

      const response = await api.post(`/messages/${userId}/delete`);
      
      if (response.status === 200 && response.data && response.data.success) {
        // Close the chat and refresh list
        setActiveChatUser(null);
        setMessages([]);
        await fetchChatList();
        await fetchAllContacts();
        setShowMenu(false);
      } else {
        console.error('Unexpected response:', response);
      }
    } catch (error) {
      console.error('Error removing conversation:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      // Don't show alert - let the user see the state doesn't change if there's an error
    }
  };

  // Check if current conversation is pinned
  const isCurrentConversationPinned = useMemo(() => {
    if (!activeChatUser) return false;
    const userId = user?.id || user?._id;
    const chatUserId = activeChatUser._id || activeChatUser.id;
    const currentChat = allContacts.find(
      c => (c._id || c.id) === chatUserId
    );
    return currentChat?.pinned || false;
  }, [activeChatUser, allContacts, user]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today, ' + date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Get color for sender name based on their name hash
  const getSenderColor = (senderName) => {
    const colors = [
      '#F59E0B', // Yellow/Orange
      '#EC4899', // Pink
      '#8B5CF6', // Purple
      '#10B981', // Green
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#F97316', // Orange
      '#06B6D4', // Cyan
    ];
    if (!senderName) return colors[0];
    let hash = 0;
    for (let i = 0; i < senderName.length; i++) {
      hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get avatar color based on name
  const getAvatarColor = (name) => {
    const colors = [
      '#F59E0B', '#EC4899', '#8B5CF6', '#10B981', 
      '#3B82F6', '#EF4444', '#F97316', '#06B6D4'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && activeChatUser) {
      sendMessage(messageInput);
      setMessageInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const getRoomId = (id1, id2) => {
    const ids = [String(id1), String(id2)].sort();
    return ids.join('_');
  };

  // Merge chatList with allContacts, adding lastMessage info from chatList
  const mergedContactList = useMemo(() => {
    const chatMap = new Map();
    chatList.forEach(chat => {
      chatMap.set(chat._id?.toString() || chat.id?.toString(), chat);
    });

    return allContacts.map(contact => {
      const chatInfo = chatMap.get(contact._id?.toString() || contact.id?.toString());
      return {
        ...contact,
        lastMessage: chatInfo?.lastMessage || null,
        pinned: chatInfo?.pinned || false
      };
    });
  }, [chatList, allContacts]);

  const filteredContacts = mergedContactList.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return contact.name?.toLowerCase().includes(searchLower);
  });

  const filteredPinnedChats = filteredContacts.filter(chat => chat.pinned);
  const filteredRegularChats = filteredContacts.filter(chat => !chat.pinned);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 d-flex" style={{ backgroundColor: '#ffffff', minHeight: '100vh', height: 'calc(100vh - 60px)' }}>
        {/* Left Sidebar - Conversation List */}
        <div style={{ width: '380px', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', height: '100%' }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 fw-bold">Messages</h4>
              <div className="d-flex gap-2">
                <button className="btn btn-link p-0 text-dark" style={{ fontSize: '20px' }}>
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button className="btn btn-link p-0 text-dark" style={{ fontSize: '20px' }}>
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
              </div>
            </div>
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9CA3AF',
                fontSize: '16px'
              }}></i>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Pinned Section */}
            {filteredPinnedChats.length > 0 && (
              <div style={{ padding: '12px 20px 8px 20px' }}>
                <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                  <i className="bi bi-pin-fill" style={{ fontSize: '10px' }}></i>
                  <span>Pinned</span>
                </div>
                {filteredPinnedChats.map((chatUser) => {
                  const userId = user?.id || user?._id;
                  const chatUserId = chatUser._id || chatUser.id;
                  const roomId = userId && chatUserId ? getRoomId(userId, chatUserId) : '';
                  const unread = unreadCounts[roomId] || 0;
                  const isActive = activeChatUser?._id === chatUser._id || activeChatUser?.id === chatUser.id;

                  return (
                    <div
                      key={chatUser._id || chatUser.id}
                      onClick={() => openChatWith(chatUser)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#F3F4F6' : 'transparent',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ position: 'relative' }}>
                          <img
                            src={chatUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.name || 'User')}&size=40&background=4F46E5&color=fff`}
                            alt={chatUser.name}
                            className="rounded-circle"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.name || 'User')}&size=40&background=4F46E5&color=fff`;
                            }}
                          />
                          {unread > 0 && (
                            <span
                              className="badge bg-danger rounded-pill position-absolute"
                              style={{ 
                                fontSize: '0.65rem', 
                                padding: '2px 5px', 
                                minWidth: '18px',
                                top: '-2px',
                                right: '-2px'
                              }}
                            >
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="mb-0 fw-bold" style={{ fontSize: '14px' }}>{chatUser.name || 'Unknown User'}</h6>
                            {chatUser.lastMessage?.createdAt && (
                              <small className="text-muted" style={{ fontSize: '12px' }}>
                                {formatTime(chatUser.lastMessage.createdAt)}
                              </small>
                            )}
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                              {chatUser.lastMessage?.content ? (
                                <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                  {chatUser.lastMessage.content}
                                </span>
                              ) : (
                                'No messages yet'
                              )}
                            </p>
                            {!unread && chatUser.lastMessage && (
                              <i className="bi bi-check2-all text-primary" style={{ fontSize: '14px' }}></i>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* All Messages Section */}
            <div style={{ padding: filteredPinnedChats.length > 0 ? '8px 20px 12px 20px' : '12px 20px' }}>
              {filteredPinnedChats.length > 0 && (
                <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                  <i className="bi bi-chat-dots" style={{ fontSize: '10px' }}></i>
                  <span>All Messages</span>
                </div>
              )}
              {filteredRegularChats.length === 0 && !chatLoading ? (
                <div className="text-center py-5">
                  <i className="bi bi-chat-dots text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p className="mt-3 text-muted" style={{ fontSize: '14px' }}>No contacts found</p>
                </div>
              ) : (
                filteredRegularChats.map((chatUser) => {
                  const userId = user?.id || user?._id;
                  const chatUserId = chatUser._id || chatUser.id;
                  const roomId = userId && chatUserId ? getRoomId(userId, chatUserId) : '';
                  const unread = unreadCounts[roomId] || 0;
                  const isActive = activeChatUser?._id === chatUser._id || activeChatUser?.id === chatUser.id;

                  return (
                    <div
                      key={chatUser._id || chatUser.id}
                      onClick={() => openChatWith(chatUser)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#F3F4F6' : 'transparent',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ position: 'relative' }}>
                          <img
                            src={chatUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.name || 'User')}&size=40&background=4F46E5&color=fff`}
                            alt={chatUser.name}
                            className="rounded-circle"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.name || 'User')}&size=40&background=4F46E5&color=fff`;
                            }}
                          />
                          {unread > 0 && (
                            <span
                              className="badge bg-danger rounded-pill position-absolute"
                              style={{ 
                                fontSize: '0.65rem', 
                                padding: '2px 5px', 
                                minWidth: '18px',
                                top: '-2px',
                                right: '-2px'
                              }}
                            >
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="mb-0 fw-bold" style={{ fontSize: '14px' }}>{chatUser.name || 'Unknown User'}</h6>
                            {chatUser.lastMessage?.createdAt && (
                              <small className="text-muted" style={{ fontSize: '12px' }}>
                                {formatTime(chatUser.lastMessage.createdAt)}
                              </small>
                            )}
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                              {chatUser.lastMessage?.content ? (
                                <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                  {chatUser.lastMessage.content}
                                </span>
                              ) : (
                                'No messages yet'
                              )}
                            </p>
                            {!unread && chatUser.lastMessage && (
                              <i className="bi bi-check2-all text-primary" style={{ fontSize: '14px' }}></i>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Active Chat */}
        <div className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#FFFFFF', height: '100%' }}>
          {!activeChatUser ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100" style={{ color: '#9CA3AF' }}>
              <i className="bi bi-chat-dots" style={{ fontSize: '4rem', opacity: 0.3, marginBottom: '16px' }}></i>
              <h5 className="text-muted">No message selected</h5>
              <p className="text-muted" style={{ fontSize: '14px' }}>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div 
                  className="d-flex align-items-center gap-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewProfile(activeChatUser)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <img
                    src={activeChatUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChatUser.name || 'User')}&size=40&background=4F46E5&color=fff`}
                    alt={activeChatUser.name}
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChatUser.name || 'User')}&size=40&background=4F46E5&color=fff`;
                    }}
                  />
                  <div>
                    <h6 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>{activeChatUser.name || 'Unknown User'}</h6>
                    <small className="text-success" style={{ fontSize: '12px' }}>Online</small>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-link p-0 text-dark"
                    onClick={() => handleVideoCall(activeChatUser)}
                    title="Video Call"
                  >
                    <i className="bi bi-camera-video" style={{ fontSize: '18px' }}></i>
                  </button>
                  <button 
                    className="btn btn-link p-0 text-dark"
                    onClick={() => handlePhoneCall(activeChatUser)}
                    title="Phone Call"
                  >
                    <i className="bi bi-telephone" style={{ fontSize: '18px' }}></i>
                  </button>
                  <div style={{ position: 'relative' }} ref={menuRef}>
                    <button 
                      className="btn btn-link p-0 text-dark"
                      onClick={() => setShowMenu(!showMenu)}
                      title="More Options"
                    >
                      <i className="bi bi-three-dots-vertical" style={{ fontSize: '18px' }}></i>
                    </button>
                    {showMenu && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '8px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          minWidth: '180px',
                          zIndex: 1000
                        }}
                      >
                        <button
                          className="btn btn-link text-dark w-100 text-start d-flex align-items-center gap-2"
                          style={{
                            padding: '10px 16px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            border: 'none',
                            borderBottom: '1px solid #E5E7EB'
                          }}
                          onClick={handlePinConversation}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <i className={`bi ${isCurrentConversationPinned ? 'bi-pin-fill' : 'bi-pin'}`}></i>
                          {isCurrentConversationPinned ? 'Unpin Conversation' : 'Pin Conversation'}
                        </button>
                        <button
                          className="btn btn-link text-danger w-100 text-start d-flex align-items-center gap-2"
                          style={{
                            padding: '10px 16px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            border: 'none'
                          }}
                          onClick={handleRemoveConversation}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <i className="bi bi-trash"></i>
                          Remove Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#F9FAFB' }}>
                {chatLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100" style={{ padding: '40px' }}>
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      backgroundColor: '#F3F4F6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '24px'
                    }}>
                      <i className="bi bi-chat-dots text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                    </div>
                    <h5 className="text-muted mb-2">No messages yet</h5>
                    <p className="text-muted text-center" style={{ fontSize: '14px', maxWidth: '300px' }}>
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  Object.keys(groupedMessages).map((dateKey) => {
                    const dateMessages = groupedMessages[dateKey];
                    const firstMessageDate = dateMessages[0]?.createdAt;
                    
                    return (
                      <div key={dateKey}>
                        {/* Date Separator */}
                        <div className="d-flex align-items-center my-4" style={{ position: 'relative' }}>
                          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                          <div style={{ 
                            padding: '0 12px',
                            fontSize: '12px',
                            color: '#6B7280',
                            backgroundColor: '#F9FAFB'
                          }}>
                            {formatDateSeparator(firstMessageDate)}
                          </div>
                          <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                        </div>

                        {/* Messages for this date */}
                        {dateMessages.map((message, msgIndex) => {
                          const isMine = (message.sender === user.id || message.sender === user._id) || 
                                        (message.sender?._id === user.id || message.sender?._id === user._id);
                          
                          // Get sender info - use populated sender or activeChatUser
                          const senderInfo = message.sender?.name 
                            ? message.sender 
                            : (!isMine ? activeChatUser : { name: user.name, profilePicture: user.profilePicture });
                          
                          const senderName = isMine ? 'You' : (senderInfo?.name || 'Unknown');
                          const senderColor = getSenderColor(senderName);
                          const avatarColor = getAvatarColor(senderName);
                          
                          // Check if we should show avatar (show if different from previous message sender)
                          const prevMessage = msgIndex > 0 ? dateMessages[msgIndex - 1] : null;
                          const prevSender = prevMessage 
                            ? ((prevMessage.sender === user.id || prevMessage.sender === user._id) || 
                               (prevMessage.sender?._id === user.id || prevMessage.sender?._id === user._id))
                            : null;
                          const showAvatar = !prevMessage || 
                            (prevSender !== isMine) ||
                            (prevMessage.sender?.toString() !== message.sender?.toString() && 
                             prevMessage.sender?._id?.toString() !== message.sender?._id?.toString());
                          
                          return (
                            <div
                              key={message._id}
                              className={`d-flex align-items-start gap-2 mb-3 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
                            >
                              {!isMine && (
                                <div style={{ width: '32px', flexShrink: 0 }}>
                                  {showAvatar ? (
                                    <img
                                      src={senderInfo?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&size=32&background=${avatarColor.replace('#', '')}&color=fff`}
                                      alt={senderName}
                                      className="rounded-circle"
                                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&size=32&background=${avatarColor.replace('#', '')}&color=fff`;
                                      }}
                                    />
                                  ) : (
                                    <div style={{ width: '32px' }}></div>
                                  )}
                                </div>
                              )}
                              <div style={{ maxWidth: '60%' }}>
                                {!isMine && showAvatar && (
                                  <div className="mb-1" style={{ fontSize: '12px', fontWeight: '600', color: senderColor }}>
                                    {senderName}
                                  </div>
                                )}
                                <div
                                  style={{
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    backgroundColor: isMine ? '#4F46E5' : '#FFFFFF',
                                    color: isMine ? '#FFFFFF' : '#111827',
                                    boxShadow: isMine ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                                    border: !isMine ? '1px solid #F3F4F6' : 'none'
                                  }}
                                >
                                  {message.content}
                                </div>
                                <div className="mt-1" style={{ fontSize: '11px', color: '#9CA3AF', paddingLeft: !isMine ? '4px' : '0' }}>
                                  {formatMessageTime(message.createdAt)}
                                </div>
                              </div>
                              {isMine && (
                                <div style={{ width: '32px', flexShrink: 0 }}>
                                  {showAvatar ? (
                                    <img
                                      src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=32&background=EF4444&color=fff`}
                                      alt={user.name}
                                      className="rounded-circle"
                                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=32&background=EF4444&color=fff`;
                                      }}
                                    />
                                  ) : (
                                    <div style={{ width: '32px' }}></div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '20px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ borderRadius: '20px', padding: '10px 20px' }}
                    disabled={!messageInput.trim()}
                  >
                    <i className="bi bi-send"></i>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
