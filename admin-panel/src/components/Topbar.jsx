import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const { unreadCounts } = useChat();
  const navigate = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const profileRef = useRef(null);

  const notifications = [
    { id: 1, title: 'Pending approvals', message: '3 new users awaiting review.' },
    { id: 2, title: 'Event today', message: 'Department seminar at 3 PM.' },
    { id: 3, title: 'Report ready', message: 'Weekly report has been generated.' }
  ];

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => logout();
  const openMessages = () => { 
    const basePath = user?.role === 'admin' ? '/admin' : '/coordinator';
    navigate(`${basePath}/messages`);
  };
  const openNotifications = () => { setOpenNotif(true); };

  return (
    <div className="d-flex align-items-center justify-content-end py-2 px-3 border-bottom bg-white" style={{ position: 'sticky', top: 0, zIndex: 1020 }}>
      <button className="btn btn-link text-dark me-2" onClick={openNotifications} aria-label="Notifications">
        <i className="bi bi-bell fs-5"></i>
      </button>
      <button 
        className="btn btn-link text-dark me-2 position-relative" 
        onClick={openMessages} 
        aria-label="Messages"
      >
        <i className="bi bi-chat-dots fs-5"></i>
        {(() => {
          const totalUnread = Object.values(unreadCounts || {}).reduce((sum, count) => sum + count, 0);
          return totalUnread > 0 && (
            <span 
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem', padding: '2px 5px', minWidth: '18px' }}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          );
        })()}
      </button>
      <div className="position-relative" ref={profileRef}>
        <button className="btn btn-link text-dark d-flex align-items-center p-0" onClick={() => setOpenProfile(!openProfile)} aria-label="Profile" style={{ borderRadius: '50%', overflow: 'hidden' }}>
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.name || 'Profile'} 
              style={{ 
                width: '32px', 
                height: '32px', 
                objectFit: 'cover', 
                borderRadius: '50%',
                border: '2px solid #dee2e6'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <i className={`bi bi-person-circle fs-5 ${user?.profilePicture ? 'd-none' : ''}`}></i>
        </button>
        {openProfile && (
          <div className="dropdown-menu dropdown-menu-end show" style={{ right: 0 }}>
            <Link className="dropdown-item" to="/profile" onClick={() => setOpenProfile(false)}>
              <i className="bi bi-person me-2"></i> Profile
            </Link>
            <button className="dropdown-item" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </button>
          </div>
        )}
      </div>

      <div
        className={`position-fixed top-0 end-0 h-100 bg-white border-start shadow ${openNotif ? '' : 'd-none'}`}
        style={{ width: '360px', zIndex: 1050 }}
      >
        <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2">
          <h6 className="mb-0"><i className="bi bi-bell"></i> Notifications</h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpenNotif(false)}>Close</button>
        </div>
        <div className="p-3" style={{ overflowY: 'auto', height: 'calc(100% - 48px)' }}>
          {notifications.map(n => (
            <div key={n.id} className="mb-3">
              <div className="fw-semibold">{n.title}</div>
              <div className="text-muted small">{n.message}</div>
              <hr />
            </div>
          ))}
        </div>
      </div>
      {openNotif && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1040 }} onClick={() => setOpenNotif(false)}></div>
      )}
    </div>
  );
};

export default Topbar;


