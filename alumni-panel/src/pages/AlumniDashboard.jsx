import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B267'];

const AlumniDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState({
    jobsPosted: 0,
    eventsCreated: 0,
    mentorshipsCreated: 0,
    menteesSupported: 0,
    avgMentorRating: 0,
    totalApplications: 0,
    totalEventReach: 0
  });
  const [jobApplicationsTrend, setJobApplicationsTrend] = useState([]);
  const [eventAttendanceTrend, setEventAttendanceTrend] = useState([]);
  const [mentorshipEngagementTrend, setMentorshipEngagementTrend] = useState([]);
  const [contributionDistribution, setContributionDistribution] = useState([]);
  const [recentHighlights, setRecentHighlights] = useState([]);
  const [coordinator, setCoordinator] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showApprovalSuccessModal, setShowApprovalSuccessModal] = useState(false);
  const [approvalCoordinator, setApprovalCoordinator] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isMentor, setIsMentor] = useState(false);
  const [myMentorship, setMyMentorship] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    calculateProfileCompletion();
    if (user?.role === 'alumni') {
      checkIfMentor();
    }
  }, [user]);

  const checkIfMentor = async () => {
    if (user?.role === 'alumni') {
      try {
        const response = await api.get('/mentorships');
        const userMentorships = (response.data || []).filter(m => 
          m.mentor?._id === user?.id || m.mentor === user?.id || 
          (m.mentor?._id && m.mentor._id.toString() === user?.id?.toString()) ||
          (typeof m.mentor === 'string' && m.mentor === user?.id?.toString())
        );
        setIsMentor(userMentorships.length > 0);
        if (userMentorships.length > 0) {
          setMyMentorship(userMentorships[0]);
        }
      } catch (error) {
        console.error('Error checking mentor status:', error);
        setIsMentor(false);
      }
    }
  };

  const handleManageMentorProfile = () => {
    if (myMentorship && user) {
      let mentorId;
      if (myMentorship.mentor) {
        if (typeof myMentorship.mentor === 'object' && myMentorship.mentor._id) {
          mentorId = typeof myMentorship.mentor._id === 'string' ? myMentorship.mentor._id : myMentorship.mentor._id.toString();
        } else if (typeof myMentorship.mentor === 'string') {
          mentorId = myMentorship.mentor;
        } else {
          mentorId = user.id || user._id;
        }
      } else {
        mentorId = user.id || user._id;
      }
      navigate(`/mentor/${mentorId}`);
    }
  };

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
        } else {
          setShowApprovalModal(false);
        }
        // Always hide approval success modal if pending/rejected
        setShowApprovalSuccessModal(false);
        // Fetch coordinator if department exists and not already fetched
        if (user?.department && !coordinator) {
          fetchCoordinator();
        }
      } else if (user?.approvalStatus === 'approved') {
        // Only hide when approved
        setShowApprovalModal(false);
        
        // ALWAYS check localStorage first and set modal to false if already seen
        const hasSeenSuccessPopup = localStorage.getItem(`approvalSuccessPopupSeen_${user.id}`);
        if (hasSeenSuccessPopup) {
          // Already seen - don't show again
          setShowApprovalSuccessModal(false);
        } else {
          // Not seen yet - show approval success modal if coordinator info is available
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
    }, 30000); // Check every 30 seconds

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

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, eventsRes, mentorshipsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/events'),
        api.get('/mentorships')
      ]);

      const allJobs = jobsRes.data || [];
      const allEvents = eventsRes.data || [];
      const allMentorships = mentorshipsRes.data || [];
      const userId = user?.id || user?._id;

      const userJobs = allJobs.filter(job =>
        job.postedBy?._id === userId ||
        job.postedBy === userId ||
        (job.postedBy?._id && job.postedBy._id.toString() === userId?.toString())
      );
      const userEvents = allEvents.filter(event =>
        event.organizer?._id === userId ||
        event.organizer === userId ||
        (event.organizer?._id && event.organizer._id.toString() === userId?.toString())
      );
      const userMentorships = allMentorships.filter(mentorship =>
        mentorship.mentor?._id === userId ||
        mentorship.mentor === userId ||
        (mentorship.mentor?._id && mentorship.mentor._id.toString() === userId?.toString())
      );

      const totalApplications = userJobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
      const totalEventReach = userEvents.reduce((sum, event) => sum + (event.attendees?.length || 0), 0);

      const menteesSupportedSet = new Set();
      userMentorships.forEach(mentorship => {
        mentorship.mentees?.forEach(mentee => {
          if (mentee.status === 'accepted') {
            if (mentee.student?._id) {
              menteesSupportedSet.add(typeof mentee.student._id === 'string' ? mentee.student._id : mentee.student._id.toString());
            } else if (mentee.student) {
              menteesSupportedSet.add(typeof mentee.student === 'string' ? mentee.student : mentee.student.toString());
            }
          }
        });
      });
      const menteesSupported = menteesSupportedSet.size;

      const ratingValues = [];
      userMentorships.forEach(mentorship => {
        if (mentorship.reviews && mentorship.reviews.length > 0) {
          mentorship.reviews.forEach(review => {
            if (review.rating) ratingValues.push(review.rating);
          });
        } else if (mentorship.rating) {
          ratingValues.push(mentorship.rating);
        }
      });
      const avgMentorRating = ratingValues.length > 0
        ? parseFloat((ratingValues.reduce((acc, r) => acc + r, 0) / ratingValues.length).toFixed(1))
        : 0;

      setStatistics({
        jobsPosted: userJobs.length,
        eventsCreated: userEvents.length,
        mentorshipsCreated: userMentorships.length,
        menteesSupported,
        avgMentorRating,
        totalApplications,
        totalEventReach
      });

      setJobApplicationsTrend(generateJobApplicationsTrend(userJobs));
      setEventAttendanceTrend(generateEventAttendanceTrend(userEvents));
      setMentorshipEngagementTrend(generateMentorshipEngagementTrend(userMentorships));

      const distribution = [
        { name: 'Job Postings', value: userJobs.length },
        { name: 'Event Hosting', value: userEvents.length },
        { name: 'Mentorship Programs', value: userMentorships.length },
        { name: 'Mentees Guided', value: menteesSupported }
      ];
      const distributionTotal = distribution.reduce((sum, item) => sum + item.value, 0);
      setContributionDistribution(distributionTotal > 0 ? distribution : []);

      setRecentHighlights(buildRecentHighlights(userJobs, userEvents, userMentorships));
    } catch (error) {
      console.error('Error fetching alumni dashboard data:', error);
      setStatistics({
        jobsPosted: 0,
        eventsCreated: 0,
        mentorshipsCreated: 0,
        menteesSupported: 0,
        avgMentorRating: 0,
        totalApplications: 0,
        totalEventReach: 0
      });
      setJobApplicationsTrend([]);
      setEventAttendanceTrend([]);
      setMentorshipEngagementTrend([]);
      setContributionDistribution([]);
      setRecentHighlights([]);
    }
  };

  const generateJobApplicationsTrend = (jobs) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

      let applications = 0;
      let shortlisted = 0;

      jobs.forEach(job => {
        (job.applications || []).forEach(app => {
          const appDate = new Date(app.appliedAt || job.createdAt);
          if (appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear()) {
            applications++;
            if (['shortlisted', 'hired', 'accepted'].includes(app.status)) {
              shortlisted++;
            }
          }
        });
      });

      data.push({ month: monthKey, applications, shortlisted });
    }

    return data;
  };

  const generateEventAttendanceTrend = (events) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

      let attendees = 0;

      events.forEach(event => {
        const eventDate = new Date(event.date || event.createdAt);
        if (eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear()) {
          attendees += event.attendees?.length || 0;
        }
      });

      data.push({ month: monthKey, attendees });
    }

    return data;
  };

  const generateMentorshipEngagementTrend = (mentorships) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

      let acceptedMentees = 0;
      let sessions = 0;

      mentorships.forEach(mentorship => {
        mentorship.mentees?.forEach(mentee => {
          const engagementDate = new Date(mentee.requestedAt || mentorship.createdAt);
          if (engagementDate.getMonth() === date.getMonth() && engagementDate.getFullYear() === date.getFullYear()) {
            if (mentee.status === 'accepted') {
              acceptedMentees++;
              const daysActive = Math.max(1, Math.floor((currentDate - engagementDate) / (1000 * 60 * 60 * 24)));
              sessions += Math.min(8, Math.ceil(daysActive / 7));
            }
          }
        });
      });

      data.push({ month: monthKey, acceptedMentees, sessions });
    }

    return data;
  };

  const buildRecentHighlights = (jobs, events, mentorships) => {
    const highlights = [];

    jobs
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5)
      .forEach(job => {
        highlights.push({
          id: job._id,
          type: 'job',
          title: job.title,
          description: `${job.applications?.length || 0} applications`,
          date: job.createdAt || job.date,
          metrics: {
            applications: job.applications?.length || 0,
            shortlisted: job.applications?.filter(app => ['shortlisted', 'hired', 'accepted'].includes(app.status)).length || 0
          }
        });
      });

    events
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .forEach(event => {
        highlights.push({
          id: event._id,
          type: 'event',
          title: event.title,
          description: `${event.attendees?.length || 0} attendees`,
          date: event.date || event.createdAt,
          metrics: {
            attendees: event.attendees?.length || 0,
            location: event.location
          }
        });
      });

    mentorships
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .forEach(mentorship => {
        const acceptedMentees = mentorship.mentees?.filter(mentee => mentee.status === 'accepted').length || 0;
        highlights.push({
          id: mentorship._id,
          type: 'mentorship',
          title: mentorship.title,
          description: `${acceptedMentees} mentees supported`,
          date: mentorship.createdAt,
          metrics: {
            rating: mentorship.rating || 0,
            acceptedMentees
          }
        });
      });

    return highlights
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
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

        {/* My Mentor Profile Card - Show if alumni is a mentor */}
        {isMentor && myMentorship && user?.role === 'alumni' && (
          <div className="card shadow-lg mb-4" style={{ 
            border: '3px solid #007bff', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            overflow: 'hidden'
          }}>
            <div className="card-body p-4 text-white">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img 
                      src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Mentor')}&size=100&background=fff&color=667eea`}
                      alt={user.name}
                      className="rounded-circle"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', border: '3px solid white' }}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Mentor')}&size=100&background=fff&color=667eea`;
                      }}
                    />
                    <div className="flex-grow-1">
                      <h4 className="mb-1 text-white" style={{ fontWeight: '700' }}>{user.name}</h4>
                      {user.currentPosition && (
                        <p className="mb-1 opacity-75" style={{ fontSize: '14px' }}>
                          {user.currentPosition}
                          {user.company && ` @ ${user.company}`}
                        </p>
                      )}
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
                <div className="col-md-4">
                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-light btn-lg"
                      onClick={() => navigate('/profile')}
                      style={{ borderRadius: '20px', padding: '10px 20px', fontWeight: '600' }}
                    >
                      <i className="bi bi-person-circle me-2"></i>Manage Profile
                    </button>
                    <button
                      className="btn btn-outline-light btn-lg"
                      onClick={handleManageMentorProfile}
                      style={{ borderRadius: '20px', padding: '10px 20px', fontWeight: '600', borderWidth: '2px' }}
                    >
                      <i className="bi bi-gear-fill me-2"></i>Manage Mentor Profile
                    </button>
                  </div>
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
        
        <div className="row mb-4 g-3">
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100" style={{ borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-briefcase-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                <h2 style={{ fontWeight: '700' }}>{statistics.jobsPosted}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Jobs Posted</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100" style={{ borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-calendar-event-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                <h2 style={{ fontWeight: '700' }}>{statistics.eventsCreated}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Events Hosted</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100" style={{ borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #45B7D1 0%, #96C93D 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                <h2 style={{ fontWeight: '700' }}>{statistics.mentorshipsCreated}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Mentorship Programs</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100" style={{ borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg, #FFA07A 0%, #FF6B9D 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-hand-thumbs-up-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                <h2 style={{ fontWeight: '700' }}>{statistics.menteesSupported}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Mentees Supported</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4 g-3">
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-bar-chart-fill text-primary d-block mb-2" style={{ fontSize: '2.3rem' }}></i>
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{statistics.totalApplications}</h3>
                <p className="text-muted mb-0">Job Applications Received</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people text-success d-block mb-2" style={{ fontSize: '2.3rem' }}></i>
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{statistics.totalEventReach}</h3>
                <p className="text-muted mb-0">Event Attendees Engaged</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-star-fill text-warning d-block mb-2" style={{ fontSize: '2.3rem' }}></i>
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{statistics.avgMentorRating.toFixed(1)}</h3>
                <p className="text-muted mb-0">Average Mentor Rating</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-7 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-graph-up-arrow text-primary me-2"></i>
                  Job Applications Trend
                </h5>
                <p className="text-muted small mb-0 mt-1">Applications vs shortlisted candidates</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jobApplicationsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="applications" fill="#4ECDC4" radius={[8, 8, 0, 0]} name="Applications" />
                    <Bar dataKey="shortlisted" fill="#45B7D1" radius={[8, 8, 0, 0]} name="Shortlisted / Hired" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-5 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-people-fill text-success me-2"></i>
                  Event Attendance Growth
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eventAttendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="attendees" stroke="#FF6B6B" strokeWidth={3} dot={{ r: 6, fill: '#FF6B6B' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-7 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-person-hearts text-info me-2"></i>
                  Mentorship Engagement
                </h5>
                <p className="text-muted small mb-0 mt-1">Accepted mentees and sessions (est.)</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mentorshipEngagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="acceptedMentees" fill="#FFA07A" radius={[8, 8, 0, 0]} name="Accepted mentees" />
                    <Bar dataKey="sessions" fill="#98D8C8" radius={[8, 8, 0, 0]} name="Sessions (est.)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-5 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-pie-chart-fill text-warning me-2"></i>
                  Contribution Mix
                </h5>
              </div>
              <div className="card-body">
                {contributionDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contributionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {contributionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted text-center py-5">Contribute jobs, events, or mentorships to populate analytics.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-lightning-fill text-primary me-2"></i>
                  Recent Highlights
                </h5>
                <p className="text-muted small mb-0 mt-1">Your latest job, event, and mentorship impact</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {recentHighlights.length > 0 ? (
                    recentHighlights.map(item => (
                      <div key={item.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '14px' }}>
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <span className="badge bg-primary-subtle text-primary text-uppercase" style={{ fontWeight: '600' }}>
                                {item.type}
                              </span>
                              <small className="text-muted">
                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </small>
                            </div>
                            <h6 className="mb-2" style={{ fontWeight: '600', fontSize: '1rem' }}>{item.title}</h6>
                            <p className="text-muted small mb-3" style={{ fontSize: '0.85rem' }}>{item.description}</p>
                            {item.type === 'job' && (
                              <div className="d-flex justify-content-between text-muted small">
                                <span><i className="bi bi-people-fill me-1"></i>{item.metrics.applications} applicants</span>
                                <span><i className="bi bi-award-fill me-1"></i>{item.metrics.shortlisted} shortlisted</span>
                              </div>
                            )}
                            {item.type === 'event' && (
                              <div className="d-flex justify-content-between text-muted small">
                                <span><i className="bi bi-people me-1"></i>{item.metrics.attendees} attendees</span>
                                {item.metrics.location && <span><i className="bi bi-geo-alt me-1"></i>{item.metrics.location}</span>}
                              </div>
                            )}
                            {item.type === 'mentorship' && (
                              <div className="d-flex justify-content-between text-muted small">
                                <span><i className="bi bi-person-hearts me-1"></i>{item.metrics.acceptedMentees} mentees</span>
                                <span><i className="bi bi-star-fill me-1"></i>{item.metrics.rating?.toFixed(1) || '0.0'} rating</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <p className="text-muted text-center py-5 mb-0">Publish a job, host an event, or launch a mentorship to see highlights here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards Section */}
        <div className="card shadow-sm mb-4">
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

        <div className="card shadow-sm">
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
