import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [openMsg, setOpenMsg] = useState(false);
  const profileRef = useRef(null);

  const notifications = [
    { id: 1, title: 'New job posted', message: 'TechCorp added 3 roles.' },
    { id: 2, title: 'Event reminder', message: 'Alumni Meetup in 2 days.' },
    { id: 3, title: 'Profile view', message: 'Someone viewed your profile.' }
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

  // Close notification if opening message, vice versa
  const openMessages = () => { setOpenNotif(false); setOpenMsg(true); };
  const openNotifications = () => { setOpenMsg(false); setOpenNotif(true); };

  return (
    <div className="d-flex align-items-center justify-content-end py-2 px-3 border-bottom bg-white" style={{ position: 'sticky', top: 0, zIndex: 1020 }}>
      {/* Notification Icon */}
      <button className="btn btn-link text-dark me-2" onClick={openNotifications} aria-label="Notifications">
        <i className="bi bi-bell fs-5"></i>
      </button>
      {/* Message Icon */}
      <button className="btn btn-link text-dark me-2" onClick={openMessages} aria-label="Messages">
        <i className="bi bi-chat-dots fs-5"></i>
      </button>

      {/* Profile Dropdown */}
      <div className="position-relative" ref={profileRef}>
        <button className="btn btn-link text-dark d-flex align-items-center" onClick={() => setOpenProfile(!openProfile)} aria-label="Profile">
          <i className="bi bi-person-circle fs-5"></i>
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

      {/* Right-side Notification Drawer */}
      <div
        className={`position-fixed top-0 end-0 h-100 bg-white border-start shadow ${openNotif ? '' : 'd-none'}`}
        style={{ width: '360px', zIndex: 1050 }}
      >
        <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2">
          <h6 className="mb-0"><i className="bi bi-bell"></i> Notifications</h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpenNotif(false)}>
            Close
          </button>
        </div>
        <div className="p-3" style={{ overflowY: 'auto', height: 'calc(100% - 48px)' }}>
          {notifications.map(n => (
            <div key={n.id} className="mb-3">
              <div className="fw-semibold">{n.title}</div>
              <div className="text-muted small">{n.message}</div>
              <hr />
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center text-muted">No notifications</div>
          )}
        </div>
      </div>
      {/* Right-side Message Drawer */}
      <div
        className={`position-fixed top-0 end-0 h-100 bg-white border-start shadow ${openMsg ? '' : 'd-none'}`}
        style={{ width: '360px', zIndex: 1050 }}
      >
        <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2">
          <h6 className="mb-0"><i className="bi bi-chat-dots"></i> Messages</h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpenMsg(false)}>
            Close
          </button>
        </div>
        <div className="p-3" style={{ overflowY: 'auto', height: 'calc(100% - 48px)' }}>
          <div className="mb-3">
            <div className="fw-semibold">Onkar (Counselor)</div>
            <div className="text-muted small">Let me know if you need any help!</div>
            <hr />
          </div>
          <div className="mb-3">
            <div className="fw-semibold">Ritika (Admin)</div>
            <div className="text-muted small">Welcome to the alumni portal 👋</div>
            <hr />
          </div>
          <div className="mb-3">
            <div className="fw-semibold">Ravi (Alumni)</div>
            <div className="text-muted small">Nice to connect! Are you coming for the meetup?</div>
            <hr />
          </div>
        </div>
      </div>
      {openNotif && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1040 }} onClick={() => setOpenNotif(false)}></div>
      )}
      {openMsg && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1040 }} onClick={() => setOpenMsg(false)}></div>
      )}
    </div>
  );
};

export default Topbar;


