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
  const [requestingMentorship, setRequestingMentorship] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
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
  const [viewMode, setViewMode] = useState('public'); // 'public' or 'edit'

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

  // Check if user has already requested mentorship
  useEffect(() => {
    if (mentorship && user && mentorship.mentor) {
      const mentorId = mentorship.mentor._id || mentorship.mentor;
      const userId = user.id || user._id;
      const currentUserIsOwner = mentorId?.toString() === userId?.toString();
      
      if (!currentUserIsOwner && mentorship.mentees && user) {
        const requested = mentorship.mentees.some(
          mentee => {
            const studentId = mentee.student?._id || mentee.student;
            return studentId?.toString() === userId?.toString();
          }
        );
        setHasRequested(requested);
      } else {
        setHasRequested(false);
      }
    } else {
      setHasRequested(false);
    }
  }, [mentorship, user]);

  const fetchMentorProfile = async () => {
    try {
      if (!mentorId) {
        console.error('Mentor ID is missing');
        alert('Invalid mentor ID. Please try again.');
        setLoading(false);
        navigate('/mentorships');
        return;
      }
      
      console.log('Fetching mentor profile for ID:', mentorId);
      const response = await api.get(`/mentorships/mentor/${mentorId}`);
      const mentorshipData = response.data;
      
      if (!mentorshipData) {
        throw new Error('No mentorship data received');
      }
      
      console.log('Mentor profile data received:', mentorshipData);
      setMentorship(mentorshipData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentor profile:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        mentorId: mentorId
      });
      
      if (error.response?.status === 404) {
        alert('Mentor profile not found. The mentor may not have created a mentorship profile yet.');
      } else if (error.response?.status === 400) {
        alert('Invalid mentor ID format. Please try again.');
      } else {
        alert('Failed to load mentor profile. Please try again later.');
      }
      
      setLoading(false);
      // Navigate back to mentorships page after a delay
      setTimeout(() => {
        navigate('/mentorships');
      }, 2000);
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
  
  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (!mentorship.reviews || mentorship.reviews.length === 0) {
      return 0;
    }
    const sum = mentorship.reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return sum / mentorship.reviews.length;
  };
  
  const rating = calculateAverageRating();
  const totalReviews = mentorship.reviews?.length || 0;
  const menteeEngagements = mentorship.menteeEngagements || mentorship.mentees?.length || 0;
  const averageAttendance = mentorship.averageAttendance || 100;

  // Check if user can write a review 
  // ALL authenticated users (admin, coordinator, student, alumni) can write reviews
  // Exception: Mentor cannot review themselves, and users who already reviewed cannot review again
  const canWriteReview = () => {
    if (!user) return false;
    if (isOwner) return false; // Mentor cannot review themselves
    
    // Check if already reviewed - any role (admin, coordinator, student, alumni) can review
    const alreadyReviewed = mentorship.reviews?.some(
      review => {
        const studentId = review.student?._id || review.student;
        const userId = user.id || user._id;
        return studentId?.toString() === userId?.toString();
      }
    );
    
    // All authenticated users (all roles) can review if they haven't already
    return !alreadyReviewed;
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please log in to write a review.');
      return;
    }

    if (isOwner) {
      alert('You cannot review your own mentorship profile.');
      return;
    }

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      alert('Please select a rating from 1 to 5 stars.');
      return;
    }

    // Comment is optional but if provided, should be at least 10 characters
    if (reviewForm.comment && reviewForm.comment.trim().length > 0 && reviewForm.comment.trim().length < 10) {
      alert('Review comment must be at least 10 characters if provided.');
      return;
    }

    setSubmittingReview(true);
    try {
      console.log('Submitting review:', {
        mentorshipId: mentorship._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userId: user?.id || user?._id
      });

      const response = await api.post(`/mentorships/${mentorship._id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || ''
      });
      
      console.log('Review submission response:', response.data);
      
      // Update mentorship state immediately with the new review data from response
      if (response.data) {
        setMentorship(response.data);
        console.log('Review added, updated mentorship:', response.data);
      }
      
      setShowReviewModal(false);
      setReviewForm({ rating: 0, comment: '' });
      
      // Show success message
      alert('Review submitted successfully! Your review is now visible.');
      
      // Refresh to ensure we have the latest data with all populated fields
      await fetchMentorProfile();
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message
      });
      
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
        // Optionally redirect to login
      } else if (error.response?.status === 403) {
        alert(error.response.data?.message || 'Access denied. You cannot review this mentor.');
      } else if (error.response?.status === 400) {
        alert(error.response.data?.message || 'You have already reviewed this mentor or invalid data provided.');
      } else if (error.response?.status === 404) {
        alert('Mentorship not found. Please refresh the page and try again.');
      } else {
        alert(error.response?.data?.message || error.message || 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRequestMentorship = async () => {
    if (!user || user.role !== 'student') {
      alert('Only students can request mentorship.');
      return;
    }

    if (hasRequested) {
      alert('You have already requested mentorship with this mentor.');
      return;
    }

    if (mentorship.status === 'full') {
      alert('This mentorship program is full.');
      return;
    }

    setRequestingMentorship(true);
    try {
      await api.post(`/mentorships/${mentorship._id}/request`);
      setHasRequested(true);
      alert('Mentorship request submitted successfully! The mentor will review your request.');
      fetchMentorProfile(); // Refresh to get updated data
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'You have already requested this mentorship.');
        setHasRequested(true);
      } else {
        alert(error.response?.data?.message || 'Failed to submit mentorship request. Please try again.');
      }
    } finally {
      setRequestingMentorship(false);
    }
  };

  // Format achievements/headline info - match image style
  const achievements = [];
  if (mentor?.currentPosition && mentor?.company) {
    achievements.push(`${mentor.currentPosition} @${mentor.company}`);
  }
  if (mentor?.degree && mentor?.college && mentor?.graduationYear) {
    achievements.push(`${mentor.degree} ${mentor.college} ${mentor.graduationYear}`);
  } else if (mentor?.degree && mentor?.graduationYear) {
    achievements.push(`${mentor.degree} ${mentor.graduationYear}`);
  }
  if (mentor?.headline) {
    achievements.push(...mentor.headline.split(' | ').filter(Boolean));
  }
  // Add additional achievements from mentor profile if available
  if (mentorship.isTopMentor) {
    achievements.push(`Rank ${mentorship.rank || '8th'} Unstoppable Mentor`);
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1" style={{ background: '#f0f4f8', minHeight: '100vh' }}>
        <div className="container-fluid px-4 py-4">
        {/* Statistics Cards - Match image layout */}
        <div className="row g-3 mb-4">
          {mentorship.isTopMentor && (
            <div className="col-md-4">
              <div className="card border-0 text-white text-center p-4" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <i className="bi bi-trophy-fill" style={{ fontSize: '2.5rem', color: '#FFD700', marginBottom: '12px' }}></i>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Top Mentor</div>
              </div>
            </div>
          )}
          <div className={`col-md-${mentorship.isTopMentor ? '4' : '6'}`}>
            <div className="card border-0 text-white text-center p-4" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <i className="bi bi-calendar-check-fill" style={{ fontSize: '2.5rem', marginBottom: '12px' }}></i>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{menteeEngagements.toLocaleString()} Mentee Engagements</div>
            </div>
          </div>
          <div className={`col-md-${mentorship.isTopMentor ? '4' : '6'}`}>
            <div className="card border-0 text-white text-center p-4" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minHeight: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem', color: '#28a745', marginBottom: '12px' }}></i>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{averageAttendance}% Average Attendance</div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Sidebar - Profile Card */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm border-0" style={{ borderRadius: '16px', position: 'sticky', top: '20px' }}>
              <div className="card-body p-4">
                {/* Profile Picture with Available Badge */}
                <div className="text-center mb-3" style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={mentor?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor?.name || 'Mentor')}&size=200&background=667eea&color=fff`}
                    alt={mentor?.name}
                    className="rounded-circle"
                    style={{ width: '120px', height: '120px', objectFit: 'cover', border: '4px solid #f0f0f0' }}
                  />
                  {mentorship.isAvailable && (
                    <span 
                      className="badge bg-success" 
                      style={{ 
                        position: 'absolute',
                        bottom: '0',
                        right: 'calc(50% - 60px + 10px)',
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        border: '2px solid white'
                      }}
                    >
                      Available
                    </span>
                  )}
                </div>

                {/* Name and Rating */}
                <div className="text-center mb-3">
                  <h5 className="mb-2" style={{ fontWeight: '700', fontSize: '1.3rem', color: '#333' }}>{mentor?.name}</h5>
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#333' }}>{rating.toFixed(1)}</span>
                    <div>
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`bi bi-star${i < Math.floor(rating) ? '-fill' : ''} text-warning`}
                          style={{ fontSize: '1rem' }}
                        ></i>
                      ))}
                    </div>
                  </div>
                </div>

                  {/* Professional Summary/Achievements */}
                  {achievements.length > 0 && (
                    <div className="mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.8', textAlign: 'left' }}>
                      {achievements.map((achievement, idx) => (
                        <div key={idx} className="text-muted mb-1" style={{ marginBottom: '6px', color: '#666' }}>
                          {achievement}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="d-flex justify-content-center gap-2 mb-4">
                    {mentor?.linkedinUrl && (
                      <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                         className="btn btn-outline-primary btn-sm" style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <i className="bi bi-linkedin"></i>
                      </a>
                    )}
                    {mentor?.instagramUrl && (
                      <a href={mentor.instagramUrl} target="_blank" rel="noopener noreferrer" 
                         className="btn btn-outline-danger btn-sm" style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <i className="bi bi-instagram"></i>
                      </a>
                    )}
                    <button className="btn btn-outline-secondary btn-sm" style={{ borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <i className="bi bi-share-fill"></i>
                    </button>
                  </div>

                  {/* Expandable Sections */}
                  <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
                    {/* About */}
                    {mentorship.about && (
                      <div className="mb-3">
                        <button
                          className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center"
                          onClick={() => toggleSection('about')}
                          style={{ color: '#333', fontWeight: '500' }}
                        >
                          <span>About</span>
                          <i className={`bi bi-chevron-${expandedSections.about ? 'up' : 'down'}`}></i>
                        </button>
                        {expandedSections.about && (
                          <p className="text-muted small mt-2" style={{ lineHeight: '1.6' }}>{mentorship.about}</p>
                        )}
                      </div>
                    )}

                    {/* Topics */}
                    {mentorship.topics && mentorship.topics.length > 0 && (
                      <div className="mb-3">
                        <button
                          className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center"
                          onClick={() => toggleSection('topics')}
                          style={{ color: '#333', fontWeight: '500' }}
                        >
                          <span>Topics</span>
                          <i className={`bi bi-chevron-${expandedSections.topics ? 'up' : 'down'}`}></i>
                        </button>
                        {expandedSections.topics && (
                          <div className="mt-2">
                            {mentorship.topics.map((topic, idx) => (
                              <span key={idx} className="badge bg-secondary me-1 mb-1" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>{topic}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skills */}
                    {mentorship.skills && mentorship.skills.length > 0 && (
                      <div className="mb-3">
                        <button
                          className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center"
                          onClick={() => toggleSection('skills')}
                          style={{ color: '#333', fontWeight: '500' }}
                        >
                          <span>Skills</span>
                          <i className={`bi bi-chevron-${expandedSections.skills ? 'up' : 'down'}`}></i>
                        </button>
                        {expandedSections.skills && (
                          <div className="mt-2">
                            {mentorship.skills.map((skill, idx) => (
                              <span key={idx} className="badge bg-primary me-1 mb-1" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fluent In */}
                    {mentorship.fluentIn && mentorship.fluentIn.length > 0 && (
                      <div className="mb-3">
                        <button
                          className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center"
                          onClick={() => toggleSection('languages')}
                          style={{ color: '#333', fontWeight: '500' }}
                        >
                          <span>Fluent in</span>
                          <i className={`bi bi-chevron-${expandedSections.languages ? 'up' : 'down'}`}></i>
                        </button>
                        {expandedSections.languages && (
                          <div className="mt-2">
                            {mentorship.fluentIn.map((lang, idx) => (
                              <div key={idx} className="small text-muted mb-1">
                                {lang.language} - {lang.proficiency}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Education */}
                    {(mentor?.degree || mentor?.graduationYear || mentor?.college) && (
                      <div className="mb-3">
                        <button
                          className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center"
                          onClick={() => toggleSection('education')}
                          style={{ color: '#333', fontWeight: '500' }}
                        >
                          <span>Education</span>
                          <i className={`bi bi-chevron-${expandedSections.education ? 'up' : 'down'}`}></i>
                        </button>
                        {expandedSections.education && (
                          <div className="mt-2 small text-muted">
                            {mentor.degree && <div>{mentor.degree}</div>}
                            {mentor.college && <div>{mentor.college}</div>}
                            {mentor.graduationYear && <div>Graduated: {mentor.graduationYear}</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Work Experience */}
                    {mentor?.experience && mentor.experience.length > 0 && (
                      <div className="mb-3">
                        <button
                          className="btn btn-link text-decoration-none p-0 w-100 text-start d-flex justify-content-between align-items-center"
                          onClick={() => toggleSection('experience')}
                          style={{ color: '#333', fontWeight: '500' }}
                        >
                          <span>Work Experience</span>
                          <i className={`bi bi-chevron-${expandedSections.experience ? 'up' : 'down'}`}></i>
                        </button>
                        {expandedSections.experience && (
                          <div className="mt-2">
                            {mentor.experience.map((exp, idx) => (
                              <div key={idx} className="small mb-3">
                                <strong>{exp.title}</strong> @ {exp.company}
                                {exp.duration && <div className="text-muted">{exp.duration}</div>}
                                {exp.description && <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>{exp.description}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3" style={{ borderTop: '1px solid #e0e0e0' }}>
                      {isOwner ? (
                        viewMode === 'public' ? (
                          <>
                            <button
                              className="btn btn-primary w-100 mb-2"
                              onClick={() => setViewMode('edit')}
                              style={{ borderRadius: '8px', padding: '10px' }}
                            >
                              <i className="bi bi-pencil"></i> Manage Profile
                            </button>
                            <button
                              className="btn btn-outline-secondary w-100"
                              onClick={() => {
                                // Open in new tab with same URL (public view)
                                const publicUrl = window.location.href;
                                window.open(publicUrl, '_blank');
                              }}
                              style={{ borderRadius: '8px', padding: '10px' }}
                            >
                              <i className="bi bi-eye"></i> View Public Profile
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-outline-primary w-100"
                            onClick={() => {
                              setViewMode('public');
                              setShowEditProfileModal(true);
                            }}
                            style={{ borderRadius: '8px', padding: '10px' }}
                          >
                            <i className="bi bi-pencil"></i> Edit Profile Details
                          </button>
                        )
                      ) : (
                        // Request Mentorship Button for non-owners (students)
                        user?.role === 'student' && (
                          <button
                            className="btn btn-primary w-100"
                            onClick={handleRequestMentorship}
                            disabled={requestingMentorship || hasRequested || mentorship.status === 'full'}
                            style={{ 
                              borderRadius: '8px', 
                              padding: '10px',
                              fontWeight: '600',
                              opacity: hasRequested || mentorship.status === 'full' ? 0.6 : 1
                            }}
                          >
                            {requestingMentorship ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Submitting...
                              </>
                            ) : hasRequested ? (
                              <>
                                <i className="bi bi-check-circle me-2"></i>
                                Request Sent
                              </>
                            ) : mentorship.status === 'full' ? (
                              <>
                                <i className="bi bi-x-circle me-2"></i>
                                Mentorship Full
                              </>
                            ) : (
                              <>
                                <i className="bi bi-person-plus me-2"></i>
                                Request Mentorship
                              </>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-lg-8">
              {/* Available Services Section */}
              <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="mb-1" style={{ fontWeight: '700', fontSize: '1.5rem' }}>Available Services</h4>
                      <p className="text-muted small mb-0">Discover our mentorship offerings designed for your success.</p>
                    </div>
                    {isOwner && viewMode === 'edit' && (
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
                        style={{ borderRadius: '20px', padding: '8px 20px' }}
                      >
                        <i className="bi bi-plus-circle"></i> Add Resource/Service
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="d-flex gap-2 mb-4">
                    <button 
                      className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setActiveTab('all')}
                      style={{ 
                        borderRadius: '20px', 
                        padding: '8px 20px',
                        fontWeight: activeTab === 'all' ? '600' : 'normal',
                        fontSize: '0.9rem'
                      }}
                    >
                      All
                    </button>
                    <button 
                      className={`btn ${activeTab === '1:1_call' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setActiveTab('1:1_call')}
                      style={{ 
                        borderRadius: '20px', 
                        padding: '8px 20px',
                        fontWeight: activeTab === '1:1_call' ? '600' : 'normal',
                        fontSize: '0.9rem'
                      }}
                    >
                      1:1 Call
                    </button>
                    <button 
                      className={`btn ${activeTab === 'resource' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setActiveTab('resource')}
                      style={{ 
                        borderRadius: '20px', 
                        padding: '8px 20px',
                        fontWeight: activeTab === 'resource' ? '600' : 'normal',
                        fontSize: '0.9rem'
                      }}
                    >
                      Resources
                    </button>
                  </div>

                  {/* Resources Grid */}
                  <div className="row g-3">
                    {filteredResources.map((resource, idx) => (
                      <div className="col-md-6" key={idx}>
                        <div className="card h-100 border-0 shadow-sm" style={{ 
                          borderRadius: '12px', 
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          position: 'relative'
                        }}
                             onMouseEnter={(e) => {
                               e.currentTarget.style.transform = 'translateY(-4px)';
                               e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                             }}
                             onMouseLeave={(e) => {
                               e.currentTarget.style.transform = 'translateY(0)';
                               e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                             }}>
                          <div className="card-body p-4" style={{ position: 'relative' }}>
                            {/* Resource Type Tag */}
                            <span 
                              className="badge"
                              style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                fontSize: '0.75rem',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                backgroundColor: resource.type === 'resource' ? '#fd7e14' : '#667eea',
                                color: 'white'
                              }}
                            >
                              {resource.type === 'resource' ? 'Resource' : '1:1 Call'}
                            </span>
                            
                            {resource.isBestSeller && (
                              <span 
                                className="badge"
                                style={{
                                  position: 'absolute',
                                  top: '12px',
                                  right: '12px',
                                  fontSize: '0.75rem',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontWeight: '600',
                                  backgroundColor: '#fd7e14',
                                  color: 'white'
                                }}
                              >
                                Best Seller
                              </span>
                            )}

                            <div className="d-flex justify-content-between align-items-start mb-3" style={{ marginTop: '28px' }}>
                              <div className="flex-grow-1">
                                <h6 className="card-title mb-2" style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>
                                  {resource.title}
                                </h6>
                                {resource.description && (
                                  <p className="text-muted small mb-2" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                                    {resource.description}
                                  </p>
                                )}
                                {resource.type === '1:1_call' && (
                                  <div className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.85rem', color: '#666' }}>
                                    <i className="bi bi-clock"></i>
                                    <span>{resource.duration} Min</span>
                                  </div>
                                )}
                              </div>
                              {isOwner && viewMode === 'edit' && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteResource(resource._id);
                                    }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <div>
                                {resource.isFree ? (
                                  <span className="badge bg-success" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>Free</span>
                                ) : (
                                  <div>
                                    <span className="fw-bold" style={{ color: '#667eea', fontSize: '1.1rem' }}>₹{resource.price}</span>
                                    {resource.type === '1:1_call' && resource.price > 199 && (
                                      <span className="text-muted text-decoration-line-through ms-2" style={{ fontSize: '0.9rem' }}>
                                        ₹{Math.floor(resource.price * 1.5)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {(!isOwner || viewMode === 'public') && (
                                <button 
                                  className="btn btn-primary btn-sm"
                                  style={{ 
                                    borderRadius: '20px', 
                                    padding: '6px 20px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                  }}
                                >
                                  {resource.isFree ? 'Download Free' : resource.type === '1:1_call' ? 'Book Now' : `Purchase ₹${resource.price}`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredResources.length === 0 && (
                    <div className="text-center text-muted py-5">
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
              <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0" style={{ fontWeight: '700', fontSize: '1.5rem' }}>Reviews</h4>
                    {user && !isOwner && (
                      <>
                        {canWriteReview() ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowReviewModal(true)}
                            style={{ borderRadius: '8px', padding: '8px 20px', fontWeight: '600' }}
                          >
                            <i className="bi bi-pencil me-2"></i>Write Review
                          </button>
                        ) : (
                          <div className="text-muted small" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-check-circle me-2"></i>
                            You have already reviewed this mentor
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Overall Rating Display */}
                  <div className="mb-5 text-center" style={{ 
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '30px'
                  }}>
                    <div style={{ fontSize: '4rem', fontWeight: '700', color: '#667eea', marginBottom: '16px' }}>
                      {rating > 0 ? rating.toFixed(1) : '0.0'}
                    </div>
                    <div className="mb-2">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`bi bi-star${i < Math.floor(rating) ? '-fill' : i < rating ? '-half' : ''} text-warning`}
                          style={{ fontSize: '1.5rem' }}
                        ></i>
                      ))}
                    </div>
                    <div className="text-muted" style={{ fontSize: '1rem' }}>
                      Average Rating ({totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'})
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  <div className="reviews-list">
                    {mentorship.reviews && mentorship.reviews.length > 0 ? (
                      mentorship.reviews
                        .slice() // Create a copy to avoid mutating the original array
                        .sort((a, b) => {
                          const dateA = new Date(a.createdAt || a.createdAt || 0);
                          const dateB = new Date(b.createdAt || b.createdAt || 0);
                          return dateB.getTime() - dateA.getTime(); // Sort newest first
                        })
                        .map((review, idx, sortedReviews) => {
                          // Use a unique key based on review ID or index + student ID
                          const reviewKey = review._id || `${review.student?._id || review.student || idx}_${review.createdAt || idx}`;
                          
                          return (
                            <div key={reviewKey} className="border-bottom pb-4 mb-4" style={{ 
                              borderColor: idx < sortedReviews.length - 1 ? '#e0e0e0' : 'transparent',
                              animation: 'fadeIn 0.5s ease-in'
                            }}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center gap-3">
                                  <img
                                    src={review.student?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.student?.name || 'A')}&size=50&background=667eea&color=fff`}
                                    alt={review.student?.name || 'Reviewer'}
                                    style={{
                                      width: '50px',
                                      height: '50px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '2px solid #f0f0f0'
                                    }}
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.student?.name || 'A')}&size=50&background=667eea&color=fff`;
                                    }}
                                  />
                                  <div>
                                    <strong style={{ fontSize: '1rem', color: '#333' }}>
                                      {review.student?.name || 'Anonymous'}
                                    </strong>
                                    <div className="text-muted small">
                                      {review.createdAt 
                                        ? new Date(review.createdAt).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        : 'Just now'
                                      }
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-success" style={{ fontSize: '0.85rem', padding: '4px 10px' }}>
                                    {review.rating}★
                                  </span>
                                  <div className="d-flex">
                                    {[...Array(5)].map((_, i) => (
                                      <i
                                        key={i}
                                        className={`bi bi-star${i < review.rating ? '-fill' : ''} text-warning`}
                                        style={{ fontSize: '0.85rem' }}
                                      ></i>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {review.comment && (
                                <p className="mb-0 mt-2" style={{ lineHeight: '1.7', color: '#333', fontSize: '0.95rem' }}>
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bi bi-chat-left-text" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                        <p className="mt-3">No reviews yet. Be the first to review this mentor!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Resource Modal */}
        {showResourceModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Resource/Service</h5>
                  <button type="button" className="btn-close" onClick={() => setShowResourceModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      className="form-control"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                      placeholder="e.g., Resume Template!!"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                      placeholder="Describe the resource or service..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-select"
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
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Resource/Service</h5>
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
                      className="form-select"
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
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
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

        {/* Write Review Modal */}
        {showReviewModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Write a Review</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewForm({ rating: 0, comment: '' });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-4">
                    <label className="form-label" style={{ fontWeight: '600', marginBottom: '12px' }}>
                      Rating <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn p-0"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          style={{ 
                            border: 'none', 
                            background: 'transparent',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            lineHeight: 1
                          }}
                          onMouseEnter={(e) => {
                            if (star <= reviewForm.rating) return;
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <i 
                            className={`bi bi-star${star <= reviewForm.rating ? '-fill' : ''} text-warning`}
                          ></i>
                        </button>
                      ))}
                      {reviewForm.rating > 0 && (
                        <span className="ms-2 text-muted" style={{ fontSize: '1rem' }}>
                          {reviewForm.rating} {reviewForm.rating === 1 ? 'star' : 'stars'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '600' }}>
                      Your Review <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>(Optional)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={6}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this mentor. What did you learn? How did they help you? (Optional, but if provided, must be at least 10 characters)"
                      style={{ fontSize: '14px' }}
                    />
                    <small className="text-muted">
                      {reviewForm.comment.length} characters {reviewForm.comment.length > 0 && reviewForm.comment.length < 10 && <span className="text-danger">(minimum 10 if provided)</span>}
                    </small>
                  </div>

                  {reviewForm.rating > 0 && (
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Your review will be visible to everyone viewing this mentor's profile.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowReviewModal(false);
                      setReviewForm({ rating: 0, comment: '' });
                    }}
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewForm.rating || (reviewForm.comment.trim().length > 0 && reviewForm.comment.trim().length < 10)}
                  >
                    {submittingReview ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Submit Review
                      </>
                    )}
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
