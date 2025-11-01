import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatWith } = useChat();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setStudent(response.data);
    } catch (error) {
      console.error('Error fetching student:', error);
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

  if (!student || student.role !== 'student') {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">Student not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/students')}>
          <i className="bi bi-arrow-left"></i> Back to Student Directory
        </button>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-4 text-center mb-4">
                <img
                  src={student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=200`}
                  alt={student.name}
                  className="rounded-circle mb-3"
                  style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                />
                <h3>{student.name}</h3>
                <p className="text-muted">{student.enrollmentNumber || 'No Enrollment Number'}</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => openChatWith(student._id)}
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
                    <p>{student.email}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Department:</strong>
                    <p>{student.department}</p>
                  </div>
                </div>
                {student.phone && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Phone:</strong>
                      <p>{student.phone}</p>
                    </div>
                  </div>
                )}
                {student.graduationYear && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Graduation Year:</strong>
                      <p>{student.graduationYear}</p>
                    </div>
                  </div>
                )}
                {student.bio && (
                  <div className="mb-3">
                    <strong>Bio:</strong>
                    <p>{student.bio}</p>
                  </div>
                )}
                {student.skills && student.skills.length > 0 && (
                  <div className="mb-3">
                    <strong>Skills:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {student.skills.map((skill, idx) => (
                        <span key={idx} className="badge bg-primary">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(student.linkedinUrl || student.githubUrl || student.portfolioUrl) && (
                  <div className="mb-3">
                    <strong>Social Links:</strong>
                    <div className="d-flex gap-2 mt-2">
                      {student.linkedinUrl && (
                        <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-linkedin"></i> LinkedIn
                        </a>
                      )}
                      {student.githubUrl && (
                        <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                          <i className="bi bi-github"></i> GitHub
                        </a>
                      )}
                      {student.portfolioUrl && (
                        <a href={student.portfolioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm">
                          <i className="bi bi-globe"></i> Portfolio
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

export default StudentDetail;


