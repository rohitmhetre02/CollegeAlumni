import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

const StudentDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  // Stats
  const [stats, setStats] = useState({
    mentorsConnected: 0,
    jobApplications: 0,
    eventsJoined: 0,
    messagesSent: 0,
    profileCompletion: 0
  });

  // Chart data
  const [mentorshipSessionsData, setMentorshipSessionsData] = useState([]);
  const [jobApplicationsData, setJobApplicationsData] = useState([]);
  const [participationData, setParticipationData] = useState([]);

  // List data
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);

  // Existing state
  const [coordinator, setCoordinator] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showApprovalSuccessModal, setShowApprovalSuccessModal] = useState(false);
  const [approvalCoordinator, setApprovalCoordinator] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    calculateProfileCompletion();
    }
  }, [user]);

  // Check approval status immediately and whenever user changes
  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'alumni')) {
      const isPendingOrRejected = user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected';
      
      if (isPendingOrRejected) {
        const hasSeenPopup = localStorage.getItem(`approvalPopupSeen_${user.id}`);
        if (!hasSeenPopup) {
          setShowApprovalModal(true);
        } else {
          setShowApprovalModal(false);
        }
        // Always hide approval success modal if pending/rejected
        setShowApprovalSuccessModal(false);
        if (user?.department && !coordinator) {
          fetchCoordinator();
        }
      } else if (user?.approvalStatus === 'approved') {
        setShowApprovalModal(false);
        
        // ALWAYS check localStorage first and set modal to false if already seen
        const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${user.id}`);
        if (hasSeenSuccessPopup) {
          // Already seen - don't show again
          setShowApprovalSuccessModal(false);
        } else {
          // Not seen yet - show modal only if coordinator info is available
          if (user.coordinator || user.approvedBy) {
            if (user.coordinator) {
              setApprovalCoordinator({
                name: user.coordinator.name || 'Not available',
                email: user.coordinator.email || 'Not available',
                phone: user.coordinator.phone || user.coordinator.mobileNumber || 'Not available'
              });
              setShowApprovalSuccessModal(true);
            } else {
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
            // ALWAYS check localStorage first - if already seen, don't show again
            const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${updatedUser.id}`);
            if (hasSeenSuccessPopup) {
              // Already seen - don't show again
              setShowApprovalSuccessModal(false);
            } else {
              // Not seen yet - show modal only once
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
    }, 30000);

    return () => clearInterval(interval);
  }, [user, setUser]);
  
  const fetchCoordinatorForApproval = async () => {
    if (!user?.department) return;
    
    // Always check localStorage first - if already seen, don't show modal
    const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${user.id}`);
    if (hasSeenSuccessPopup) {
      setShowApprovalSuccessModal(false);
      return;
    }
    
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
      setCoordinator(null);
    }
  };

  const calculateProfileCompletion = () => {
    if (!user) return;
    let filled = 2; // name, department, enrollmentNumber (always present)
    let possible = 10; // Total fields to track

    if (user.phone) filled++;
    if (user.bio) filled++;
    if (user.profilePicture) filled++;
    if (user.location) filled++;
    if (user.skills && user.skills.length > 0) filled++;
    if (user.resumeUrl) filled++;
    if (user.headline) filled++;
    if (user.projects && user.projects.length > 0) filled++;
    if (user.languages && user.languages.length > 0) filled++;
    if (user.graduationYear) filled++;

    const completion = Math.floor((filled / possible) * 100);
    setProfileCompletion(completion);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [jobsRes, eventsRes, mentorshipsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/events'),
        api.get('/mentorships')
      ]);

      const userId = user?.id || user?._id;

      // Get user's job applications
      const allJobs = jobsRes.data || [];
      const userApplications = allJobs.flatMap(job => 
        (job.applications || []).filter(app => 
          app.student?._id === userId || app.student === userId
        )
      );

      // Get user's registered events
      const registeredEvents = (eventsRes.data || []).filter(event => 
        event.attendees?.some(attendee => 
          attendee.user?._id === userId || attendee.user === userId
        )
      );

      // Get user's accepted mentorships
      const userMentorships = (mentorshipsRes.data || []).filter(m => 
        m.mentees?.some(mentee => 
          (mentee.student?._id === userId || mentee.student === userId) && mentee.status === 'accepted'
        )
      );

      // Count mentors connected (accepted mentorships)
      const mentorsConnected = userMentorships.length;

      // Count job applications and shortlisted
      const jobApplications = userApplications.length;
      const shortlisted = userApplications.filter(app => app.status === 'shortlisted').length;

      // Estimate messages sent based on interactions
      const messagesSent = Math.floor(
        (mentorsConnected * 8) + (registeredEvents.length * 3) + (jobApplications * 2)
      );

      setStats({
        mentorsConnected,
        jobApplications,
        eventsJoined: registeredEvents.length,
        messagesSent,
        profileCompletion
      });

      // Generate mentorship sessions data (last 6 months)
      const mentorshipSessions = generateMentorshipSessionsData(userMentorships);
      setMentorshipSessionsData(mentorshipSessions);

      // Generate job applications vs shortlisted data
      const jobData = generateJobApplicationsData(allJobs, userId);
      setJobApplicationsData(jobData);

      // Generate participation data
      const participation = [
        { name: 'Mentorship', value: mentorsConnected },
        { name: 'Events', value: registeredEvents.length },
        { name: 'Networking', value: Math.floor((mentorsConnected + registeredEvents.length) / 2) }
      ];
      setParticipationData(participation);

      // Get recommended mentors (available mentors from user's department, excluding already connected)
      const connectedMentorIds = userMentorships.map(m => m.mentor?._id || m.mentor);
      const allMentorships = mentorshipsRes.data || [];
      const availableMentors = allMentorships
        .filter(m => 
          m.department === user?.department &&
          m.status === 'active' &&
          m.isAvailable !== false &&
          !connectedMentorIds.includes(m.mentor?._id || m.mentor)
        )
        .slice(0, 5);
      setRecommendedMentors(availableMentors);

      // Get upcoming events (next 5 events)
      const upcoming = (eventsRes.data || [])
        .filter(event => new Date(event.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
      setUpcomingEvents(upcoming);

      // Get recent job postings (latest 5 active jobs)
      const recent = allJobs
        .filter(job => job.status === 'active')
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5);
      setRecentJobs(recent);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMentorshipSessionsData = (mentorships) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      let sessions = 0;
      mentorships.forEach(mentorship => {
        const mentee = mentorship.mentees?.find(m => 
          (m.student?._id === user?.id || m.student === user?.id) && m.status === 'accepted'
        );
        if (mentee) {
          const menteeDate = new Date(mentee.requestedAt || mentorship.createdAt);
          if (menteeDate.getMonth() === date.getMonth() && menteeDate.getFullYear() === date.getFullYear()) {
            // Estimate sessions based on mentorship duration
            const daysSinceConnection = Math.floor((currentDate - menteeDate) / (1000 * 60 * 60 * 24));
            sessions += Math.min(Math.floor(daysSinceConnection / 7), 8); // Max 8 sessions per month
          }
        }
      });

      data.push({ month: monthKey, sessions });
    }

    return data;
  };

  const generateJobApplicationsData = (allJobs, userId) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      let applied = 0;
      let shortlisted = 0;

      allJobs.forEach(job => {
        const userApp = job.applications?.find(app => 
          (app.student?._id === userId || app.student === userId)
        );
        if (userApp) {
          const appDate = new Date(userApp.appliedAt || job.createdAt);
          if (appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear()) {
            applied++;
            if (userApp.status === 'shortlisted') {
              shortlisted++;
            }
          }
        }
      });

      data.push({ month: monthKey, applied, shortlisted });
    }

    return data;
  };

  if (loading) {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="text-center py-5">
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
      
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: 'linear-gradient(to bottom, #f8f9ff 0%, #ffffff 100%)' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-2" style={{ fontWeight: '700', color: '#1a1a1a' }}>
            <i className="bi bi-mortarboard-fill text-warning me-2"></i>
            Welcome, {user?.name || 'Student'}!
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Track your career growth and mentorship progress
          </p>
        </div>

        {/* Coordinator Details Card - Keeping existing */}
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

        {/* Approval Modals - Keeping existing modals */}
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

        {/* Complete Profile Card */}
        {user?.approvalStatus === 'approved' && profileCompletion < 100 && (
          <div className="card shadow-sm mb-4" style={{ border: '2px solid #1976D2', borderRadius: '12px' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-4" style={{ flex: 1 }}>
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
        
        {/* Top Stat Cards - Vibrant College Colors */}
        <div className="row mb-4 g-3" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              color: 'white',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 107, 107, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-people-fill" style={{ fontSize: '2.5rem', opacity: 0.95 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.mentorsConnected}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: '500' }}>Mentors Connected</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              color: 'white',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(78, 205, 196, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-briefcase-fill" style={{ fontSize: '2.5rem', opacity: 0.95 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.jobApplications}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: '500' }}>Job Applications</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #45B7D1 0%, #96C93D 100%)',
              color: 'white',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(69, 183, 209, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-calendar-event-fill" style={{ fontSize: '2.5rem', opacity: 0.95 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.eventsJoined}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: '500' }}>Events Joined</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FFA07A 0%, #FF6B9D 100%)',
              color: 'white',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 160, 122, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-chat-dots-fill" style={{ fontSize: '2.5rem', opacity: 0.95 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.messagesSent}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: '500' }}>Messages Sent</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #98D8C8 0%, #F7DC6F 100%)',
              color: 'white',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(152, 216, 200, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem', opacity: 0.95 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{profileCompletion}%</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: '500' }}>Profile Complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row mb-4">
          {/* Line Chart - Mentorship Sessions */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-graph-up text-success me-2"></i>
                  Mentorship Sessions
                </h5>
                <p className="text-muted small mb-0 mt-1">Sessions over time</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mentorshipSessionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="sessions" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 6, fill: '#FF6B6B' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bar Chart - Applied vs Shortlisted */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-fill text-info me-2"></i>
                  Job Applications
                </h5>
                <p className="text-muted small mb-0 mt-1">Applied vs Shortlisted</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={jobApplicationsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="applied" fill="#4ECDC4" radius={[8, 8, 0, 0]} name="Applied" />
                    <Bar dataKey="shortlisted" fill="#45B7D1" radius={[8, 8, 0, 0]} name="Shortlisted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
              </div>

        {/* Circular Progress and Donut Chart Row */}
        <div className="row mb-4">
          {/* Circular Progress Chart - Profile Completion */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-person-check text-primary me-2"></i>
                  Profile Completion
                </h5>
              </div>
              <div className="card-body d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                  <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="20"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="url(#profileGradient)"
                      strokeWidth="20"
                      strokeDasharray={2 * Math.PI * 85}
                      strokeDashoffset={2 * Math.PI * 85 * (1 - profileCompletion / 100)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#98D8C8" />
                        <stop offset="100%" stopColor="#F7DC6F" />
                      </linearGradient>
                    </defs>
                    <text
                      x="100"
                      y="110"
                      textAnchor="middle"
                      fontSize="36"
                      fontWeight="700"
                      fill="#1a1a1a"
                      style={{ transform: 'rotate(90deg)', transformOrigin: '100px 100px' }}
                    >
                      {profileCompletion}%
                    </text>
                  </svg>
                </div>
            </div>
          </div>
        </div>

          {/* Donut Chart - Participation by Category */}
          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-pie-chart-fill text-warning me-2"></i>
                  Participation by Category
                </h5>
                <p className="text-muted small mb-0 mt-1">Your engagement breakdown</p>
              </div>
          <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={participationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {participationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Recommended Mentors, Upcoming Events, Recent Jobs */}
        <div className="row">
          {/* Recommended Alumni Mentors */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-star-fill text-warning me-2"></i>
                  Recommended Mentors
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recommendedMentors.length > 0 ? (
                  recommendedMentors.map(mentorship => (
                    <div key={mentorship._id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <div className="me-3">
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1.2rem'
                          }}>
                            {mentorship.mentor?.name?.charAt(0)?.toUpperCase() || 'M'}
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                            {mentorship.mentor?.name || 'Alumni Mentor'}
                          </h6>
                          <p className="text-muted small mb-1" style={{ fontSize: '0.85rem' }}>
                            {mentorship.title}
                          </p>
                          {mentorship.mentor?.currentPosition && (
                            <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-briefcase me-1"></i>
                              {mentorship.mentor.currentPosition}
                              {mentorship.mentor.company && ` at ${mentorship.mentor.company}`}
                            </p>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              // Extract mentor ID from mentorship
                              let mentorId = null;
                              if (mentorship.mentor?._id) {
                                mentorId = typeof mentorship.mentor._id === 'string' 
                                  ? mentorship.mentor._id 
                                  : mentorship.mentor._id.toString();
                              } else if (mentorship.mentor) {
                                mentorId = typeof mentorship.mentor === 'string' 
                                  ? mentorship.mentor 
                                  : mentorship.mentor.toString();
                              }
                              
                              if (mentorId) {
                                navigate(`/mentor/${mentorId}`);
                              } else {
                                alert('Unable to view mentor profile. Mentor information is missing.');
                              }
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">No mentors available at the moment</p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate('/mentorships')}
                    >
                      Browse All Mentors
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-calendar-check text-success me-2"></i>
                  Upcoming Events
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <div key={event._id} className="mb-3 pb-3 border-bottom">
                      <h6 className="mb-2" style={{ fontWeight: '600', fontSize: '0.95rem' }}>{event.title}</h6>
                      <p className="text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <br />
                        <i className="bi bi-clock me-1"></i>
                        {event.time}
                        <br />
                        <i className="bi bi-geo-alt me-1"></i>
                        {event.location}
                      </p>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => navigate(`/events/${event._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No upcoming events</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Job Postings */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-briefcase-fill text-info me-2"></i>
                  Recent Job Postings
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recentJobs.length > 0 ? (
                  recentJobs.map(job => (
                    <div key={job._id} className="mb-3 pb-3 border-bottom">
                      <h6 className="mb-2" style={{ fontWeight: '600', fontSize: '0.95rem' }}>{job.title}</h6>
                      <p className="text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-building me-1"></i>
                        {job.company}
                        <br />
                        <i className="bi bi-geo-alt me-1"></i>
                        {job.location}
                        <br />
                        <i className="bi bi-tag me-1"></i>
                        {job.type}
                      </p>
                      <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => navigate(`/jobs/${job._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No recent job postings</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards Section */}
        <div className="card shadow-sm mb-4 mt-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-grid-3x3-gap"></i> Quick Navigation
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {/* My Activity */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/my-activity')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-clipboard-data text-primary" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">My Activity</h6>
                    <p className="card-text small text-muted mb-3">View your activity dashboard</p>
                    <button className="btn btn-sm btn-primary">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Student Directory */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/students')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-people text-info" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Student Directory</h6>
                    <p className="card-text small text-muted mb-3">Browse all students</p>
                    <button className="btn btn-sm btn-info text-white">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Alumni Directory */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/alumni')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-person-check text-success" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Alumni Directory</h6>
                    <p className="card-text small text-muted mb-3">Browse all alumni</p>
                    <button className="btn btn-sm btn-success">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Faculty */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/faculty')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-mortarboard text-warning" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Faculty</h6>
                    <p className="card-text small text-muted mb-3">View faculty members</p>
                    <button className="btn btn-sm btn-warning text-white">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Opportunity */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/jobs-directory')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-briefcase text-danger" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Job Opportunity</h6>
                    <p className="card-text small text-muted mb-3">Browse job opportunities</p>
                    <button className="btn btn-sm btn-danger">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Mentorship */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/mentorships-directory')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-person-heart text-primary" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Mentorship</h6>
                    <p className="card-text small text-muted mb-3">Browse mentorship programs</p>
                    <button className="btn btn-sm btn-primary">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* News */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/news')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-newspaper text-secondary" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">News</h6>
                    <p className="card-text small text-muted mb-3">Read latest news</p>
                    <button className="btn btn-sm btn-secondary">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Event */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/events-directory')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-calendar-event text-info" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Event</h6>
                    <p className="card-text small text-muted mb-3">Browse upcoming events</p>
                    <button className="btn btn-sm btn-info text-white">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className="col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 border-0 shadow-sm" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                  onClick={() => navigate('/gallery')}>
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <i className="bi bi-images text-success" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="card-title mb-2">Gallery</h6>
                    <p className="card-text small text-muted mb-3">Browse photo gallery</p>
                    <button className="btn btn-sm btn-success">
                      <i className="bi bi-arrow-right"></i> View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="card shadow-sm mt-4" style={{ 
          borderRadius: '16px', 
          border: 'none',
          background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
          color: 'white'
        }}>
          <div className="card-body text-center p-4">
            <h5 className="mb-3" style={{ fontWeight: '600' }}>
              <i className="bi bi-rocket-takeoff-fill me-2"></i>
              Your Career Journey Starts Here!
            </h5>
            <p className="mb-0" style={{ fontSize: '1.1rem', opacity: 0.95 }}>
              Connect with mentors, explore opportunities, and grow your professional network. 
              Every step you take brings you closer to your dream career. Keep going! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
