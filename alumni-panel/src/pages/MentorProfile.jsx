import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MentorProfile = () => {
  const { mentorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'resource', '1:1_call'
  const [expandedSections, setExpandedSections] = useState({});
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    about: '',
    topics: [],
    skills: [],
    fluentIn: [],
    isAvailable: true
  });
  const [newTopic, setNewTopic] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: '' });
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    type: 'resource',
    fileUrl: '',
    price: 0,
    duration: 30,
    isFree: false,
    isBestSeller: false
  });

  const isOwner = mentorship && (mentorship.mentor?._id === user?.id || mentorship.mentor === user?.id);

  useEffect(() => {
    fetchMentorProfile();
  }, [mentorId]);

  useEffect(() => {
    if (mentorship) {
      setProfileForm({
        about: mentorship.about || '',
        topics: mentorship.topics || [],
        skills: mentorship.skills || [],
        fluentIn: mentorship.fluentIn || [],
        isAvailable: mentorship.isAvailable !== false
      });
    }
  }, [mentorship]);

  const fetchMentorProfile = async () => {
    try {
      console.log('Fetching mentor profile for mentorId:', mentorId);
      const response = await api.get(`/mentorships/mentor/${mentorId}`);
      const mentorshipData = response.data;
      console.log('Mentorship data received:', mentorshipData);
      setMentorship(mentorshipData);
      
      // If owner and no resources, show prompt to add resources
      const isOwner = (mentorshipData.mentor?._id === user?.id || mentorshipData.mentor === user?.id);
      if (isOwner && (!mentorshipData.resources || mentorshipData.resources.length === 0)) {
        // Show resource modal automatically for new mentors
        setTimeout(() => {
          setShowResourceModal(true);
        }, 1000);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentor profile:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 404) {
        alert('Mentor profile not found. The mentor may not have created a mentorship profile yet.');
      }
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddResource = async () => {
    try {
      await api.post(`/mentorships/${mentorship._id}/resources`, resourceForm);
      setShowResourceModal(false);
      setResourceForm({
        title: '',
        description: '',
        type: 'resource',
        fileUrl: '',
        price: 0,
        duration: 30,
        isFree: false,
        isBestSeller: false
      });
      fetchMentorProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add resource');
    }
  };

  const handleUpdateResource = async () => {
    try {
      await api.put(`/mentorships/${mentorship._id}/resources/${editingResource._id}`, resourceForm);
      setShowEditModal(false);
      setEditingResource(null);
      setResourceForm({
        title: '',
        description: '',
        type: 'resource',
        fileUrl: '',
        price: 0,
        duration: 30,
        isFree: false,
        isBestSeller: false
      });
      fetchMentorProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update resource');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await api.delete(`/mentorships/${mentorship._id}/resources/${resourceId}`);
      fetchMentorProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete resource');
    }
  };

  const handleEditProfile = async () => {
    try {
      await api.put(`/mentorships/${mentorship._id}/profile`, profileForm);
      setShowEditProfileModal(false);
      fetchMentorProfile();
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const addTopic = () => {
    if (newTopic.trim() && !profileForm.topics.includes(newTopic.trim())) {
      setProfileForm(f => ({ ...f, topics: [...f.topics, newTopic.trim()] }));
      setNewTopic('');
    }
  };

  const removeTopic = (index) => {
    setProfileForm(f => ({ ...f, topics: f.topics.filter((_, i) => i !== index) }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileForm.skills.includes(newSkill.trim())) {
      setProfileForm(f => ({ ...f, skills: [...f.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setProfileForm(f => ({ ...f, skills: f.skills.filter((_, i) => i !== index) }));
  };

  const addLanguage = () => {
    if (newLanguage.language.trim() && newLanguage.proficiency.trim()) {
      setProfileForm(f => ({ 
        ...f, 
        fluentIn: [...f.fluentIn, { ...newLanguage }] 
      }));
      setNewLanguage({ language: '', proficiency: '' });
    }
  };

  const removeLanguage = (index) => {
    setProfileForm(f => ({ ...f, fluentIn: f.fluentIn.filter((_, i) => i !== index) }));
  };

  const filteredResources = mentorship?.resources?.filter(r => {
    if (activeTab === 'all') return true;
    return r.type === activeTab;
  }) || [];

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

  if (!mentorship) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">Mentor profile not found</div>
        </div>
      </div>
    );
  }

  const mentor = mentorship.mentor;
  const rating = mentorship.rating || 0;
  const totalReviews = mentorship.totalRatings || 0;

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        {/* Header Banner with Stats */}
        <div className="card mb-4" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px'
        }}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h3 className="mb-0">{mentor?.name}</h3>
                <p className="mb-2 opacity-75">{mentor?.headline || `${mentor?.currentPosition} @ ${mentor?.company}`}</p>
              </div>
              <div className="col-md-6 text-end">
                <div className="d-flex justify-content-end gap-4">
                  {mentorship.isTopMentor && (
                    <div className="text-center">
                      <i className="bi bi-trophy-fill" style={{ fontSize: '2rem' }}></i>
                      <div className="small">Top Mentor</div>
                      <div className="fw-bold">{mentorship.menteeEngagements || 0} Engagements</div>
                    </div>
                  )}
                  <div className="text-center">
                    <i className="bi bi-calendar-check" style={{ fontSize: '2rem' }}></i>
                    <div className="small">Average Attendance</div>
                    <div className="fw-bold">{mentorship.averageAttendance || 100}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Sidebar - Profile Card */}
          <div className="col-md-4">
            <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-body text-center">
                {/* Available Badge and Edit Button */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  {mentorship.isAvailable && (
                    <span className="badge bg-success">
                      <i className="bi bi-lightning-charge-fill"></i> Available
                    </span>
                  )}
                  {isOwner && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowEditProfileModal(true)}
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                  )}
                </div>

                {/* Profile Picture */}
                <img 
                  src={mentor?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor?.name || 'Mentor')}&size=200`}
                  alt={mentor?.name}
                  className="rounded-circle mb-3"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />

                {/* Rating */}
                <div className="mb-2">
                  <i className="bi bi-star-fill text-warning"></i>
                  <span className="fw-bold ms-1">{rating.toFixed(1)}</span>
                </div>

                {/* Name */}
                <h5 className="mb-3">{mentor?.name}</h5>

                {/* Professional Details */}
                <div className="text-muted small mb-3">
                  {mentor?.currentPosition && <div><strong>{mentor?.currentPosition}</strong></div>}
                  {mentor?.company && <div>@{mentor?.company}</div>}
                  {mentor?.graduationYear && <div>MBA {mentor?.graduationYear}</div>}
                </div>

                {/* Social Links */}
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {mentor?.linkedinUrl && (
                    <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-linkedin"></i>
                    </a>
                  )}
                  {mentor?.githubUrl && (
                    <a href={mentor.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                      <i className="bi bi-github"></i>
                    </a>
                  )}
                  {mentor?.portfolioUrl && (
                    <a href={mentor.portfolioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm">
                      <i className="bi bi-globe"></i>
                    </a>
                  )}
                </div>

                {/* Expandable Sections */}
                {mentorship.about && (
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 w-100 text-start"
                      onClick={() => toggleSection('about')}
                    >
                      <strong>About</strong>
                      <i className={`bi bi-chevron-${expandedSections.about ? 'up' : 'down'} float-end`}></i>
                    </button>
                    {expandedSections.about && (
                      <p className="text-muted small mt-2">{mentorship.about}</p>
                    )}
                  </div>
                )}

                {mentorship.topics && mentorship.topics.length > 0 && (
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 w-100 text-start"
                      onClick={() => toggleSection('topics')}
                    >
                      <strong>Topics</strong>
                      <i className={`bi bi-chevron-${expandedSections.topics ? 'up' : 'down'} float-end`}></i>
                    </button>
                    {expandedSections.topics && (
                      <div className="mt-2">
                        {mentorship.topics.map((topic, idx) => (
                          <span key={idx} className="badge bg-secondary me-1 mb-1">{topic}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {mentorship.skills && mentorship.skills.length > 0 && (
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 w-100 text-start"
                      onClick={() => toggleSection('skills')}
                    >
                      <strong>Skills</strong>
                      <i className={`bi bi-chevron-${expandedSections.skills ? 'up' : 'down'} float-end`}></i>
                    </button>
                    {expandedSections.skills && (
                      <div className="mt-2">
                        {mentorship.skills.map((skill, idx) => (
                          <span key={idx} className="badge bg-primary me-1 mb-1">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {mentorship.fluentIn && mentorship.fluentIn.length > 0 && (
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 w-100 text-start"
                      onClick={() => toggleSection('languages')}
                    >
                      <strong>Fluent in</strong>
                      <i className={`bi bi-chevron-${expandedSections.languages ? 'up' : 'down'} float-end`}></i>
                    </button>
                    {expandedSections.languages && (
                      <div className="mt-2">
                        {mentorship.fluentIn.map((lang, idx) => (
                          <div key={idx} className="small">
                            {lang.language} - {lang.proficiency}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {mentor?.graduationYear && (
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 w-100 text-start"
                      onClick={() => toggleSection('education')}
                    >
                      <strong>Education</strong>
                      <i className={`bi bi-chevron-${expandedSections.education ? 'up' : 'down'} float-end`}></i>
                    </button>
                    {expandedSections.education && (
                      <div className="mt-2 small text-muted">
                        {mentor.degree && <div>{mentor.degree}</div>}
                        {mentor.graduationYear && <div>Graduated: {mentor.graduationYear}</div>}
                      </div>
                    )}
                  </div>
                )}

                {mentor?.experience && mentor.experience.length > 0 && (
                  <div className="mb-3">
                    <button
                      className="btn btn-link text-decoration-none p-0 w-100 text-start"
                      onClick={() => toggleSection('experience')}
                    >
                      <strong>Work Experience</strong>
                      <i className={`bi bi-chevron-${expandedSections.experience ? 'up' : 'down'} float-end`}></i>
                    </button>
                    {expandedSections.experience && (
                      <div className="mt-2">
                        {mentor.experience.map((exp, idx) => (
                          <div key={idx} className="small mb-2">
                            <strong>{exp.title}</strong> @ {exp.company}
                            {exp.duration && <div className="text-muted">{exp.duration}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-8">
            {/* Owner Management Banner */}
            {isOwner && (
              <div className="alert alert-info mb-4" style={{ borderRadius: '12px', border: '2px solid #007bff' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      <i className="bi bi-gear-fill"></i> Manage Your Mentor Profile
                    </h5>
                    <p className="mb-0">Edit your profile, add resources and services, and manage your mentorship offerings.</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowEditProfileModal(true)}
                  >
                    <i className="bi bi-pencil-square"></i> Edit Profile
                  </button>
                </div>
              </div>
            )}

            {/* Available Services Section */}
            <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h4 className="mb-1">Available Services</h4>
                    <p className="text-muted small mb-0">Discover our mentorship offerings designed for your success.</p>
                  </div>
                  {isOwner && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingResource(null);
                        setResourceForm({
                          title: '',
                          description: '',
                          type: 'resource',
                          fileUrl: '',
                          price: 0,
                          duration: 30,
                          isFree: false,
                          isBestSeller: false
                        });
                        setShowResourceModal(true);
                      }}
                    >
                      <i className="bi bi-plus-circle"></i> Add Resource/Service
                    </button>
                  )}
                </div>
                
                {/* Tabs */}
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveTab('all')}
                    >
                      All
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === '1:1_call' ? 'active' : ''}`}
                      onClick={() => setActiveTab('1:1_call')}
                    >
                      1:1 Call
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'resource' ? 'active' : ''}`}
                      onClick={() => setActiveTab('resource')}
                    >
                      Resources
                    </button>
                  </li>
                </ul>

                {/* Resources Grid */}
                <div className="row g-3">
                  {filteredResources.map((resource, idx) => (
                    <div className="col-md-6" key={idx}>
                      <div className="card h-100" style={{ borderRadius: '8px' }}>
                        <div className="card-body">
                          {resource.isBestSeller && (
                            <span className="badge bg-warning mb-2">Best Seller</span>
                          )}
                          <h6 className="card-title">{resource.title}</h6>
                          {resource.description && (
                            <p className="text-muted small">{resource.description}</p>
                          )}
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {resource.type === '1:1_call' && (
                                <span className="text-muted small">{resource.duration} Min</span>
                              )}
                              {resource.isFree ? (
                                <span className="badge bg-success">Free</span>
                              ) : (
                                <span className="fw-bold">₹{resource.price}</span>
                              )}
                            </div>
                            {isOwner && (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => {
                                    setEditingResource(resource);
                                    setResourceForm({
                                      title: resource.title,
                                      description: resource.description || '',
                                      type: resource.type,
                                      fileUrl: resource.fileUrl || '',
                                      price: resource.price || 0,
                                      duration: resource.duration || 30,
                                      isFree: resource.isFree || false,
                                      isBestSeller: resource.isBestSeller || false
                                    });
                                    setShowEditModal(true);
                                  }}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteResource(resource._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          {!isOwner && (
                            <button className="btn btn-primary btn-sm w-100 mt-2">
                              {resource.isFree ? 'Download Free' : resource.type === '1:1_call' ? 'Book Now' : 'Purchase'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredResources.length === 0 && (
                  <div className="text-center text-muted py-4">
                    {isOwner ? (
                      <div>
                        <i className="bi bi-inbox" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                        <p className="mt-3">No resources or services available yet.</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setEditingResource(null);
                            setResourceForm({
                              title: '',
                              description: '',
                              type: 'resource',
                              fileUrl: '',
                              price: 0,
                              duration: 30,
                              isFree: false,
                              isBestSeller: false
                            });
                            setShowResourceModal(true);
                          }}
                        >
                          <i className="bi bi-plus-circle"></i> Add Your First Resource/Service
                        </button>
                      </div>
                    ) : (
                      'No resources available'
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <h4 className="mb-3">Reviews</h4>
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="display-4 fw-bold">{rating.toFixed(1)}</div>
                    <div>
                      <div className="mb-1">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`bi bi-star${i < Math.floor(rating) ? '-fill' : ''} text-warning`}
                          ></i>
                        ))}
                      </div>
                      <div className="text-muted">Average Rating ({totalReviews} Reviews)</div>
                    </div>
                  </div>
                </div>

                <div className="reviews-list">
                  {mentorship.reviews && mentorship.reviews.length > 0 ? (
                    mentorship.reviews.map((review, idx) => (
                      <div key={idx} className="border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{review.student?.name || 'Anonymous'}</strong>
                            <div className="text-muted small">{new Date(review.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="fw-bold">{review.rating}.0</span>
                            <i className="bi bi-star-fill text-warning ms-1"></i>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mb-0">{review.comment}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-4">No reviews yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Resource Modal */}
        {showResourceModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Resource</h5>
                  <button type="button" className="btn-close" onClick={() => setShowResourceModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-control"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-control"
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                    >
                      <option value="resource">Resource</option>
                      <option value="1:1_call">1:1 Call</option>
                    </select>
                  </div>
                  {resourceForm.type === '1:1_call' && (
                    <div className="mb-3">
                      <label className="form-label">Duration (minutes)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={resourceForm.duration}
                        onChange={(e) => setResourceForm({ ...resourceForm, duration: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">File URL</label>
                    <input
                      className="form-control"
                      value={resourceForm.fileUrl}
                      onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={resourceForm.price}
                      onChange={(e) => setResourceForm({ ...resourceForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={resourceForm.isFree}
                        onChange={(e) => setResourceForm({ ...resourceForm, isFree: e.target.checked })}
                      />
                      <label className="form-check-label">Free Resource</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={resourceForm.isBestSeller}
                        onChange={(e) => setResourceForm({ ...resourceForm, isBestSeller: e.target.checked })}
                      />
                      <label className="form-check-label">Best Seller</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowResourceModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddResource}
                    disabled={!resourceForm.title}
                  >
                    Add Resource
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Resource Modal */}
        {showEditModal && editingResource && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Resource</h5>
                  <button type="button" className="btn-close" onClick={() => {
                    setShowEditModal(false);
                    setEditingResource(null);
                  }}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-control"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-control"
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                    >
                      <option value="resource">Resource</option>
                      <option value="1:1_call">1:1 Call</option>
                    </select>
                  </div>
                  {resourceForm.type === '1:1_call' && (
                    <div className="mb-3">
                      <label className="form-label">Duration (minutes)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={resourceForm.duration}
                        onChange={(e) => setResourceForm({ ...resourceForm, duration: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">File URL</label>
                    <input
                      className="form-control"
                      value={resourceForm.fileUrl}
                      onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={resourceForm.price}
                      onChange={(e) => setResourceForm({ ...resourceForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={resourceForm.isFree}
                        onChange={(e) => setResourceForm({ ...resourceForm, isFree: e.target.checked })}
                      />
                      <label className="form-check-label">Free Resource</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={resourceForm.isBestSeller}
                        onChange={(e) => setResourceForm({ ...resourceForm, isBestSeller: e.target.checked })}
                      />
                      <label className="form-check-label">Best Seller</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowEditModal(false);
                    setEditingResource(null);
                  }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpdateResource}
                    disabled={!resourceForm.title}
                  >
                    Update Resource
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Mentor Profile</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditProfileModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">About</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={profileForm.about}
                      onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                      placeholder="Tell mentees about yourself, your expertise, and how you can help..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Topics</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                        placeholder="Add topic"
                      />
                      <button className="btn btn-outline-primary" onClick={addTopic}>
                        Add
                      </button>
                    </div>
                    {profileForm.topics.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {profileForm.topics.map((topic, idx) => (
                          <span key={idx} className="badge bg-secondary">
                            {topic}
                            <button
                              className="btn btn-sm p-0 ms-2 text-white"
                              style={{ border: 'none', background: 'transparent' }}
                              onClick={() => removeTopic(idx)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Skills</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="Add skill"
                      />
                      <button className="btn btn-outline-primary" onClick={addSkill}>
                        Add
                      </button>
                    </div>
                    {profileForm.skills.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {profileForm.skills.map((skill, idx) => (
                          <span key={idx} className="badge bg-primary">
                            {skill}
                            <button
                              className="btn btn-sm p-0 ms-2 text-white"
                              style={{ border: 'none', background: 'transparent' }}
                              onClick={() => removeSkill(idx)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Languages</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        value={newLanguage.language}
                        onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                        placeholder="Language"
                      />
                      <select
                        className="form-control"
                        value={newLanguage.proficiency}
                        onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
                      >
                        <option value="">Proficiency</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Native">Native</option>
                      </select>
                      <button className="btn btn-outline-primary" onClick={addLanguage}>
                        Add
                      </button>
                    </div>
                    {profileForm.fluentIn.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {profileForm.fluentIn.map((lang, idx) => (
                          <span key={idx} className="badge bg-info">
                            {lang.language} - {lang.proficiency}
                            <button
                              className="btn btn-sm p-0 ms-2 text-white"
                              style={{ border: 'none', background: 'transparent' }}
                              onClick={() => removeLanguage(idx)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={profileForm.isAvailable}
                        onChange={(e) => setProfileForm({ ...profileForm, isAvailable: e.target.checked })}
                      />
                      <label className="form-check-label">Available for Mentorship</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleEditProfile}>
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorProfile;
