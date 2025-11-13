import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const extractExperienceValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return '';
    if (value.value !== undefined) return value.value;
    if (value.amount !== undefined) return value.amount;
    if (value.years !== undefined) return value.years;
    if (value.total !== undefined) return value.total;
    return '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)/);
    return match ? match[1] : trimmed;
  }
  return value;
};

const extractExperienceUnit = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.unit || value.units || value.label || 'years';
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered.includes('year')) return 'years';
    return 'years';
  }
  return value === '' ? '' : 'years';
};

const getExperienceDisplay = (primary, list) => {
  const numeric = extractExperienceValue(primary);
  if (numeric !== '' && numeric !== null && numeric !== undefined) {
    const unit = extractExperienceUnit(primary) || 'years';
    return `${numeric} ${unit}`.trim();
  }
  if (Array.isArray(list) && list.length) {
    return `${list.length} recorded engagement${list.length > 1 ? 's' : ''}`;
  }
  return '';
};

const formatFlexibleText = (input) => {
  if (input === null || input === undefined) return '';
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  if (Array.isArray(input)) {
    return input.map(item => formatFlexibleText(item)).filter(Boolean).join(', ');
  }
  if (typeof input === 'object') {
    const numeric = input.value ?? input.amount ?? input.years ?? input.total ?? input.duration ?? undefined;
    const unit = input.unit || input.units || input.label || input.text || '';
    if (numeric !== undefined) {
      const numericText = formatFlexibleText(numeric);
      const unitText = unit ? formatFlexibleText(unit) : '';
      return [numericText, unitText].filter(Boolean).join(' ').trim();
    }
    if (input.description !== undefined) {
      return formatFlexibleText(input.description);
    }
    const flatValues = Object.values(input)
      .map(value => (typeof value === 'object' ? formatFlexibleText(value) : formatFlexibleText(String(value))))
      .filter(Boolean);
    return flatValues.join(' ').trim();
  }
  return '';
};

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

  const experienceDisplay = getExperienceDisplay(faculty.workExperience, faculty.experience);

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
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Role:</strong>
                    <p>{faculty.role ? faculty.role.charAt(0).toUpperCase() + faculty.role.slice(1) : 'Coordinator'}</p>
                  </div>
                  {faculty.staffId && (
                    <div className="col-md-6">
                      <strong>Faculty ID:</strong>
                      <p>{faculty.staffId}</p>
                    </div>
                  )}
                </div>
                {experienceDisplay && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Total Experience:</strong>
                      <p>{experienceDisplay}</p>
                    </div>
                  </div>
                )}
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
                {Array.isArray(faculty.experience) && faculty.experience.length > 0 && (
                  <div className="mb-3">
                    <strong>Experience:</strong>
                    <div className="mt-2">
                      {faculty.experience.map((exp, idx) => {
                        const titleText = formatFlexibleText(exp.title) || 'Role';
                        const companyText = formatFlexibleText(exp.company);
                        const durationText = formatFlexibleText(exp.duration);
                        const descriptionText = formatFlexibleText(exp.description);
                        return (
                          <div key={idx} className="border rounded p-3 mb-2">
                            <div className="fw-semibold">
                              {titleText}
                              {companyText && <span className="text-muted">@ {companyText}</span>}
                            </div>
                            {durationText && <div className="small text-muted mb-1">{durationText}</div>}
                            {descriptionText && <div className="small">{descriptionText}</div>}
                          </div>
                        );
                      })}
                    </div>
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



