import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import { useChat } from '../context/ChatContext';

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
    return value.unit || value.units || value.label || 'yrs';
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered.includes('year')) return 'years';
    return 'yrs';
  }
  return value === '' ? '' : 'yrs';
};

const getExperienceDisplay = (primary, list) => {
  const numeric = extractExperienceValue(primary);
  if (numeric !== '' && numeric !== null && numeric !== undefined) {
    const unit = extractExperienceUnit(primary) || 'yrs';
    return `${numeric} ${unit}`.trim();
  }
  if (Array.isArray(list) && list.length) {
    return `${list.length} record${list.length > 1 ? 's' : ''}`;
  }
  return '';
};

const FacultyWithSidebar = () => {
  const navigate = useNavigate();
  const { openChatWith } = useChat();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const facultyRes = await api.get('/users', { params: { role: 'coordinator' } });

      const facultyData = (facultyRes.data || []).map(f => ({
        ...f,
        profileImage: f.profilePicture || f.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1976D2&color=fff&size=200`
      }));
      
      setFaculty(facultyData);
    } catch (e) {
      console.error(e);
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (facultyId) => {
    navigate(`/faculty/${facultyId}`);
  };

  // Helper function to get department badge color
  const getDepartmentBadgeColor = (department) => {
    const colors = {
      'Computer Science': '#0d6efd',
      'Information Technology': '#0dcaf0',
      'Electronics Engineering': '#ffc107',
      'Mechanical Engineering': '#198754',
      'Civil Engineering': '#dc3545',
    };
    return colors[department] || '#6c757d';
  };


  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
        <h2 className="mb-4">
          <i className="bi bi-mortarboard"></i> Faculty & Coordinators
        </h2>
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {faculty.map(f => {
              const experienceLabel = getExperienceDisplay(f.workExperience, f.experience);
              const deptColor = getDepartmentBadgeColor(f.department);
              
              // Get skills/expertise
              const skills = f.skills || [];
              const displayedSkills = skills.slice(0, 4);
              const remainingSkills = skills.length - displayedSkills.length;
              

              return (
                <div className="col-md-4" key={f._id}>
                  <div 
                    className="card h-100" 
                    style={{ 
                      cursor: 'pointer',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => handleViewProfile(f._id)}
                  >
                    <div className="card-body p-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      {/* Profile Picture */}
                      <div
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          marginBottom: '16px',
                          border: '4px solid #f0f0f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        <img
                          src={f.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&size=200&background=0d6efd&color=fff`}
                          alt={f.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&size=200&background=0d6efd&color=fff`;
                          }}
                        />
                      </div>
                      
                      {/* Name */}
                      <h5 
                        className="mb-2" 
                        style={{ 
                          fontSize: '20px', 
                          fontWeight: '700', 
                          color: '#333',
                          margin: 0,
                        }}
                      >
                        {f.name}
                      </h5>
                      
                      {/* Designation */}
                      <p 
                        className="mb-3" 
                        style={{ 
                          fontSize: '15px', 
                          color: '#666',
                          margin: 0,
                          fontWeight: '500',
                        }}
                      >
                        {f.designation || f.title || 'Coordinator'}
                      </p>

                      {/* Department Tag */}
                      <div className="mb-3">
                        <span
                          style={{
                            backgroundColor: deptColor,
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          {f.department}
                        </span>
                      </div>

                      {/* Experience */}
                      {experienceLabel && (
                        <div className="mb-2" style={{ fontSize: '13px', color: '#666' }}>
                          <i className="bi bi-briefcase-fill" style={{ marginRight: '6px', color: '#333' }}></i>
                          <strong style={{ color: '#333' }}>Experience:</strong> {experienceLabel} Teaching Experience
                        </div>
                      )}


                      {/* Contact Details */}
                      <div className="mb-3" style={{ fontSize: '14px', color: '#555', width: '100%' }}>
                        <div className="mb-2">
                          <i className="bi bi-envelope-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                          <span style={{ wordBreak: 'break-word' }}>{f.email}</span>
                        </div>
                        {f.phone && (
                          <div>
                            <i className="bi bi-telephone-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                            <span>{f.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills/Expertise Section */}
                      {skills.length > 0 && (
                        <div className="mb-3" style={{ width: '100%' }}>
                          <h6 style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                            Skills/Expertise
                          </h6>
                          <div className="d-flex flex-wrap gap-2 justify-content-center">
                            {displayedSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: '#e9ecef',
                                  color: '#495057',
                                  padding: '5px 12px',
                                  borderRadius: '18px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                            {remainingSkills > 0 && (
                              <span
                                style={{
                                  backgroundColor: '#e9ecef',
                                  color: '#495057',
                                  padding: '5px 12px',
                                  borderRadius: '18px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                }}
                              >
                                +{remainingSkills} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}


                      {/* Action Buttons */}
                      <div className="d-flex gap-2 mt-auto" style={{ width: '100%', marginTop: '20px' }}>
                        <button
                          className="btn flex-grow-1"
                          style={{
                            backgroundColor: 'white',
                            color: '#0d6efd',
                            border: '2px solid #0d6efd',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openChatWith(f);
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f0f7ff';
                            e.target.style.borderColor = '#0b5ed7';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#0d6efd';
                          }}
                        >
                          <i className="bi bi-envelope" style={{ marginRight: '6px' }}></i>
                          Message
                        </button>
                        <button
                          className="btn flex-grow-1"
                          style={{
                            backgroundColor: '#0d6efd',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(f._id);
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0b5ed7';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(13,110,253,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#0d6efd';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <i className="bi bi-eye" style={{ marginRight: '6px' }}></i>
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {faculty.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle"></i> No faculty found.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyWithSidebar;


