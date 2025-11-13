import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AlumniDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openChatWith } = useChat();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'alumni' } });
      setAlumni(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      setAlumni([]);
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter(alumnus => {
    const matchesSearch = alumnus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumnus.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || alumnus.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const uniqueDepartments = [...new Set(alumni.map(a => a.department))];

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <h2 className="mb-4">
          <i className="bi bi-people-fill"></i> Alumni Directory
        </h2>

        {/* Search and Filter */}
        <div className="row mb-4">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alumni Cards */}
        <div className="row g-4">
          {filteredAlumni.map(alumnus => {
            // Calculate match percentage (placeholder - can be customized)
            
            // Get displayed skills (max 4 shown, then "+X more")
            const skills = alumnus.skills || [];
            const displayedSkills = skills.slice(0, 4);
            const remainingSkills = skills.length - displayedSkills.length;
            
            
            // Get department for domain tag
            const domain = alumnus.department || alumnus.industry || 'General';
            
            return (
              <div className="col-md-4" key={alumnus._id}>
                <div 
                  className="card h-100" 
                  style={{ 
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                  }}
                  onClick={() => navigate(`/alumnus/${alumnus._id}`)}
                >
                  <div className="card-body p-4" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%' 
                  }}>

                    {/* Header with Profile Picture and Name/Title */}
                    <div className="d-flex align-items-start mb-3">
                      {/* Profile Picture */}
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          marginRight: '12px',
                          flexShrink: 0,
                          border: '3px solid #f0f0f0',
                        }}
                      >
                        <img
                          src={alumnus.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.name)}&size=200&background=0d6efd&color=fff`}
                          alt={alumnus.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.name)}&size=200&background=0d6efd&color=fff`;
                          }}
                        />
                      </div>
                      
                      {/* Name and Job Title */}
                      <div className="flex-grow-1">
                        <h5 
                          className="mb-1" 
                          style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#1a1a1a',
                            margin: 0,
                            lineHeight: '1.3',
                          }}
                        >
                          {alumnus.name}
                        </h5>
                        {alumnus.currentPosition && (
                          <p 
                            className="mb-1" 
                            style={{ 
                              fontSize: '14px', 
                              color: '#666',
                              margin: 0,
                              fontWeight: '500',
                            }}
                          >
                            {alumnus.currentPosition}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {alumnus.location && (
                      <div className="mb-3" style={{ fontSize: '13px', color: '#666' }}>
                        <i className="bi bi-geo-alt-fill" style={{ marginRight: '6px', color: '#0d6efd' }}></i>
                        <span style={{ fontWeight: '500' }}>{alumnus.location}</span>
                      </div>
                    )}

                    {/* Company and Passout Year */}
                    <div className="mb-3">
                      {alumnus.company && (
                        <div className="mb-2" style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>
                          <i className="bi bi-building-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                          <span>{alumnus.company}</span>
                        </div>
                      )}
                      {alumnus.graduationYear && (
                        <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
                          <i className="bi bi-mortarboard-fill" style={{ marginRight: '6px', color: '#0d6efd' }}></i>
                          <span>Passed Out: {alumnus.graduationYear}</span>
                        </div>
                      )}
                    </div>

                    {/* Bio Section - 2 lines max */}
                    {(alumnus.bio || alumnus.headline) && (
                      <div className="mb-3" style={{ 
                        fontSize: '13px', 
                        color: '#555',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '39px',
                        maxHeight: '39px',
                      }}>
                        {alumnus.bio || alumnus.headline}
                      </div>
                    )}

                    {/* Industry/Domain Tag */}
                    <div className="mb-3">
                      <span
                        style={{
                          backgroundColor: '#e7f3ff',
                          color: '#0d6efd',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #b3d9ff',
                        }}
                      >
                        <i className="bi bi-tag-fill" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                        {domain}
                      </span>
                    </div>

                    {/* Skills Section */}
                    {skills.length > 0 && (
                      <div className="mb-3">
                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '10px' }}>
                          Skills
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
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
                                border: '1px solid #dee2e6',
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
                                border: '1px solid #dee2e6',
                              }}
                            >
                              +{remainingSkills} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Profile Button - Fixed at bottom */}
                    <button
                      className="btn w-100 mt-auto"
                      style={{
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontWeight: '600',
                        fontSize: '14px',
                        marginTop: 'auto',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/alumnus/${alumnus._id}`);
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
            );
          })}
        </div>

        {filteredAlumni.length === 0 && (
          <div className="alert alert-info">
            No alumni found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectory;

