import { useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

const ChatDrawer = () => {
  const { activeChatUser, setActiveChatUser, messages, sendMessage, loading, connected } = useChat();
  const inputRef = useRef();
  const lastMsgRef = useRef();

  // Auto-scroll
  useEffect(() => {
    if (lastMsgRef.current) lastMsgRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatUser]);

  if (!activeChatUser) return null;

  const handleSend = (e) => {
    e.preventDefault();
    const val = inputRef.current.value.trim();
    if (val) {
      sendMessage(val);
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <div
        className={`position-fixed top-0 end-0 h-100 bg-white border-start shadow`}
        style={{ width: '370px', zIndex: 1300 }}
      >
        <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2 bg-light">
          <div>
            {activeChatUser && <><b>{activeChatUser.name}</b> <span className="badge bg-secondary small ms-1">{activeChatUser.role}</span></>}
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setActiveChatUser(null)}>
            <i className="bi bi-x"></i>
          </button>
        </div>
        <div className="px-3 py-2" style={{ overflowY: 'auto', height: '76vh' }}>
          {loading ? <div className="text-center">Loading...</div> : (
            messages && messages.length ? (
              messages.map((m,i) => (
                <div key={i} className={
                  "mb-2 d-flex flex-column" + (m.sender===activeChatUser._id? " align-items-start" : " align-items-end")
                }>
                  <span className={
                    "rounded px-2 py-1 " +
                    (m.sender===activeChatUser._id ? 'bg-light border' : 'bg-primary text-white')
                  }>
                    {m.content}
                  </span>
                  <span ref={i===messages.length-1?lastMsgRef:null} className="small text-muted">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              ))
            ) : <div className="text-center text-muted">No messages yet.</div>
          )}
        </div>
        <form className="border-top d-flex p-2 position-absolute bottom-0 w-100 bg-white" style={{height:60}} onSubmit={handleSend}>
          <input ref={inputRef} className="form-control me-2" placeholder="Type a message..." autoFocus disabled={!connected} />
          <button type="submit" className="btn btn-primary" disabled={!connected}><i className="bi bi-send"></i></button>
        </form>
      </div>
      <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.15)', zIndex: 1200 }} onClick={() => setActiveChatUser(null)} />
    </>
  );
};

export default ChatDrawer;
