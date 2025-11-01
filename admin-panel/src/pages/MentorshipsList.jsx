import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MentorshipsList = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await api.get('/mentorships');
      const mentorsData = (response.data || []).map(m => ({
        _id: m._id,
        name: m.mentor?.name || 'Unknown',
        fullName: m.mentor?.name || 'Unknown',
        position: m.mentor?.currentPosition || '',
        company: m.mentor?.company || '',
        education: m.mentor?.degree || m.mentor?.education || '',
        rating: m.rating || 4.5,
        profileImage: m.mentor?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.mentor?.name || 'Mentor')}&background=random&size=128`,
        headerColor: ['#E3F2FD', '#F3E5F5', '#FCE4EC', '#E1F5FE', '#E8F5E9', '#FFF3E0'][Math.floor(Math.random() * 6)],
        available: m.status === 'active'
      }));
      setMentors(mentorsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
      setMentors([]);
      setLoading(false);
    }
  };

  const handleViewProfile = (mentorId) => {
    // Navigate to profile or show details
    console.log('View profile:', mentorId);
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
        <h2 className="mb-4">
          <i className="bi bi-person-heart"></i> Mentorship Programs
        </h2>
        
        <div className="row g-4" style={{ marginBottom: '20px' }}>
          {mentors.map((mentor, index) => (
            <div className="col-md-6 col-lg-3" key={mentor._id}>
              <div className="card shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'visible', border: 'none', position: 'relative' }}>
                {/* Colored Header with Pattern */}
                <div 
                  style={{ 
                    height: '80px', 
                    background: mentor.headerColor,
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
      </div>
    </div>
  );
};

export default MentorshipsList;

