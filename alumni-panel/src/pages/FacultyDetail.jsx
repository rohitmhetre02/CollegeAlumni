import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const FacultyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatWith } = useChat();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaculty();
  }, [id]);

  const fetchFaculty = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setFaculty(response.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
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

  if (!faculty || faculty.role !== 'coordinator') {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">Faculty member not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/faculty')}>
          <i className="bi bi-arrow-left"></i> Back to Faculty
        </button>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-4 text-center mb-4">
                <img
                  src={faculty.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&size=200`}
                  alt={faculty.name}
                  className="rounded-circle mb-3"
                  style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                />
                <h3>{faculty.name}</h3>
                <p className="text-muted">{faculty.designation || faculty.title || 'Faculty'}</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => openChatWith(faculty._id)}
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
                    <p>{faculty.email}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Department:</strong>
                    <p>{faculty.department}</p>
                  </div>
                </div>
                {faculty.phone && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Phone:</strong>
                      <p>{faculty.phone}</p>
                    </div>
                  </div>
                )}
                {faculty.bio && (
                  <div className="mb-3">
                    <strong>Bio:</strong>
                    <p>{faculty.bio}</p>
                  </div>
                )}
                {(faculty.linkedinUrl || faculty.githubUrl) && (
                  <div className="mb-3">
                    <strong>Social Links:</strong>
                    <div className="d-flex gap-2 mt-2">
                      {faculty.linkedinUrl && (
                        <a href={faculty.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-linkedin"></i> LinkedIn
                        </a>
                      )}
                      {faculty.githubUrl && (
                        <a href={faculty.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                          <i className="bi bi-github"></i> GitHub
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

export default FacultyDetail;


