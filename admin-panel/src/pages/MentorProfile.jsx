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

  useEffect(() => {
    fetchMentorProfile();
  }, [mentorId]);

  const fetchMentorProfile = async () => {
    try {
      if (!mentorId) {
        console.error('Mentor ID is missing');
        alert('Invalid mentor ID. Please try again.');
        setLoading(false);
        navigate(user?.role === 'admin' ? '/admin/mentorships' : '/coordinator/mentorships');
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
      setTimeout(() => {
        navigate(user?.role === 'admin' ? '/admin/mentorships' : '/coordinator/mentorships');
      }, 2000);
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(user?.role === 'admin' ? '/admin/mentorships' : '/coordinator/mentorships')}
          >
            <i className="bi bi-arrow-left"></i> Back to Mentorships
          </button>
        </div>

        {/* Header Banner */}
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
                    <i className="bi bi-star-fill" style={{ fontSize: '2rem' }}></i>
                    <div className="small">Rating</div>
                    <div className="fw-bold">{rating.toFixed(1)} ({totalReviews} reviews)</div>
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
                {/* Profile Picture */}
                <img 
                  src={mentor?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor?.name || 'Mentor')}&size=200`}
                  alt={mentor?.name}
                  className="rounded-circle mb-3"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />

                {/* Rating */}
                <div className="mb-2">
                  {[...Array(5)].map((_, i) => (
                    <i 
                      key={i} 
                      className={`bi bi-star${i < Math.floor(rating) ? '-fill' : ''} text-warning`}
                    ></i>
                  ))}
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

                {/* Status Badge */}
                {mentorship.isAvailable && (
                  <span className="badge bg-success mb-3">
                    <i className="bi bi-lightning-charge-fill"></i> Available
                  </span>
                )}

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
                </div>

                {/* About Section */}
                {mentorship.about && (
                  <div className="mt-4 text-start">
                    <h6 className="mb-2">About</h6>
                    <p className="text-muted small">{mentorship.about}</p>
                  </div>
                )}

                {/* Topics */}
                {mentorship.topics && mentorship.topics.length > 0 && (
                  <div className="mt-3 text-start">
                    <h6 className="mb-2">Topics</h6>
                    <div>
                      {mentorship.topics.map((topic, idx) => (
                        <span key={idx} className="badge bg-secondary me-1 mb-1">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {mentorship.skills && mentorship.skills.length > 0 && (
                  <div className="mt-3 text-start">
                    <h6 className="mb-2">Skills</h6>
                    <div>
                      {mentorship.skills.map((skill, idx) => (
                        <span key={idx} className="badge bg-primary me-1 mb-1">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-8">
            {/* Mentees Section */}
            {mentorship.mentees && mentorship.mentees.length > 0 && (
              <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                <div className="card-body">
                  <h5 className="mb-3">
                    <i className="bi bi-people-fill"></i> Mentees ({mentorship.mentees.length})
                  </h5>
                  <div className="list-group">
                    {mentorship.mentees.map((mentee, idx) => (
                      <div key={idx} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{mentee.student?.name || 'Unknown'}</strong>
                            <div className="text-muted small">
                              {mentee.student?.enrollmentNumber && `Enrollment: ${mentee.student.enrollmentNumber}`}
                              {mentee.student?.department && ` | ${mentee.student.department}`}
                            </div>
                          </div>
                          <span className={`badge ${mentee.status === 'accepted' ? 'bg-success' : mentee.status === 'pending' ? 'bg-warning' : 'bg-secondary'}`}>
                            {mentee.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Resources Section */}
            {mentorship.resources && mentorship.resources.length > 0 && (
              <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                <div className="card-body">
                  <h5 className="mb-3">
                    <i className="bi bi-file-earmark"></i> Resources & Services ({mentorship.resources.length})
                  </h5>
                  <div className="row g-3">
                    {mentorship.resources.map((resource, idx) => (
                      <div className="col-md-6" key={idx}>
                        <div className="card h-100">
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
                              <span className="badge bg-info">{resource.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body">
                <h5 className="mb-3">
                  <i className="bi bi-star-fill"></i> Reviews ({totalReviews})
                </h5>
                
                {mentorship.reviews && mentorship.reviews.length > 0 ? (
                  <div className="reviews-list">
                    {mentorship.reviews.map((review, idx) => (
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">No reviews yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;

