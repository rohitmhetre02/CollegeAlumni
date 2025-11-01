import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MentorshipsWithSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [myMentorship, setMyMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBecomeMentorModal, setShowBecomeMentorModal] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [becomingMentor, setBecomingMentor] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    title: '',
    description: '',
    department: user?.department || '',
    expertise: [],
    maxMentees: 5
  });
  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    fetchMentors();
    checkIfMentor();
  }, []);

  const checkIfMentor = async () => {
    try {
      const response = await api.get('/mentorships');
      const userMentorships = (response.data || []).filter(m => 
        m.mentor?._id === user?.id || m.mentor === user?.id
      );
      setIsMentor(userMentorships.length > 0);
      if (userMentorships.length > 0) {
        setMyMentorship(userMentorships[0]);
      }
    } catch (error) {
      console.error('Error checking mentor status:', error);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await api.get('/mentorships');
      const allMentorships = response.data || [];
      
      // Separate own mentorship from others
      const myMentorshipData = allMentorships.find(m => 
        m.mentor?._id === user?.id || m.mentor === user?.id
      );
      
      if (myMentorshipData) {
        setMyMentorship(myMentorshipData);
      }

      // Other mentors (exclude own)
      const otherMentorships = allMentorships.filter(m => 
        (m.mentor?._id !== user?.id && m.mentor !== user?.id) || !user
      );

      const mentorsData = otherMentorships.map((m, idx) => {
        // Extract mentor ID - handle both populated (object with _id) and unpopulated (just ID) cases
        let mentorId;
        if (m.mentor) {
          if (m.mentor._id) {
            // Populated mentor object
            mentorId = typeof m.mentor._id === 'string' ? m.mentor._id : m.mentor._id.toString();
          } else if (typeof m.mentor === 'object' && m.mentor.id) {
            // Alternative ID field
            mentorId = typeof m.mentor.id === 'string' ? m.mentor.id : m.mentor.id.toString();
          } else {
            // Unpopulated - mentor is just the ID
            mentorId = typeof m.mentor === 'string' ? m.mentor : m.mentor.toString();
          }
        }
        
        return {
          _id: mentorId,
          mentorshipId: m._id,
        name: m.mentor?.name || 'Unknown',
        fullName: m.mentor?.name || 'Unknown',
        position: m.mentor?.currentPosition || '',
        company: m.mentor?.company || '',
        education: m.mentor?.degree || m.mentor?.education || '',
        rating: m.rating || 4.5,
          totalRatings: m.totalRatings || 0,
        profileImage: m.mentor?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.mentor?.name || 'Mentor')}&background=random&size=128`,
          headerColor: ['#F3E5F5', '#F3E5F5', '#F3E5F5', '#E1F5FE'][idx % 4],
          available: m.isAvailable !== false && m.status === 'active'
        };
      });
      setMentors(mentorsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
      setMentors([]);
      setLoading(false);
    }
  };

  const handleViewProfile = (mentorId) => {
    // Ensure mentorId is a string
    const id = typeof mentorId === 'string' ? mentorId : (mentorId?.toString() || mentorId);
    console.log('Navigating to mentor profile with ID:', id);
    navigate(`/mentor/${id}`);
  };

  const handleManageProfile = () => {
    if (myMentorship?.mentor) {
      let mentorId;
      if (myMentorship.mentor._id) {
        mentorId = typeof myMentorship.mentor._id === 'string' ? myMentorship.mentor._id : myMentorship.mentor._id.toString();
      } else {
        mentorId = typeof myMentorship.mentor === 'string' ? myMentorship.mentor : myMentorship.mentor.toString();
      }
      console.log('Navigating to mentor dashboard with ID:', mentorId);
      navigate(`/mentor/${mentorId}/dashboard`);
    }
  };

  const handleBecomeMentor = async () => {
    // Navigate to onboarding flow instead of creating mentorship directly
      setShowBecomeMentorModal(false);
    navigate('/mentor/onboarding');
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !mentorForm.expertise.includes(newExpertise.trim())) {
      setMentorForm(f => ({ ...f, expertise: [...f.expertise, newExpertise.trim()] }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (index) => {
    setMentorForm(f => ({ ...f, expertise: f.expertise.filter((_, i) => i !== index) }));
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

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="bi bi-person-heart"></i> Mentorship Programs
          </h2>
          {user?.role === 'alumni' && !isMentor && (
            <button
              className="btn btn-primary"
              onClick={() => setShowBecomeMentorModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Become Mentor
            </button>
          )}
        </div>

        {/* My Own Mentor Profile Card - Show at Top if is Mentor */}
        {isMentor && myMentorship && (
          <div className="card shadow-lg mb-4" style={{ border: '3px solid #007bff', borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body p-4 text-white">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img 
                      src={myMentorship.mentor?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(myMentorship.mentor?.name || 'Mentor')}&size=100&background=fff&color=667eea`}
                      alt={myMentorship.mentor?.name}
                      className="rounded-circle"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', border: '3px solid white' }}
                    />
                    <div>
                      <h4 className="mb-1 text-white">{myMentorship.mentor?.name}</h4>
                      <p className="mb-1 opacity-75">
                        {myMentorship.mentor?.currentPosition} @ {myMentorship.mentor?.company}
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-star-fill text-warning"></i>
                        <span className="fw-bold">{myMentorship.rating?.toFixed(1) || '0.0'}</span>
                        {myMentorship.totalRatings > 0 && (
                          <span className="opacity-75">({myMentorship.totalRatings} reviews)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {myMentorship.isTopMentor && (
                    <div className="mb-2">
                      <i className="bi bi-trophy-fill text-warning"></i>
                      <span className="ms-2">Top Mentor - {myMentorship.menteeEngagements || 0} Engagements</span>
                    </div>
                  )}
                </div>
                <div className="col-md-4 text-end">
                  <button
                    className="btn btn-light btn-lg"
                    onClick={handleManageProfile}
                    style={{ borderRadius: '20px', padding: '10px 30px' }}
                  >
                    <i className="bi bi-gear-fill"></i> Manage Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="row g-4" style={{ marginBottom: '20px' }}>
          {mentors.map((mentor, index) => (
            <div className="col-md-6 col-lg-3" key={mentor._id}>
              <div className="card shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'visible', border: 'none', position: 'relative' }}>
                {/* Colored Header with Pattern */}
                <div 
                  style={{ 
                    height: '80px', 
                    backgroundColor: mentor.headerColor,
                    position: 'relative',
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 2px, transparent 2px), linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.1) 60%, transparent 60%)',
                    backgroundSize: '30px 30px, 30px 30px, 20px 20px',
                    borderRadius: '16px 16px 0 0'
                  }}
                >
                  {/* Available Badge */}
                  {mentor.available && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: '#1976D2',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 2
                      }}
                    >
                      <i className="bi bi-lightning-charge-fill" style={{ fontSize: '10px' }}></i>
                      Available
                    </div>
                  )}
                  
                  {/* Trophy Icon */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '20px',
                      color: '#FFD700',
                      zIndex: 2
                    }}
                  >
                    <i className="bi bi-trophy-fill"></i>
                  </div>
                </div>

                {/* Profile Picture - Overlapping Header */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '4px solid white',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    background: '#f0f0f0',
                    zIndex: 3
                  }}
                >
                  <img 
                    src={mentor.profileImage} 
                    alt={mentor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&size=128`;
                    }}
                  />
                </div>

                {/* Card Body */}
                <div className="card-body text-center" style={{ paddingTop: '50px', paddingBottom: '20px' }}>

                  {/* Rating */}
                  <div className="mb-2" style={{ marginTop: '10px' }}>
                    <i className="bi bi-star-fill text-warning"></i>
                    <span className="ms-1 fw-bold" style={{ fontSize: '14px' }}>{mentor.rating}</span>
                  </div>

                  {/* Name */}
                  <h5 className="card-title mb-2" style={{ fontSize: '16px', fontWeight: '600' }}>
                    {mentor.name}
                  </h5>

                  {/* Professional Details */}
                  <p className="text-muted mb-3" style={{ fontSize: '12px', lineHeight: '1.5', minHeight: '60px' }}>
                    {mentor.position && <strong>{mentor.position}</strong>}
                    {mentor.company && ` @${mentor.company}`}
                    {mentor.education && (
                      <>
                        <br />
                        {mentor.education}
                      </>
                    )}
                  </p>

                  {/* View Profile Button */}
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => handleViewProfile(mentor._id)}
                    style={{
                      borderRadius: '20px',
                      padding: '6px 20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      borderWidth: '1.5px',
                      width: '100%'
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mentors.length === 0 && (
          <div className="alert alert-info">
            <i className="bi bi-info-circle"></i> No mentors available at the moment.
          </div>
        )}

        {/* Become Mentor Modal */}
        {showBecomeMentorModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Become a Mentor</h5>
                  <button type="button" className="btn-close" onClick={() => setShowBecomeMentorModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Mentorship Title *</label>
                    <input
                      className="form-control"
                      value={mentorForm.title}
                      onChange={e => setMentorForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g., Software Engineering Mentorship"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={mentorForm.description}
                      onChange={e => setMentorForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your mentorship program, what you can help with, etc."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Department *</label>
                    <input
                      className="form-control"
                      value={mentorForm.department}
                      onChange={e => setMentorForm(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Expertise Areas</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        className="form-control"
                        value={newExpertise}
                        onChange={e => setNewExpertise(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                        placeholder="Add expertise (e.g., React, Node.js)"
                      />
                      <button className="btn btn-outline-primary" onClick={addExpertise}>
                        Add
                      </button>
                    </div>
                    {mentorForm.expertise.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {mentorForm.expertise.map((exp, idx) => (
                          <span key={idx} className="badge bg-primary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                            {exp}
                            <button
                              className="btn btn-sm p-0 ms-2 text-white"
                              style={{ border: 'none', background: 'transparent' }}
                              onClick={() => removeExpertise(idx)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Max Mentees</label>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      max="20"
                      value={mentorForm.maxMentees}
                      onChange={e => setMentorForm(f => ({ ...f, maxMentees: parseInt(e.target.value) || 5 }))}
                    />
                    <small className="form-text text-muted">Maximum number of mentees you can mentor</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBecomeMentorModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleBecomeMentor}
                    disabled={becomingMentor || !mentorForm.title || !mentorForm.description || !mentorForm.department}
                  >
                    {becomingMentor ? 'Creating...' : 'Become Mentor'}
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

export default MentorshipsWithSidebar;

