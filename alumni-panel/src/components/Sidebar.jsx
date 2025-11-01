import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [];
  // Block access if pending or rejected - only approved users get full access
  const isBlocked = (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected') && (user.role === 'student' || user.role === 'alumni');

  // Student menu items
  if (user.role === 'student') {
    menuItems.push(
      { path: '/student/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', disabled: false },
      { path: '/my-activity', icon: 'bi-clipboard-data', label: 'My Activity', disabled: isBlocked },
      { path: '/students', icon: 'bi-people', label: 'Student Directory', disabled: isBlocked },
      { path: '/alumni', icon: 'bi-person-check', label: 'Alumni Directory', disabled: isBlocked },
      { path: '/faculty', icon: 'bi-mortarboard', label: 'Faculty', disabled: isBlocked },
      { path: '/jobs-directory', icon: 'bi-briefcase', label: 'Job Opportunity', disabled: isBlocked },
      { path: '/mentorships-directory', icon: 'bi-person-heart', label: 'Mentorship', disabled: isBlocked },
      { path: '/news', icon: 'bi-newspaper', label: 'News', disabled: isBlocked },
      { path: '/events-directory', icon: 'bi-calendar-event', label: 'Event', disabled: isBlocked }
    );
  }

  // Alumni menu items
  if (user.role === 'alumni') {
    menuItems.push(
      { path: '/alumni/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', disabled: false },
      { path: '/my-activity', icon: 'bi-clipboard-data', label: 'My Activity', disabled: isBlocked },
      { path: '/students', icon: 'bi-people', label: 'Student Directory', disabled: isBlocked },
      { path: '/alumni', icon: 'bi-person-check', label: 'Alumni Directory', disabled: isBlocked },
      { path: '/faculty', icon: 'bi-mortarboard', label: 'Faculty', disabled: isBlocked },
      { path: '/jobs-directory', icon: 'bi-briefcase', label: 'Job Opportunity', disabled: isBlocked },
      { path: '/mentorships-directory', icon: 'bi-person-heart', label: 'Mentorship', disabled: isBlocked },
      { path: '/news', icon: 'bi-newspaper', label: 'News', disabled: isBlocked },
      { path: '/events-directory', icon: 'bi-calendar-event', label: 'Event', disabled: isBlocked }
    );
  }

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button 
        className="btn btn-primary d-lg-none mb-3" 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="bi bi-list"></i> Menu
      </button>

      {/* Sidebar */}
      <div className={`bg-dark text-white p-3 sidebar ${isOpen ? 'show' : ''}`}>
        <div className="mb-4 text-center">
          <div className="fw-bold" style={{ fontSize: '1.25rem' }}>{user.name}</div>
          <div className="small text-secondary">({user.role?.toLowerCase()})</div>
        </div>

        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item mb-2" key={item.path}>
              {item.disabled ? (
                <span
                  className={`nav-link text-white-50 ${
                    location.pathname === item.path ? 'active bg-secondary' : ''
                  }`}
                  style={{ cursor: 'not-allowed', opacity: 0.6 }}
                  title="Profile approval required"
                >
                  <i className={`bi ${item.icon}`}></i> {item.label} <i className="bi bi-lock-fill" style={{ fontSize: '0.7em' }}></i>
                </span>
              ) : (
                <Link
                  className={`nav-link text-white ${
                    location.pathname === item.path ? 'active bg-primary' : ''
                  }`}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i> {item.label}
                </Link>
              )}
            </li>
          ))}
          
          <li className="nav-item mt-3">
            <button className="btn btn-outline-light w-100" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;

