import { Link } from 'react-router-dom';
import Header from '../components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  return (
    <>
      <Header />
      
      <div className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Welcome to Alumni Portal
              </h1>
              <p className="lead mb-4">
                Connect with alumni, explore job opportunities, attend events, 
                and find mentorship programs. Your gateway to a thriving professional network.
              </p>
              <div className="d-flex gap-3">
                <Link to="/login" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/register" className="btn btn-outline-primary btn-lg">
                  Register
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <img
                src="https://via.placeholder.com/600x400/667eea/ffffff?text=Alumni+Portal"
                className="img-fluid rounded-3 shadow-lg"
                alt="Alumni Portal"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <h2 className="text-center mb-5">Features</h2>
        
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="mb-3">
                  <i className="bi bi-briefcase" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                </div>
                <h4 className="card-title">Job Opportunities</h4>
                <p className="card-text">
                  Explore job postings from alumni and apply for positions that match your skills.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="mb-3">
                  <i className="bi bi-calendar-event" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                </div>
                <h4 className="card-title">Events</h4>
                <p className="card-text">
                  Attend workshops, seminars, and networking events organized by alumni.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="mb-3">
                  <i className="bi bi-people" style={{ fontSize: '3rem', color: '#667eea' }}></i>
                </div>
                <h4 className="card-title">Mentorship</h4>
                <p className="card-text">
                  Get guidance from experienced alumni through mentorship programs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-primary text-white text-center py-4 mt-5">
        <p className="mb-0">&copy; 2024 Alumni Portal. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Home;

