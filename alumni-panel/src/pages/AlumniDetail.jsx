import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AlumniDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatWith } = useChat();
  const [alumnus, setAlumnus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlumnus();
  }, [id]);

  const fetchAlumnus = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setAlumnus(response.data);
    } catch (error) {
      console.error('Error fetching alumnus:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!alumnus || alumnus.role !== 'alumni') {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">Alumnus not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/alumni')}>
          <i className="bi bi-arrow-left"></i> Back to Alumni Directory
        </button>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-4 text-center mb-4">
                <img
                  src={alumnus.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.name)}&size=200`}
                  alt={alumnus.name}
                  className="rounded-circle mb-3"
                  style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                />
                <h3>{alumnus.name}</h3>
                {alumnus.headline && <p className="text-muted">{alumnus.headline}</p>}
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => openChatWith(alumnus._id)}
                  >
                    <i className="bi bi-chat"></i> Message
                  </button>
                </div>
              </div>
              <div className="col-md-8">
                <h5 className="mb-3">Profile Information</h5>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Email:</strong>
                    <p>{alumnus.email}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Department:</strong>
                    <p>{alumnus.department}</p>
                  </div>
                </div>
                {alumnus.currentPosition && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Current Position:</strong>
                      <p>{alumnus.currentPosition}</p>
                    </div>
                    <div className="col-md-6">
                      <strong>Company:</strong>
                      <p>{alumnus.company || 'Not specified'}</p>
                    </div>
                  </div>
                )}
                {alumnus.graduationYear && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Graduation Year:</strong>
                      <p>{alumnus.graduationYear}</p>
                    </div>
                  </div>
                )}
                {alumnus.bio && (
                  <div className="mb-3">
                    <strong>Bio:</strong>
                    <p>{alumnus.bio}</p>
                  </div>
                )}
                {alumnus.skills && alumnus.skills.length > 0 && (
                  <div className="mb-3">
                    <strong>Skills:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {alumnus.skills.map((skill, idx) => (
                        <span key={idx} className="badge bg-primary">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(alumnus.linkedinUrl || alumnus.githubUrl || alumnus.portfolioUrl || alumnus.facebookUrl) && (
                  <div className="mb-3">
                    <strong>Social Links:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {alumnus.linkedinUrl && (
                        <a href={alumnus.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-linkedin"></i> LinkedIn
                        </a>
                      )}
                      {alumnus.githubUrl && (
                        <a href={alumnus.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                          <i className="bi bi-github"></i> GitHub
                        </a>
                      )}
                      {alumnus.portfolioUrl && (
                        <a href={alumnus.portfolioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm">
                          <i className="bi bi-globe"></i> Portfolio
                        </a>
                      )}
                      {alumnus.facebookUrl && (
                        <a href={alumnus.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-facebook"></i> Facebook
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniDetail;


