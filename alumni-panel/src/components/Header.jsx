import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-graduation-cap"></i> Alumni Portal
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            
            {isAuthenticated ? (
              <>
                {user.role === 'student' && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/jobs">
                        Jobs
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/events">
                        Events
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/mentorships">
                        Mentorships
                      </Link>
                    </li>
                  </>
                )}
                
                {user.role === 'alumni' && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/jobs">
                        Jobs
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/events">
                        Events
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/mentorships">
                        Mentorships
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/dashboard">
                        Dashboard
                      </Link>
                    </li>
                  </>
                )}
                
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    Profile
                  </Link>
                </li>
                
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-outline-light" to="/login">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;

