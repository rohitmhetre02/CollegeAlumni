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

  // Admin menu items
  if (user.role === 'admin') {
    menuItems.push(
      { path: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
      { path: '/admin/my-activity', icon: 'bi-clipboard-data', label: 'My Activity' },
      { path: '/admin/students', icon: 'bi-people', label: 'Student Directory' },
      { path: '/admin/alumni', icon: 'bi-person-check', label: 'Alumni Directory' },
      { path: '/admin/faculty', icon: 'bi-mortarboard', label: 'Faculty' },
      { path: '/admin/jobs', icon: 'bi-briefcase', label: 'Job Opportunity' },
      { path: '/admin/mentorships', icon: 'bi-person-heart', label: 'Mentorship' },
      { path: '/admin/news', icon: 'bi-newspaper', label: 'News' },
      { path: '/admin/events', icon: 'bi-calendar-event', label: 'Event' },
      { path: '/admin/gallery', icon: 'bi-images', label: 'Gallery' },
      { path: '/admin/messages', icon: 'bi-chat-dots', label: 'Messages' }
    );
  }

  // Coordinator menu items
  if (user.role === 'coordinator') {
    menuItems.push(
      { path: '/coordinator/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
      { path: '/coordinator/my-activity', icon: 'bi-clipboard-data', label: 'My Activity' },
      { path: '/coordinator/students', icon: 'bi-people', label: 'Student Directory' },
      { path: '/coordinator/alumni', icon: 'bi-person-check', label: 'Alumni Directory' },
      { path: '/coordinator/faculty', icon: 'bi-mortarboard', label: 'Faculty' },
      { path: '/coordinator/jobs', icon: 'bi-briefcase', label: 'Job Opportunity' },
      { path: '/coordinator/mentorships', icon: 'bi-person-heart', label: 'Mentorship' },
      { path: '/coordinator/news', icon: 'bi-newspaper', label: 'News' },
      { path: '/coordinator/events', icon: 'bi-calendar-event', label: 'Event' },
      { path: '/coordinator/gallery', icon: 'bi-images', label: 'Gallery' },
      { path: '/coordinator/messages', icon: 'bi-chat-dots', label: 'Messages' }
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
      <div className={`sidebar bg-dark text-white p-3 ${user.role === 'coordinator' ? 'coordinator' : 'admin'} ${isOpen ? 'show' : ''}`}>
        <div className="mb-4 text-center">
          <div className="fw-bold" style={{ fontSize: '1.25rem' }}>{user.name}</div>
          <div className="small text-secondary">({user.role?.toLowerCase()})</div>
        </div>

        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item mb-2" key={item.path}>
              <Link
                className={`nav-link text-white ${
                  location.pathname === item.path ? 'active' : ''
                }`}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                <i className={`bi ${item.icon}`}></i> {item.label}
              </Link>
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

