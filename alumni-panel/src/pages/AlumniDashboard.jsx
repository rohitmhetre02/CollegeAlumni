import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const AlumniDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState({
    jobsPosted: 0,
    eventsCreated: 0,
    mentorshipsCreated: 0
  });
  const [coordinator, setCoordinator] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showApprovalSuccessModal, setShowApprovalSuccessModal] = useState(false);
  const [approvalCoordinator, setApprovalCoordinator] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    fetchStatistics();
    calculateProfileCompletion();
  }, [user]);

  // Check approval status immediately and whenever user changes
  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'alumni')) {
      // Show modal if pending or rejected, hide only if approved
      const isPendingOrRejected = user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected';
      
      if (isPendingOrRejected) {
        // Only show modal if not already manually closed
        const hasSeenPopup = localStorage.getItem(`approvalPopupSeen_${user.id}`);
        if (!hasSeenPopup) {
          setShowApprovalModal(true);
        }
        setShowApprovalSuccessModal(false);
        // Fetch coordinator if department exists and not already fetched
        if (user?.department && !coordinator) {
          fetchCoordinator();
        }
      } else if (user?.approvalStatus === 'approved') {
        // Only hide when approved
        setShowApprovalModal(false);
        
        // Only show approval success modal if not already seen
        const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${user.id}`);
        if (!hasSeenSuccessPopup) {
          // Show approval success modal if coordinator info is available
          if (user.coordinator || user.approvedBy) {
            // Check if user object has coordinator info (from approval response)
            if (user.coordinator) {
              setApprovalCoordinator({
                name: user.coordinator.name || 'Not available',
                email: user.coordinator.email || 'Not available',
                phone: user.coordinator.phone || user.coordinator.mobileNumber || 'Not available'
              });
              setShowApprovalSuccessModal(true);
            } else {
              // Fetch coordinator if not in user object
              fetchCoordinatorForApproval();
            }
          }
        }
      }
    } else if (user && user.role !== 'student' && user.role !== 'alumni') {
      setShowApprovalModal(false);
      setShowApprovalSuccessModal(false);
    }
  }, [user, coordinator]);

  // Refresh user data periodically to check approval status
  useEffect(() => {
    if (!user?.approvalStatus || (user.approvalStatus !== 'pending' && user.approvalStatus !== 'rejected')) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/auth/me');
        const updatedUser = response.data;
        if (updatedUser && updatedUser.approvalStatus !== user.approvalStatus) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (updatedUser.approvalStatus === 'approved') {
            setShowApprovalModal(false);
            // Only show approval success modal if not already seen
            const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${updatedUser.id}`);
            if (!hasSeenSuccessPopup) {
              // Show approval success modal
              if (updatedUser.department) {
                const coordResponse = await api.get(`/users/coordinator/${updatedUser.department}`);
                if (coordResponse.data) {
                  setApprovalCoordinator({
                    name: coordResponse.data.name || 'Not available',
                    email: coordResponse.data.email || 'Not available',
                    phone: coordResponse.data.phone || coordResponse.data.mobileNumber || 'Not available'
                  });
                  setShowApprovalSuccessModal(true);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, setUser]);
  
  const fetchCoordinatorForApproval = async () => {
    if (!user?.department) return;
    
    // Check if already seen
    const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${user.id}`);
    if (hasSeenSuccessPopup) return;
    
    try {
      const response = await api.get(`/users/coordinator/${user.department}`);
      if (response.data) {
        setApprovalCoordinator({
          name: response.data.name || 'Not available',
          email: response.data.email || 'Not available',
          phone: response.data.phone || response.data.mobileNumber || 'Not available'
        });
        setShowApprovalSuccessModal(true);
      }
    } catch (error) {
      console.error('Error fetching coordinator for approval:', error);
    }
  };

  const checkApprovalStatus = () => {
    // Always show modal if pending - this triggers on registration and login
    if (user?.approvalStatus === 'pending' && (user?.role === 'student' || user?.role === 'alumni')) {
      setShowApprovalModal(true);
      // Fetch coordinator if not already fetched
      if (user?.department && !coordinator) {
        fetchCoordinator();
      }
    } else {
      setShowApprovalModal(false);
    }
  };

  const fetchCoordinator = async () => {
    if (!user?.department) return;
    
    try {
      const response = await api.get(`/users/coordinator/${user.department}`);
      if (response.data) {
        setCoordinator({
          name: response.data.name || 'Not available',
          email: response.data.email || 'Not available',
          phone: response.data.phone || response.data.mobileNumber || 'Not available',
          department: response.data.department || user.department
        });
      }
    } catch (error) {
      console.error('Error fetching coordinator:', error);
      // Set coordinator as null if not found
      setCoordinator(null);
    }
  };

  const calculateProfileCompletion = () => {
    if (!user) return;
    let filled = 2; // name, department (always present)
    let possible = 10; // Total fields to track

    if (user.phone) filled++;
    if (user.bio) filled++;
    if (user.profilePicture) filled++;
    if (user.location) filled++;
    if (user.graduationYear) filled++;
    if (user.currentPosition) filled++;
    if (user.company) filled++;
    if (user.skills && user.skills.length > 0) filled++;
    if (user.resumeUrl) filled++;
    if (user.headline) filled++;

    const completion = Math.floor((filled / possible) * 100);
    setProfileCompletion(completion);
  };

  const fetchStatistics = async () => {
    try {
      const jobsRes = await api.get('/jobs', { params: { status: 'active' } });
      const userJobs = (jobsRes.data || []).filter(job => job.postedBy?._id === user?.id || job.postedBy === user?.id);
      
      const eventsRes = await api.get('/events');
      const userEvents = (eventsRes.data || []).filter(event => event.organizer?._id === user?.id || event.organizer === user?.id);
      
      const mentorshipsRes = await api.get('/mentorships');
      const userMentorships = (mentorshipsRes.data || []).filter(m => m.mentor?._id === user?.id || m.mentor === user?.id);
      
      setStatistics({
        jobsPosted: userJobs.length || 0,
        eventsCreated: userEvents.length || 0,
        mentorshipsCreated: userMentorships.length || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics({
        jobsPosted: 0,
        eventsCreated: 0,
        mentorshipsCreated: 0
      });
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4">Alumni Dashboard</h2>

        {/* Coordinator Details Card - Professional Display */}
        {coordinator && (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected') && (user?.role === 'student' || user?.role === 'alumni') && (
          <div className="card shadow-sm mb-4" style={{ border: '2px solid #007bff', borderRadius: '12px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-badge"></i> Department Coordinator Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-person-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <small className="text-muted d-block">Name</small>
                      <strong>{coordinator.name || 'Not available'}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-envelope-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <small className="text-muted d-block">Email</small>
                      {coordinator.email ? (
                        <a href={`mailto:${coordinator.email}`} className="text-decoration-none">
                          <strong>{coordinator.email}</strong>
                        </a>
                      ) : (
                        <strong>Not available</strong>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-telephone-fill text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <small className="text-muted d-block">Mobile Number</small>
                      {coordinator.phone ? (
                        <a href={`tel:${coordinator.phone}`} className="text-decoration-none">
                          <strong>{coordinator.phone}</strong>
                        </a>
                      ) : (
                        <strong>Not available</strong>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-building text-primary me-3" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <small className="text-muted d-block">Department</small>
                      <strong>{coordinator.department || user?.department}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Pending Modal - Blocking Modal - Shows after registration and on login if pending or rejected */}
        {showApprovalModal && user && (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected') && (user?.role === 'student' || user?.role === 'alumni') && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning d-flex justify-content-between align-items-center">
                  <h5 className="modal-title">
                    <i className="bi bi-exclamation-triangle-fill"></i> Profile Under Review
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowApprovalModal(false);
                      // Mark that user has seen the popup
                      if (user?.id) {
                        localStorage.setItem(`approvalPopupSeen_${user.id}`, 'true');
                      }
                    }}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning mb-3">
                    <i className="bi bi-info-circle-fill"></i> <strong>
                      {user?.approvalStatus === 'rejected' 
                        ? 'Your profile has been rejected by your department coordinator'
                        : 'Your profile is under review by your department coordinator'
                      }
                      {coordinator && ` — ${coordinator.name}`}.
                    </strong>
                    <br />
                    <small className="mt-2 d-block">
                      {user?.approvalStatus === 'rejected' 
                        ? 'Please contact your coordinator for more information.'
                        : 'During this period, you will have limited access to the portal. Only Dashboard and Profile sections are accessible until your registration is verified.'
                      }
                    </small>
                  </div>
                  <p className="text-muted mb-0">
                    <i className="bi bi-info-circle"></i> Coordinator details are displayed below for your reference.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setShowApprovalModal(false);
                      // Mark that user has seen the popup
                      if (user?.id) {
                        localStorage.setItem(`approvalPopupSeen_${user.id}`, 'true');
                      }
                    }}
                  >
                    <i className="bi bi-check-circle"></i> OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Success Modal - Shows when profile is approved */}
        {showApprovalSuccessModal && user?.approvalStatus === 'approved' && (user?.role === 'student' || user?.role === 'alumni') && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-success d-flex justify-content-between align-items-center">
                  <h5 className="modal-title text-white">
                    <i className="bi bi-check-circle-fill"></i> Profile Approved!
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowApprovalSuccessModal(false);
                      // Mark that user has seen the success popup
                      if (user?.id) {
                        localStorage.setItem(`approvalSuccessPopupSeen_${user.id}`, 'true');
                      }
                    }}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-success mb-3">
                    <i className="bi bi-check-circle-fill"></i> <strong>
                      Congratulations! Your profile has been approved.
                    </strong>
                    <br />
                    <small className="mt-2 d-block">
                      You now have full access to all portal features.
                    </small>
                  </div>
                  
                  {approvalCoordinator ? (
                    <div>
                      <p className="mb-2"><strong>Approved by Coordinator:</strong></p>
                      <div className="card border-success">
                        <div className="card-body">
                          <p className="mb-2">
                            <i className="bi bi-person-fill text-success"></i> <strong>Name:</strong> {approvalCoordinator.name || 'Not available'}
                          </p>
                          <p className="mb-2">
                            <i className="bi bi-envelope-fill text-success"></i> <strong>Email:</strong> {approvalCoordinator.email ? (
                              <a href={`mailto:${approvalCoordinator.email}`}>{approvalCoordinator.email}</a>
                            ) : (
                              'Not available'
                            )}
                          </p>
                          <p className="mb-0">
                            <i className="bi bi-telephone-fill text-success"></i> <strong>Mobile Number:</strong> {approvalCoordinator.phone ? (
                              <a href={`tel:${approvalCoordinator.phone}`}>{approvalCoordinator.phone}</a>
                            ) : (
                              'Not available'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle"></i> Coordinator information is not available.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      setShowApprovalSuccessModal(false);
                      // Mark that user has seen the success popup
                      if (user?.id) {
                        localStorage.setItem(`approvalSuccessPopupSeen_${user.id}`, 'true');
                      }
                    }}
                  >
                    <i className="bi bi-check-circle"></i> OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Profile Card - Show only if approved and profile incomplete */}
        {user?.approvalStatus === 'approved' && profileCompletion < 100 && (
          <div className="card shadow-sm mb-4" style={{ border: '2px solid #1976D2', borderRadius: '12px' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-4" style={{ flex: 1 }}>
                  {/* Circular Progress Indicator */}
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#42b72a"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={2 * Math.PI * 36 * (1 - profileCompletion / 100)}
                        strokeLinecap="round"
                      />
                      <text
                        x="40"
                        y="45"
                        textAnchor="middle"
                        fontSize="16"
                        fontWeight="700"
                        fill="#42b72a"
                        style={{ transform: 'rotate(90deg)', transformOrigin: '40px 40px' }}
                      >
                        {profileCompletion}%
                      </text>
                    </svg>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-2">
                      <i className="bi bi-person-check"></i> Complete Your Profile
                    </h5>
                    <p className="text-muted mb-2">
                      Your profile is <strong>{profileCompletion}%</strong> complete. 
                      {profileCompletion < 100 && ' Fill in all required details to reach 100% and unlock all features.'}
                    </p>
                    <div className="progress mb-3" style={{ height: '12px', maxWidth: '400px', borderRadius: '6px' }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${profileCompletion}%` }}
                        aria-valuenow={profileCompletion}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>{profileCompletion}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ms-3">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/profile')}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-pencil-square"></i> Complete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card shadow text-center">
              <div className="card-body">
                <h3 className="display-4 text-primary">{statistics.jobsPosted}</h3>
                <p className="text-muted">Jobs Posted</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow text-center">
              <div className="card-body">
                <h3 className="display-4 text-success">{statistics.eventsCreated}</h3>
                <p className="text-muted">Events Created</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow text-center">
              <div className="card-body">
                <h3 className="display-4 text-info">{statistics.mentorshipsCreated}</h3>
                <p className="text-muted">Mentorships Created</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-body">
            <h4 className="mb-3">
              <i className="bi bi-star-fill"></i> Alumni Portal
            </h4>
            <p>Post job opportunities, create events, and offer mentorship programs to students.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniDashboard;
