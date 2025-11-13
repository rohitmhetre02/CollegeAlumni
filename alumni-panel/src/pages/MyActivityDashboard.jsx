import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

const MyActivityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Activity data for all roles
  const [activityData, setActivityData] = useState({
    metrics: {},
    timeline: [],
    notifications: [],
    charts: {}
  });

  useEffect(() => {
    if (user) {
      fetchActivityData();
    }
  }, [user]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const userId = user.id || user._id;
      
      // Fetch data based on user role
      const [usersRes, jobsRes, eventsRes, mentorshipsRes, newsRes] = await Promise.all([
        api.get('/users'),
        api.get('/jobs'),
        api.get('/events'),
        api.get('/mentorships'),
        api.get('/news').catch(() => ({ data: [] }))
      ]);

      const allUsers = usersRes.data || [];
      const allJobs = jobsRes.data || [];
      const allEvents = eventsRes.data || [];
      const allMentorships = mentorshipsRes.data || [];
      const allNews = newsRes.data || [];

      let metrics = {};
      let timeline = [];
      let notifications = [];
      let charts = {};

      if (user.role === 'admin') {
        metrics = await getAdminMetrics(allUsers, allJobs, allEvents, allMentorships, allNews);
        timeline = await getAdminTimeline(userId, allJobs, allEvents, allUsers, allNews);
        charts = getAdminCharts(allUsers, allJobs, allEvents, allNews);
      } else if (user.role === 'coordinator') {
        metrics = await getCoordinatorMetrics(userId, allUsers, allEvents, allJobs, allMentorships, user.department);
        timeline = await getCoordinatorTimeline(userId, allEvents, allUsers, allJobs, user.department);
        charts = getCoordinatorCharts(allEvents, allUsers, allJobs, user.department);
      } else if (user.role === 'student') {
        metrics = await getStudentMetrics(userId, allJobs, allEvents, allMentorships);
        timeline = await getStudentTimeline(userId, allJobs, allEvents, allMentorships);
        charts = getStudentCharts(allJobs, allEvents, allMentorships, userId);
      } else if (user.role === 'alumni') {
        metrics = await getAlumniMetrics(userId, allJobs, allEvents, allMentorships, allNews);
        timeline = await getAlumniTimeline(userId, allJobs, allEvents, allMentorships);
        charts = getAlumniCharts(allJobs, allEvents, allMentorships, userId);
      }

      setActivityData({ metrics, timeline, notifications, charts });
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Admin Metrics
  const getAdminMetrics = async (users, jobs, events, mentorships, news) => {
    const students = users.filter(u => u.role === 'student');
    const alumni = users.filter(u => u.role === 'alumni');
    const coordinators = users.filter(u => u.role === 'coordinator');
    const pendingAlumni = alumni.filter(u => u.approvalStatus === 'pending');
    
    return {
      totalUsers: users.length,
      totalStudents: students.length,
      totalAlumni: alumni.length,
      totalCoordinators: coordinators.length,
      pendingApprovals: pendingAlumni.length,
      eventsCreated: events.length,
      jobsPosted: jobs.length,
      jobsApproved: jobs.filter(j => j.status === 'approved' || j.status === 'active').length,
      jobsRejected: jobs.filter(j => j.status === 'rejected').length,
      newsPosted: news.length,
      activeUsers: users.filter(u => u.isActive).length,
      mentorshipsActive: mentorships.filter(m => m.status === 'active').length
    };
  };

  // Coordinator Metrics
  const getCoordinatorMetrics = async (userId, users, events, jobs, mentorships, department) => {
    const deptUsers = users.filter(u => u.department === department);
    const deptEvents = events.filter(e => e.department === department || e.organizer?._id === userId || e.organizer === userId);
    const deptJobs = jobs.filter(j => j.department === department);
    
    return {
      alumniConnections: deptUsers.filter(u => u.role === 'alumni').length,
      mentorshipsAssigned: mentorships.filter(m => m.department === department).length,
      eventsOrganized: deptEvents.length,
      jobsVerified: deptJobs.filter(j => j.status === 'approved').length,
      newsShared: 0, // Add if news has department filter
      messagesSent: 0, // Add if messages tracked
      eventParticipants: deptEvents.reduce((sum, e) => sum + (e.attendees?.length || 0), 0),
      pendingVerifications: deptUsers.filter(u => u.role === 'alumni' && u.approvalStatus === 'pending').length
    };
  };

  // Student Metrics
  const getStudentMetrics = async (userId, jobs, events, mentorships) => {
    const userApplications = jobs.flatMap(job => 
      (job.applications || []).filter(app => 
        app.student?._id === userId || app.student === userId
      )
    );
    const registeredEvents = events.filter(event => 
      event.attendees?.some(attendee => 
        attendee.user?._id === userId || attendee.user === userId
      )
    );
    const userMentorships = mentorships.filter(m => 
      m.mentees?.some(mentee => 
        (mentee.student?._id === userId || mentee.student === userId) && mentee.status === 'accepted'
      )
    );

    return {
      jobsApplied: userApplications.length,
      jobsSaved: 0, // Add if saved jobs feature exists
      eventsAttended: registeredEvents.length,
      eventsRegistered: registeredEvents.length,
      mentorshipRequests: mentorships.filter(m => 
        m.mentees?.some(mentee => mentee.student === userId)
      ).length,
      mentorshipsAccepted: userMentorships.length,
      connectionsMade: userMentorships.length,
      achievementsEarned: 0 // Add if achievements tracked
    };
  };

  // Alumni Metrics
  const getAlumniMetrics = async (userId, jobs, events, mentorships, news) => {
    const userJobs = jobs.filter(j => j.postedBy?._id === userId || j.postedBy === userId);
    const userEvents = events.filter(e => e.organizer?._id === userId || e.organizer === userId);
    const userMentorships = mentorships.filter(m => m.mentor?._id === userId || m.mentor === userId);
    const userNews = news.filter(n => n.author?._id === userId || n.author === userId);

    return {
      jobsPosted: userJobs.length,
      mentorshipsOffered: userMentorships.length,
      mentorshipsOngoing: userMentorships.filter(m => m.status === 'active').length,
      eventsCreated: userEvents.length,
      eventsAttended: events.filter(e => 
        e.attendees?.some(a => a.user === userId)
      ).length,
      newsShared: userNews.length,
      connectionsMade: userMentorships.reduce((sum, m) => 
        sum + (m.mentees?.filter(mentee => mentee.status === 'accepted').length || 0), 0),
      menteesGuided: userMentorships.reduce((sum, m) => 
        sum + (m.mentees?.filter(mentee => mentee.status === 'accepted').length || 0), 0),
      sessionsCompleted: 0 // Add if sessions tracked
    };
  };

  // Timeline functions (simplified - would need actual activity tracking)
  const getAdminTimeline = (userId, jobs, events, users, news) => {
    const timeline = [];
    jobs.slice(0, 5).forEach(job => {
      timeline.push({
        id: job._id,
        type: 'job',
        title: `Job ${job.status === 'approved' ? 'Approved' : job.status}: ${job.title}`,
        description: `Posted by ${job.postedBy?.name || 'Unknown'}`,
        date: job.updatedAt || job.createdAt,
        icon: 'bi-briefcase-fill',
        color: job.status === 'approved' ? 'success' : job.status === 'rejected' ? 'danger' : 'warning'
      });
    });
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  const getCoordinatorTimeline = (userId, events, users, jobs, department) => {
    const timeline = [];
    events.filter(e => e.department === department).slice(0, 5).forEach(event => {
      timeline.push({
        id: event._id,
        type: 'event',
        title: `Event: ${event.title}`,
        description: `${event.attendees?.length || 0} attendees`,
        date: event.createdAt,
        icon: 'bi-calendar-event-fill',
        color: 'success'
      });
    });
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  const getStudentTimeline = (userId, jobs, events, mentorships) => {
    const timeline = [];
    jobs.forEach(job => {
      const application = job.applications?.find(app => app.student === userId);
      if (application) {
        timeline.push({
          id: application._id,
          type: 'application',
          title: `Application ${application.status}: ${job.title}`,
          description: `Applied on ${new Date(application.appliedAt || application.createdAt).toLocaleDateString()}`,
          date: application.appliedAt || application.createdAt,
          icon: 'bi-file-earmark-check-fill',
          color: application.status === 'shortlisted' ? 'success' : 'primary'
        });
      }
    });
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  const getAlumniTimeline = (userId, jobs, events, mentorships) => {
    const timeline = [];
    jobs.filter(j => j.postedBy === userId).slice(0, 3).forEach(job => {
      timeline.push({
        id: job._id,
        type: 'job',
        title: `Job Posted: ${job.title}`,
        description: `${job.applications?.length || 0} applications`,
        date: job.createdAt,
        icon: 'bi-briefcase-fill',
        color: 'primary'
      });
    });
    mentorships.filter(m => m.mentor === userId).slice(0, 3).forEach(mentorship => {
      timeline.push({
        id: mentorship._id,
        type: 'mentorship',
        title: `New Mentee: ${mentorship.title}`,
        description: `${mentorship.mentees?.filter(m => m.status === 'accepted').length || 0} active mentees`,
        date: mentorship.createdAt,
        icon: 'bi-people-fill',
        color: 'info'
      });
    });
    return timeline.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  // Chart data functions
  const getAdminCharts = (users, jobs, events, news) => {
    const departmentCounts = {};
    users.forEach(u => {
      departmentCounts[u.department] = (departmentCounts[u.department] || 0) + 1;
    });

    return {
      usersByDepartment: Object.entries(departmentCounts).map(([name, value]) => ({ name, value })),
      jobsByStatus: [
        { name: 'Approved', value: jobs.filter(j => j.status === 'approved' || j.status === 'active').length },
        { name: 'Pending', value: jobs.filter(j => j.status === 'pending').length },
        { name: 'Rejected', value: jobs.filter(j => j.status === 'rejected').length }
      ],
      eventsOverTime: events.slice(-7).map(e => ({
        name: new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        events: 1
      }))
    };
  };

  const getCoordinatorCharts = (events, users, jobs, department) => {
    const deptEvents = events.filter(e => e.department === department);
    const eventsByMonthObj = deptEvents.reduce((acc, e) => {
      const month = new Date(e.date || e.createdAt).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    return {
      eventsByMonth: Object.entries(eventsByMonthObj).map(([name, value]) => ({ name, value })),
      userGrowth: [
        { name: 'Students', value: users.filter(u => u.department === department && u.role === 'student').length },
        { name: 'Alumni', value: users.filter(u => u.department === department && u.role === 'alumni').length }
      ]
    };
  };

  const getStudentCharts = (jobs, events, mentorships, userId) => {
    const userApplications = jobs.flatMap(job => 
      (job.applications || []).filter(app => app.student === userId)
    );
    return {
      applicationStatus: [
        { name: 'Pending', value: userApplications.filter(a => a.status === 'pending').length },
        { name: 'Shortlisted', value: userApplications.filter(a => a.status === 'shortlisted').length },
        { name: 'Rejected', value: userApplications.filter(a => a.status === 'rejected').length }
      ]
    };
  };

  const getAlumniCharts = (jobs, events, mentorships, userId) => {
    const userJobs = jobs.filter(j => j.postedBy === userId);
    const userMentorships = mentorships.filter(m => m.mentor === userId);
    return {
      jobPerformance: userJobs.map(j => ({
        name: j.title.substring(0, 15),
        applications: j.applications?.length || 0
      })),
      mentorshipEngagement: userMentorships.map(m => ({
        name: m.title.substring(0, 15),
        mentees: m.mentees?.filter(mentee => mentee.status === 'accepted').length || 0
      }))
    };
  };

  // Quick Actions based on role
  const getQuickActions = () => {
    if (user.role === 'admin') {
      return [
        { label: 'Post Job', icon: 'bi-briefcase-fill', color: 'primary', action: () => navigate('/admin/jobs') },
        { label: 'Create Event', icon: 'bi-calendar-plus-fill', color: 'success', action: () => navigate('/admin/events') },
        { label: 'Send Broadcast', icon: 'bi-megaphone-fill', color: 'warning', action: () => {} },
        { label: 'View Analytics', icon: 'bi-graph-up-arrow', color: 'info', action: () => {} },
        { label: 'Manage Users', icon: 'bi-people-fill', color: 'secondary', action: () => navigate('/admin/students') },
        { label: 'Approve Alumni', icon: 'bi-person-check-fill', color: 'danger', action: () => navigate('/admin/alumni') }
      ];
    } else if (user.role === 'coordinator') {
      return [
        { label: 'Create Event', icon: 'bi-calendar-plus-fill', color: 'success', action: () => navigate('/coordinator/events') },
        { label: 'View Mentorships', icon: 'bi-person-heart', color: 'info', action: () => navigate('/coordinator/mentorships') },
        { label: 'Send Invites', icon: 'bi-envelope-paper-fill', color: 'primary', action: () => {} },
        { label: 'Verify Alumni', icon: 'bi-shield-check', color: 'warning', action: () => navigate('/coordinator/alumni') },
        { label: 'Match Mentors', icon: 'bi-arrow-left-right', color: 'secondary', action: () => {} }
      ];
    } else if (user.role === 'student') {
      return [
        { label: 'View Jobs', icon: 'bi-briefcase-fill', color: 'primary', action: () => navigate('/jobs') },
        { label: 'Find Mentors', icon: 'bi-person-heart', color: 'info', action: () => navigate('/mentorships') },
        { label: 'View Events', icon: 'bi-calendar-event-fill', color: 'success', action: () => navigate('/events') },
        { label: 'Request Connection', icon: 'bi-person-plus-fill', color: 'warning', action: () => {} },
        { label: 'View Progress', icon: 'bi-graph-up-arrow', color: 'secondary', action: () => {} }
      ];
    } else if (user.role === 'alumni') {
      return [
        { label: 'Post Job', icon: 'bi-briefcase-fill', color: 'primary', action: () => navigate('/jobs') },
        { label: 'Create Event', icon: 'bi-calendar-plus-fill', color: 'success', action: () => navigate('/events') },
        { label: 'Offer Mentorship', icon: 'bi-person-heart', color: 'info', action: () => navigate('/mentorships') },
        { label: 'Share Story', icon: 'bi-journal-text', color: 'warning', action: () => {} },
        { label: 'View Mentees', icon: 'bi-people-fill', color: 'secondary', action: () => navigate('/mentorships') }
      ];
    }
    return [];
  };

  // Render metric cards
  const renderMetricCard = (title, value, icon, color, subtitle = '') => (
    <div className="col-md-6 col-lg-3 mb-4" key={title}>
      <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 className="text-muted mb-1" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                {title}
              </h6>
              <h3 className="mb-0 fw-bold" style={{ color: '#333' }}>
                {value}
              </h3>
              {subtitle && (
                <small className="text-muted">{subtitle}</small>
              )}
            </div>
            <div className={`bg-${color} bg-opacity-10 rounded-circle p-3`} style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`bi ${icon} text-${color}`} style={{ fontSize: '1.5rem' }}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render role-specific content
  const renderRoleContent = () => {
    const { metrics, timeline, charts } = activityData;
    
    if (user.role === 'admin') {
      return (
        <>
          <div className="row mb-4">
            {renderMetricCard('Total Users', metrics.totalUsers || 0, 'bi-people-fill', 'primary')}
            {renderMetricCard('Students', metrics.totalStudents || 0, 'bi-person-fill', 'info')}
            {renderMetricCard('Alumni', metrics.totalAlumni || 0, 'bi-person-check-fill', 'success')}
            {renderMetricCard('Pending Approvals', metrics.pendingApprovals || 0, 'bi-clock-history', 'warning')}
            {renderMetricCard('Events Created', metrics.eventsCreated || 0, 'bi-calendar-event-fill', 'info')}
            {renderMetricCard('Jobs Posted', metrics.jobsPosted || 0, 'bi-briefcase-fill', 'primary')}
            {renderMetricCard('Jobs Approved', metrics.jobsApproved || 0, 'bi-check-circle-fill', 'success')}
            {renderMetricCard('News Posted', metrics.newsPosted || 0, 'bi-newspaper', 'warning')}
          </div>

          {charts.usersByDepartment && charts.usersByDepartment.length > 0 && (
            <div className="row mb-4">
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-3 fw-bold">Users by Department</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={charts.usersByDepartment} cx="50%" cy="50%" labelLine={false} label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                          {charts.usersByDepartment.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-3 fw-bold">Jobs by Status</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.jobsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#667eea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );
    } else if (user.role === 'coordinator') {
      return (
        <>
          <div className="row mb-4">
            {renderMetricCard('Alumni Connections', metrics.alumniConnections || 0, 'bi-person-check-fill', 'success')}
            {renderMetricCard('Mentorships Assigned', metrics.mentorshipsAssigned || 0, 'bi-person-heart', 'info')}
            {renderMetricCard('Events Organized', metrics.eventsOrganized || 0, 'bi-calendar-event-fill', 'primary')}
            {renderMetricCard('Jobs Verified', metrics.jobsVerified || 0, 'bi-shield-check', 'warning')}
            {renderMetricCard('Event Participants', metrics.eventParticipants || 0, 'bi-people-fill', 'success')}
            {renderMetricCard('Pending Verifications', metrics.pendingVerifications || 0, 'bi-clock-history', 'danger')}
          </div>
        </>
      );
    } else if (user.role === 'student') {
      return (
        <>
          <div className="row mb-4">
            {renderMetricCard('Jobs Applied', metrics.jobsApplied || 0, 'bi-briefcase-fill', 'primary')}
            {renderMetricCard('Events Attended', metrics.eventsAttended || 0, 'bi-calendar-event-fill', 'success')}
            {renderMetricCard('Mentorship Requests', metrics.mentorshipRequests || 0, 'bi-person-heart', 'info')}
            {renderMetricCard('Connections Made', metrics.connectionsMade || 0, 'bi-people-fill', 'warning')}
          </div>

          {charts.applicationStatus && charts.applicationStatus.length > 0 && (
            <div className="row mb-4">
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-3 fw-bold">Application Status</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={charts.applicationStatus} cx="50%" cy="50%" labelLine={false} label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                          {charts.applicationStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );
    } else if (user.role === 'alumni') {
      return (
        <>
          <div className="row mb-4">
            {renderMetricCard('Jobs Posted', metrics.jobsPosted || 0, 'bi-briefcase-fill', 'primary')}
            {renderMetricCard('Mentorships Offered', metrics.mentorshipsOffered || 0, 'bi-person-heart', 'info')}
            {renderMetricCard('Events Created', metrics.eventsCreated || 0, 'bi-calendar-event-fill', 'success')}
            {renderMetricCard('Mentees Guided', metrics.menteesGuided || 0, 'bi-people-fill', 'warning')}
            {renderMetricCard('Connections Made', metrics.connectionsMade || 0, 'bi-person-plus-fill', 'info')}
            {renderMetricCard('News Shared', metrics.newsShared || 0, 'bi-newspaper', 'secondary')}
          </div>

          {charts.jobPerformance && charts.jobPerformance.length > 0 && (
            <div className="row mb-4">
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-3 fw-bold">Job Performance</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.jobPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="applications" fill="#667eea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-3 fw-bold">Mentorship Engagement</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={charts.mentorshipEngagement}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="mentees" fill="#764ba2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );
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

  const quickActions = getQuickActions();
  const { timeline } = activityData;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 fw-bold">
            <i className="bi bi-clipboard-data me-2"></i> My Activity Dashboard
          </h2>
          <div className="badge bg-primary p-2" style={{ fontSize: '0.9rem' }}>
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body p-4">
            <h5 className="mb-3 fw-bold">Quick Actions</h5>
            <div className="d-flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className={`btn btn-${action.color}`}
                  onClick={action.action}
                  style={{ borderRadius: '20px', padding: '8px 20px' }}
                >
                  <i className={`bi ${action.icon} me-2`}></i>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics and Charts */}
        <div className="mb-4">
          {renderRoleContent()}
        </div>

        {/* Activity Timeline */}
        <div className="row">
          <div className="col-md-8 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="mb-3 fw-bold">Recent Activity Timeline</h5>
                {timeline.length > 0 ? (
                  <div className="timeline">
                    {timeline.map((activity, idx) => (
                      <div key={activity.id || idx} className="d-flex mb-3 pb-3 border-bottom">
                        <div className={`bg-${activity.color} bg-opacity-10 rounded-circle p-2 me-3`} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`bi ${activity.icon} text-${activity.color}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold">{activity.title}</div>
                          <div className="text-muted small">{activity.description}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(activity.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-inbox" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                    <p className="mt-3">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="mb-3 fw-bold">Notifications</h5>
                <div className="text-center text-muted py-4">
                  <i className="bi bi-bell" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                  <p className="mt-2 small">No new notifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyActivityDashboard;

