import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const MyActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalCoordinators: 0,
    pendingApprovals: 0,
    eventsCreated: 0,
    jobsPosted: 0,
    jobsApproved: 0,
    jobsRejected: 0,
    newsPosted: 0,
    activeUsers: 0,
    mentorshipsActive: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentNews, setRecentNews] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [activitiesRes, usersRes, jobsRes, eventsRes, mentorshipsRes, newsRes] = await Promise.all([
        api.get('/activities/mine').catch(() => ({ data: [] })),
        api.get('/users'),
        api.get('/jobs'),
        api.get('/events'),
        api.get('/mentorships'),
        api.get('/news').catch(() => ({ data: [] }))
      ]);

      const allActivities = activitiesRes.data || [];
      const allUsers = usersRes.data || [];
      const allJobs = jobsRes.data || [];
      const allEvents = eventsRes.data || [];
      const allMentorships = mentorshipsRes.data || [];
      const allNews = newsRes.data || [];

      // Set activities
      setActivities(allActivities);

      // Calculate metrics
      const students = allUsers.filter(u => u.role === 'student');
      const alumni = allUsers.filter(u => u.role === 'alumni');
      const coordinators = allUsers.filter(u => u.role === 'coordinator');
      const pendingAlumni = alumni.filter(u => u.approvalStatus === 'pending');

      setMetrics({
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalAlumni: alumni.length,
        totalCoordinators: coordinators.length,
        pendingApprovals: pendingAlumni.length,
        eventsCreated: allEvents.length,
        jobsPosted: allJobs.length,
        jobsApproved: allJobs.filter(j => j.status === 'approved' || j.status === 'active').length,
        jobsRejected: allJobs.filter(j => j.status === 'rejected').length,
        newsPosted: allNews.length,
        activeUsers: allUsers.filter(u => u.isActive !== false).length,
        mentorshipsActive: allMentorships.filter(m => m.status === 'active').length
      });

      // Set recent items
      setRecentJobs(allJobs.slice(0, 5));
      setRecentEvents(allEvents.slice(0, 5));
      setRecentNews(allNews.slice(0, 5));
      setRecentUsers(allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      job_post: 'bi-briefcase-fill',
      event_create: 'bi-calendar-event-fill',
      news_post: 'bi-newspaper',
      mentorship_create: 'bi-people-fill',
      job_apply: 'bi-file-earmark-check-fill',
      event_register: 'bi-calendar-check-fill',
      profile_update: 'bi-person-check-fill',
      other: 'bi-activity',
      job: 'bi-briefcase-fill',
      event: 'bi-calendar-event-fill',
      news: 'bi-newspaper',
      faculty: 'bi-mortarboard-fill',
      student: 'bi-person-fill',
      alumni: 'bi-person-check-fill'
    };
    return icons[type] || 'bi-activity';
  };

  const getActivityColor = (type) => {
    const colors = {
      job_post: 'primary',
      event_create: 'success',
      news_post: 'warning',
      mentorship_create: 'info',
      job_apply: 'primary',
      event_register: 'success',
      profile_update: 'secondary',
      other: 'dark',
      job: 'primary',
      event: 'success',
      news: 'warning',
      faculty: 'info',
      student: 'secondary',
      alumni: 'danger'
    };
    return colors[type] || 'dark';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <p className="mt-3">Loading activity data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="fw-bold mb-0">
              <i className="bi bi-clipboard-data me-2"></i>My Activity Dashboard
            </h2>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i>Back
            </button>
          </div>

          {/* Top Metrics Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Users</h6>
                      <h3 className="fw-bold mb-0">{metrics.totalUsers}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-people-fill text-primary fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-check-circle-fill text-success me-1"></i>
                      {metrics.activeUsers} Active
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Jobs</h6>
                      <h3 className="fw-bold mb-0">{metrics.jobsPosted}</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-briefcase-fill text-success fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-check-circle-fill text-success me-1"></i>
                      {metrics.jobsApproved} Approved
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Total Events</h6>
                      <h3 className="fw-bold mb-0">{metrics.eventsCreated}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-calendar-event-fill text-info fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-calendar-check-fill text-info me-1"></i>
                      All Events
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-2">Pending Approvals</h6>
                      <h3 className="fw-bold mb-0 text-warning">{metrics.pendingApprovals}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-clock-history text-warning fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                      Needs Review
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Breakdown Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-person-fill text-primary fs-3"></i>
                  </div>
                  <h3 className="fw-bold mb-1">{metrics.totalStudents}</h3>
                  <p className="text-muted mb-0">Total Students</p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-person-check-fill text-success fs-3"></i>
                  </div>
                  <h3 className="fw-bold mb-1">{metrics.totalAlumni}</h3>
                  <p className="text-muted mb-0">Total Alumni</p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-mortarboard-fill text-info fs-3"></i>
                  </div>
                  <h3 className="fw-bold mb-1">{metrics.totalCoordinators}</h3>
                  <p className="text-muted mb-0">Total Coordinators</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-newspaper text-warning fs-4"></i>
                  </div>
                  <h4 className="fw-bold mb-1">{metrics.newsPosted}</h4>
                  <p className="text-muted mb-0 small">News Posts</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-x-circle-fill text-danger fs-4"></i>
                  </div>
                  <h4 className="fw-bold mb-1">{metrics.jobsRejected}</h4>
                  <p className="text-muted mb-0 small">Jobs Rejected</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-secondary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-people-fill text-secondary fs-4"></i>
                  </div>
                  <h4 className="fw-bold mb-1">{metrics.mentorshipsActive}</h4>
                  <p className="text-muted mb-0 small">Active Mentorships</p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="bi bi-check-circle-fill text-primary fs-4"></i>
                  </div>
                  <h4 className="fw-bold mb-1">{metrics.jobsApproved}</h4>
                  <p className="text-muted mb-0 small">Jobs Approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline Section */}
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white border-0 pt-4 pb-2">
                  <h5 className="mb-0">
                    <i className="bi bi-clock-history me-2"></i>Activity Timeline
                  </h5>
                </div>
                <div className="card-body">
                  {activities.length > 0 ? (
                    <div className="timeline">
                      {activities.map((activity, index) => (
                        <div key={activity._id || index} className="d-flex mb-4 pb-3 border-bottom">
                          <div className={`bg-${getActivityColor(activity.type)} bg-opacity-10 rounded-circle p-3 me-3`} 
                            style={{ width: '50px', height: '50px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`bi ${getActivityIcon(activity.type)} text-${getActivityColor(activity.type)} fs-5`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{activity.title}</h6>
                            {activity.description && (
                              <p className="text-muted mb-2 small">{activity.description}</p>
                            )}
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>
                                {formatDate(activity.createdAt)}
                              </small>
                              <span className={`badge bg-${getActivityColor(activity.type)}`}>
                                {activity.type?.replace('_', ' ') || 'Activity'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-activity fs-1"></i>
                      <p className="mt-3">No activities found. Start managing the portal to see your activity timeline.</p>
                      <div className="mt-3">
                        <button className="btn btn-primary btn-sm me-2" onClick={() => navigate('/admin/jobs')}>
                          <i className="bi bi-briefcase me-1"></i>Post a Job
                        </button>
                        <button className="btn btn-success btn-sm me-2" onClick={() => navigate('/admin/events')}>
                          <i className="bi bi-calendar-event me-1"></i>Create Event
                        </button>
                        <button className="btn btn-warning btn-sm" onClick={() => navigate('/admin/news')}>
                          <i className="bi bi-newspaper me-1"></i>Post News
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Items Grid */}
          <div className="row g-4">
            {/* Recent Jobs */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-briefcase-fill me-2"></i>Recent Jobs
                  </h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/admin/jobs')}>
                    View All <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
                <div className="card-body">
                  {recentJobs.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {recentJobs.map((job) => (
                        <div key={job._id} className="list-group-item border-0 px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{job.title}</h6>
                              <small className="text-muted d-block mb-1">
                                <i className="bi bi-building me-1"></i>{job.company}
                              </small>
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>{formatDate(job.createdAt)}
                              </small>
                            </div>
                            <span className={`badge bg-${job.status === 'approved' || job.status === 'active' ? 'success' : job.status === 'rejected' ? 'danger' : 'warning'}`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-briefcase fs-3"></i>
                      <p className="mt-2 mb-0">No jobs found</p>
                      <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate('/admin/jobs')}>
                        Post a Job
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-event-fill me-2"></i>Recent Events
                  </h5>
                  <button className="btn btn-sm btn-outline-success" onClick={() => navigate('/admin/events')}>
                    View All <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
                <div className="card-body">
                  {recentEvents.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {recentEvents.map((event) => (
                        <div key={event._id} className="list-group-item border-0 px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{event.title}</h6>
                              <small className="text-muted d-block mb-1">
                                <i className="bi bi-calendar me-1"></i>
                                {new Date(event.date).toLocaleDateString()}
                              </small>
                              <small className="text-muted">
                                <i className="bi bi-geo-alt me-1"></i>{event.location}
                              </small>
                            </div>
                            <span className="badge bg-info">
                              {event.attendees?.length || 0} <i className="bi bi-people ms-1"></i>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-calendar fs-3"></i>
                      <p className="mt-2 mb-0">No events found</p>
                      <button className="btn btn-success btn-sm mt-3" onClick={() => navigate('/admin/events')}>
                        Create Event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent News */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-newspaper me-2"></i>Recent News
                  </h5>
                  <button className="btn btn-sm btn-outline-warning" onClick={() => navigate('/admin/news')}>
                    View All <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
                <div className="card-body">
                  {recentNews.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {recentNews.map((news) => (
                        <div key={news._id} className="list-group-item border-0 px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{news.title}</h6>
                              {news.summary && (
                                <p className="text-muted small mb-2">{news.summary.substring(0, 80)}...</p>
                              )}
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>{formatDate(news.createdAt)}
                              </small>
                            </div>
                            <span className="badge bg-warning">
                              <i className="bi bi-newspaper me-1"></i>News
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-newspaper fs-3"></i>
                      <p className="mt-2 mb-0">No news found</p>
                      <button className="btn btn-warning btn-sm mt-3" onClick={() => navigate('/admin/news')}>
                        Post News
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-people-fill me-2"></i>Recent Users
                  </h5>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/admin/students')}>
                    View All <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
                <div className="card-body">
                  {recentUsers.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {recentUsers.map((user) => (
                        <div key={user._id} className="list-group-item border-0 px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{user.name}</h6>
                              <small className="text-muted d-block mb-1">
                                <i className="bi bi-envelope me-1"></i>{user.email}
                              </small>
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>{formatDate(user.createdAt)}
                              </small>
                            </div>
                            <span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'coordinator' ? 'info' : user.role === 'student' ? 'primary' : 'success'}`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-people fs-3"></i>
                      <p className="mt-2 mb-0">No users found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyActivity;
