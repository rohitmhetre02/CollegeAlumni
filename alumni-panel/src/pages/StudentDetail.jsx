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
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

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

  const getBackRoute = () => {
    return '/students';
  };

  const getBannerImage = () => {
    // Default banner image - can be replaced with student.bannerImage if available
    return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop';
  };

  const getDisplayRoles = () => {
    const roles = [];
    if (student?.headline) roles.push(student.headline);
    if (student?.currentPosition) roles.push(student.currentPosition);
    if (student?.department) roles.push(student.department);
    if (student?.degree) roles.push(student.degree);
    if (roles.length === 0) roles.push('Student');
    return roles.join(' | ');
  };

  const getStatistics = () => {
    const stats = [];
    if (student?.enrollmentNumber) stats.push(`Enrollment: ${student.enrollmentNumber}`);
    stats.push('Student');
    if (student?.department) stats.push(student.department);
    if (student?.graduationYear) stats.push(`Class of ${student.graduationYear}`);
    return stats.join(' • ');
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  const aboutText = student.bio || '';
  const shouldShowMore = aboutText.length > 200;
  const displayAbout = showFullAbout ? aboutText : truncateText(aboutText);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
        {/* Back Button */}
        <div style={{ padding: '20px 40px 0 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <button 
            onClick={() => navigate(getBackRoute())}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#F9FAFB';
              e.target.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = '#E5E7EB';
            }}
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '16px' }}></i>
            Back to Students
          </button>
        </div>
        
        {/* Banner Section */}
        <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', marginTop: '20px' }}>
          <img
            src={getBannerImage()}
            alt="Banner"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Profile Content Section */}
        <div style={{ backgroundColor: '#ffffff', padding: '0 40px 40px 40px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Profile Picture - Overlapping Banner */}
          <div style={{ position: 'relative', marginTop: '-100px', marginBottom: '24px' }}>
            <img
              src={student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=200&background=0d6efd&color=fff`}
              alt={student.name}
              className="rounded-circle"
              style={{
                width: '180px',
                height: '180px',
                objectFit: 'cover',
                border: '6px solid #ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          {/* Profile Info Section */}
          <div style={{ position: 'relative', paddingTop: '20px' }}>
            {/* Name and Roles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <h1 style={{ 
                  fontWeight: '700', 
                  fontSize: '32px', 
                  marginBottom: '12px',
                  color: '#000000',
                  lineHeight: '1.3'
                }}>
                  {student.name}
                </h1>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#000000', 
                  marginBottom: '10px',
                  fontWeight: '400',
                  lineHeight: '1.5'
                }}>
                  {getDisplayRoles()}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666666', 
                  marginBottom: '20px',
                  fontWeight: '400',
                  lineHeight: '1.4'
                }}>
                  {getStatistics()}
                </p>
              </div>

              {/* Social Media Links */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '8px' }}>
                {student.linkedinUrl && (
                  <a 
                    href={student.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#666666', fontSize: '20px', textDecoration: 'none' }}
                  >
                    <i className="bi bi-linkedin"></i>
                  </a>
                )}
                {student.githubUrl && (
                  <a 
                    href={student.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#666666', fontSize: '20px', textDecoration: 'none' }}
                  >
                    <i className="bi bi-github"></i>
                  </a>
                )}
                {student.facebookUrl && (
                  <a 
                    href={student.facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#666666', fontSize: '20px', textDecoration: 'none' }}
                  >
                    <i className="bi bi-facebook"></i>
                  </a>
                )}
                {student.portfolioUrl && (
                  <a 
                    href={student.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#666666', fontSize: '20px', textDecoration: 'none' }}
                  >
                    <i className="bi bi-globe"></i>
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={() => setIsFollowing(!isFollowing)}
                style={{
                  backgroundColor: isFollowing ? '#ffffff' : '#0d6efd',
                  color: isFollowing ? '#0d6efd' : '#ffffff',
                  border: '1px solid #0d6efd',
                  borderRadius: '20px',
                  padding: '8px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className={`bi ${isFollowing ? 'bi-check' : 'bi-plus-lg'}`}></i>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                className="btn"
                onClick={() => openChatWith(student)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  padding: '8px 24px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="bi bi-send"></i>
                Message
              </button>
              <button
                className="btn"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                <i className="bi bi-three-dots"></i>
              </button>
            </div>

            {/* About Section */}
            {aboutText && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  About
                </h2>
                <p style={{ 
                  lineHeight: '1.7', 
                  color: '#333333', 
                  fontSize: '15px',
                  marginBottom: '10px',
                  maxWidth: '900px'
                }}>
                  {displayAbout}
                </p>
                {shouldShowMore && (
                  <button
                    onClick={() => setShowFullAbout(!showFullAbout)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0d6efd',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '15px',
                      fontWeight: '500',
                      textDecoration: 'none'
                    }}
                  >
                    {showFullAbout ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}

            {/* Additional Information Sections */}
            {/* Education Section */}
            {(student.degree || student.college || student.graduationYear || student.cgpa) && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  Education
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {student.degree && (
                    <div>
                      <strong style={{ color: '#666666', fontSize: '14px' }}>Degree</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.degree}</p>
                    </div>
                  )}
                  {student.college && (
                    <div>
                      <strong style={{ color: '#666666', fontSize: '14px' }}>College/University</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.college}</p>
                    </div>
                  )}
                  {student.graduationYear && (
                    <div>
                      <strong style={{ color: '#666666', fontSize: '14px' }}>Graduation Year</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.graduationYear}</p>
                    </div>
                  )}
                  {student.cgpa && (
                    <div>
                      <strong style={{ color: '#666666', fontSize: '14px' }}>CGPA</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.cgpa}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key Skills Section */}
            {student.skills && student.skills.length > 0 && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  Key Skills
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {student.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#0d6efd',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Section */}
            {(student.languages || student.fluentIn) && (student.languages?.length > 0 || student.fluentIn?.length > 0) && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  Languages
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {(student.languages || student.fluentIn || []).map((lang, idx) => {
                    const language = typeof lang === 'string' ? lang : lang.language;
                    const proficiency = typeof lang === 'object' ? lang.proficiency : '';
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#f8f9fa',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <strong>{language}</strong>
                        {proficiency && <span style={{ color: '#666666', marginLeft: '8px' }}>({proficiency})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {student.experience && student.experience.length > 0 && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  Experience
                </h2>
                {student.experience.map((exp, idx) => {
                  const jobTitle = exp.job_title || exp.title || 'Position';
                  const company = exp.company;
                  const employmentType = exp.employment_type;
                  const location = exp.location;
                  const locationType = exp.location_type;
                  const startDate = exp.start_month && exp.start_year ? `${exp.start_month} ${exp.start_year}` : (exp.start_year || '');
                  const endDate = exp.is_current ? 'Present' : (exp.end_month && exp.end_year ? `${exp.end_month} ${exp.end_year}` : (exp.end_year || ''));
                  const duration = startDate && endDate ? `${startDate} - ${endDate}` : (exp.duration || '');
                  const description = exp.description || '';
                  const skills = exp.skills || [];
                  return (
                    <div
                      key={idx}
                      style={{
                        marginBottom: '32px',
                        paddingBottom: '24px',
                        borderBottom: idx < student.experience.length - 1 ? '1px solid #e9ecef' : 'none'
                      }}
                    >
                      <h3 style={{ fontWeight: '600', color: '#333333', marginBottom: '8px', fontSize: '18px' }}>
                        {jobTitle}
                        {company && <span style={{ color: '#0d6efd', fontWeight: '500', marginLeft: '8px' }}>at {company}</span>}
                      </h3>
                      <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {employmentType && <span style={{ backgroundColor: '#0d6efd', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>{employmentType}</span>}
                        {locationType && <span style={{ backgroundColor: '#6c757d', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>{locationType}</span>}
                        {exp.is_current && <span style={{ backgroundColor: '#28a745', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>Current</span>}
                      </div>
                      {duration && (
                        <p style={{ color: '#666666', marginBottom: '8px', fontSize: '14px' }}>
                          <i className="bi bi-calendar me-1"></i>{duration}
                          {location && <span style={{ marginLeft: '16px' }}><i className="bi bi-geo-alt me-1"></i>{location}</span>}
                        </p>
                      )}
                      {description && (
                        <p style={{ color: '#555555', lineHeight: '1.7', marginBottom: '12px', fontSize: '14px' }}>
                          {description}
                        </p>
                      )}
                      {skills && skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          {skills.map((skill, skillIdx) => (
                            <span key={skillIdx} style={{ backgroundColor: '#0d6efd', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Projects Section */}
            {student.projects && student.projects.length > 0 && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  Projects
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {student.projects.map((project, idx) => {
                    const projectName = project.project_name || project.title || 'Project';
                    const description = project.description || '';
                    const skills = project.skills || project.technologies || [];
                    const startDate = project.start_month && project.start_year ? `${project.start_month} ${project.start_year}` : (project.start_year || '');
                    const endDate = project.is_current ? 'Present' : (project.end_month && project.end_year ? `${project.end_month} ${project.end_year}` : (project.end_year || ''));
                    const duration = startDate && endDate ? `${startDate} - ${endDate}` : '';
                    const contributors = project.contributors || [];
                    const media = project.media || project.url || project.githubUrl || project.projectLink || '';
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#f8f9fa',
                          padding: '20px',
                          borderRadius: '10px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <h3 style={{ fontWeight: '600', color: '#333333', marginBottom: '10px', fontSize: '16px' }}>
                          {projectName}
                          {project.is_current && <span style={{ backgroundColor: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', marginLeft: '8px' }}>Ongoing</span>}
                        </h3>
                        {duration && (
                          <p style={{ color: '#666666', marginBottom: '10px', fontSize: '13px' }}>
                            <i className="bi bi-calendar me-1"></i>{duration}
                          </p>
                        )}
                        {description && (
                          <p style={{ color: '#555555', fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
                            {description}
                          </p>
                        )}
                        {skills && skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {skills.map((tech, techIdx) => (
                              <span
                                key={techIdx}
                                style={{
                                  backgroundColor: '#0d6efd',
                                  color: 'white',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {contributors && contributors.length > 0 && (
                          <p style={{ color: '#666666', fontSize: '13px', marginBottom: '10px' }}>
                            <strong>Team:</strong> {contributors.join(', ')}
                          </p>
                        )}
                        {media && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={media}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                              style={{ fontSize: '12px' }}
                            >
                              <i className="bi bi-link-45deg me-1"></i>View Project
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resume Section */}
            {student.resume && (
              <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e9ecef' }}>
                <h2 style={{ 
                  fontWeight: '700', 
                  fontSize: '20px', 
                  marginBottom: '20px',
                  color: '#000000'
                }}>
                  Resume
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                  <i className="bi bi-file-earmark-pdf" style={{ fontSize: '48px', color: '#dc3545' }}></i>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>Resume Document</h3>
                    <p style={{ color: '#666666', marginBottom: '8px', fontSize: '14px' }}>
                      {typeof student.resume === 'string' ? 'Click to view/download resume' : student.resume.filename || 'Resume.pdf'}
                    </p>
                    <a
                      href={typeof student.resume === 'string' ? student.resume : student.resume.url || student.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '14px' }}
                    >
                      <i className="bi bi-download me-2"></i>Download Resume
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Section */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ 
                fontWeight: '700', 
                fontSize: '20px', 
                marginBottom: '20px',
                color: '#000000'
              }}>
                Contact Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <strong style={{ color: '#666666', fontSize: '14px' }}>Email</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.email}</p>
                </div>
                {student.phone && (
                  <div>
                    <strong style={{ color: '#666666', fontSize: '14px' }}>Phone</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.phone}</p>
                  </div>
                )}
                {student.location && (
                  <div>
                    <strong style={{ color: '#666666', fontSize: '14px' }}>Location</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{student.location}</p>
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
