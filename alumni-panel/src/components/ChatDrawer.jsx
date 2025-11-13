import { useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const ChatDrawer = () => {
  const { user } = useAuth();
  const { activeChatUser, setActiveChatUser, messages, sendMessage, loading, connected } = useChat();
  const inputRef = useRef();
  const lastMsgRef = useRef();
  const messagesEndRef = useRef();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!activeChatUser) return null;

  const handleSend = (e) => {
    e.preventDefault();
    const val = inputRef.current?.value?.trim();
    if (val && connected) {
      sendMessage(val);
      inputRef.current.value = '';
    }
  };

  const isMyMessage = (message) => {
    return message.sender === user?._id || message.sender === user?.id || 
           (message.sender?._id === user?._id) || (message.sender?.toString() === user?._id?.toString());
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div
        className="position-fixed top-0 end-0 h-100 bg-white border-start shadow-lg"
        style={{ 
          width: '400px', 
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-3" style={{
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
          color: 'white'
        }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              {activeChatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                {activeChatUser?.name || 'User'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {activeChatUser?.role && (
                  <span className="badge bg-white text-dark" style={{ fontSize: '10px' }}>
                    {activeChatUser.role}
                  </span>
                )}
                {connected ? (
                  <span className="ms-2" style={{ fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block', marginRight: '4px' }}></span>
                    Online
                  </span>
                ) : (
                  <span className="ms-2" style={{ fontSize: '11px', opacity: 0.7 }}>
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm" 
            onClick={() => setActiveChatUser(null)}
            style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Messages Area */}
        <div 
          className="px-3 py-3" 
          style={{ 
            overflowY: 'auto', 
            flex: 1,
            background: '#f8f9fa'
          }}
        >
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            messages && messages.length > 0 ? (
              <>
                {messages.map((m, i) => {
                  const isMine = isMyMessage(m);
                  const showAvatar = i === 0 || isMyMessage(messages[i - 1]) !== isMine;
                  
                  return (
                    <div 
                      key={m._id || i} 
                      className={`mb-2 d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
                      style={{ alignItems: 'flex-end' }}
                    >
                      <div style={{ maxWidth: '75%' }}>
                        {!isMine && showAvatar && (
                          <div className="small text-muted mb-1" style={{ paddingLeft: '8px' }}>
                            {activeChatUser.name}
                          </div>
                        )}
                        <div className={`d-flex ${isMine ? 'flex-row-reverse' : 'flex-row'} align-items-end gap-2`}>
                          {!isMine && showAvatar && (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#1976D2',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '12px',
                              flexShrink: 0
                            }}>
                              {activeChatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div style={{ 
                            background: isMine ? 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)' : '#ffffff',
                            color: isMine ? 'white' : '#333',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            wordWrap: 'break-word',
                            maxWidth: '100%'
                          }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                            <div style={{ 
                              fontSize: '10px', 
                              opacity: 0.7, 
                              marginTop: '4px',
                              textAlign: isMine ? 'right' : 'left'
                            }}>
                              {formatTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="text-center text-muted py-5">
                <i className="bi bi-chat-dots" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                <p className="mt-3">No messages yet. Start the conversation!</p>
              </div>
            )
          )}
        </div>

        {/* Input Area */}
        <div className="border-top p-3 bg-white">
          {!connected && (
            <div className="alert alert-warning mb-2 py-2" style={{ fontSize: '12px' }}>
              <i className="bi bi-exclamation-triangle me-1"></i>
              Not connected. Please refresh the page.
            </div>
          )}
          <form className="d-flex gap-2" onSubmit={handleSend}>
            <input 
              ref={inputRef} 
              className="form-control" 
              placeholder={connected ? "Type a message..." : "Connecting..."} 
              disabled={!connected}
              style={{ borderRadius: '20px', border: '1px solid #e0e0e0' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!connected}
              style={{ 
                borderRadius: '50%', 
                width: '44px', 
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      </div>
      {/* Backdrop */}
      <div 
        className="position-fixed top-0 start-0 w-100 h-100" 
        style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1200 }} 
        onClick={() => setActiveChatUser(null)} 
      />
    </>
  );
};

export default ChatDrawer;
