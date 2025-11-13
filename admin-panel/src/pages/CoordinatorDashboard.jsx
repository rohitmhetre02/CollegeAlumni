import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [departmentSummary, setDepartmentSummary] = useState({
    users: 0,
    jobs: 0,
    events: 0,
    mentorships: 0
  });

  const [analyticsStats, setAnalyticsStats] = useState({
    activeEvents: 0,
    ongoingMentorships: 0,
    pendingApprovals: 0,
    totalFeedback: 0
  });

  const [eventParticipationData, setEventParticipationData] = useState([]);
  const [mentorshipProgressData, setMentorshipProgressData] = useState([]);
  const [approvalStatusData, setApprovalStatusData] = useState([]);
  const [feedbackRatingsData, setFeedbackRatingsData] = useState([]);
  const [recentEventFeedback, setRecentEventFeedback] = useState([]);
  const [topPerformingDepartments, setTopPerformingDepartments] = useState([]);
  const [newRequests, setNewRequests] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
      fetchPendingApprovals();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const department = user?.department;
      const [usersRes, eventsRes, mentorshipsRes, jobsRes, departmentsRes] = await Promise.all([
        api.get('/users'),
        api.get('/events'),
        api.get('/mentorships'),
        api.get('/jobs'),
        api.get('/departments')
      ]);

      const allUsers = usersRes.data || [];
      const allEvents = eventsRes.data || [];
      const allMentorships = mentorshipsRes.data || [];
      const allJobs = jobsRes.data || [];
      const allDepartments = Array.isArray(departmentsRes.data) && departmentsRes.data.length > 0
        ? departmentsRes.data
        : Array.from(new Set(allUsers.map(u => u.department).filter(Boolean)));

      const filteredUsers = department ? allUsers.filter(u => u.department === department) : allUsers;
      const filteredEvents = department ? allEvents.filter(e => e.department === department) : allEvents;
      const filteredMentorships = department ? allMentorships.filter(m => m.department === department) : allMentorships;
      const filteredJobs = department ? allJobs.filter(j => j.department === department) : allJobs;

      setDepartmentSummary({
        users: filteredUsers.length,
        jobs: filteredJobs.length,
        events: filteredEvents.length,
        mentorships: filteredMentorships.length
      });

      const activeEvents = filteredEvents.filter(e => ['upcoming', 'ongoing'].includes(e.status)).length;
      const ongoingMentorships = filteredMentorships.filter(m => m.status === 'active').length;
      const pendingApprovalsCount = filteredUsers.filter(u => u.approvalStatus === 'pending' && (u.role === 'student' || u.role === 'alumni')).length;
      const totalFeedback = filteredMentorships.reduce((acc, m) => acc + (m.reviews?.length || 0), 0);

      setAnalyticsStats({
        activeEvents,
        ongoingMentorships,
        pendingApprovals: pendingApprovalsCount,
        totalFeedback
      });

      setEventParticipationData(generateEventParticipationData(filteredEvents, allDepartments));
      setMentorshipProgressData(generateMentorshipProgressData(filteredMentorships));
      setApprovalStatusData([
        { name: 'Approved', value: filteredUsers.filter(u => u.approvalStatus === 'approved' && (u.role === 'student' || u.role === 'alumni')).length },
        { name: 'Pending', value: pendingApprovalsCount },
        { name: 'Rejected', value: filteredUsers.filter(u => u.approvalStatus === 'rejected' && (u.role === 'student' || u.role === 'alumni')).length }
      ]);
      setFeedbackRatingsData(generateFeedbackRatingsData(filteredMentorships, filteredEvents, allDepartments, user));

      const feedback = [];
      filteredMentorships.forEach(mentorship => {
        mentorship.reviews?.forEach(review => {
          feedback.push({
            id: review._id || `${mentorship._id}_${review.student?._id || Math.random()}`,
            mentorshipTitle: mentorship.title,
            mentorName: mentorship.mentor?.name || 'Mentor',
            studentName: review.student?.name || 'Student',
            rating: review.rating,
            comment: review.comment,
            date: review.createdAt || mentorship.updatedAt || mentorship.createdAt
          });
        });
      });
      feedback.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentEventFeedback(feedback.slice(0, 6));

      const departmentScores = allDepartments.map(dept => {
        const deptUsers = allUsers.filter(u => u.department === dept && u.approvalStatus === 'approved').length;
        const deptEvents = allEvents.filter(e => e.department === dept).length;
        const deptMentorships = allMentorships.filter(m => m.department === dept).length;
        const deptJobs = allJobs.filter(j => j.department === dept).length;
        return {
          department: dept,
          score: deptEvents * 2 + deptMentorships * 3 + deptJobs * 2 + deptUsers
        };
      }).sort((a, b) => b.score - a.score).slice(0, 5);
      setTopPerformingDepartments(departmentScores);

      const requests = [];
      filteredUsers
        .filter(u => u.approvalStatus === 'pending' && (u.role === 'student' || u.role === 'alumni'))
        .forEach(u => {
          requests.push({
            id: u._id,
            type: 'approval',
            title: `${u.name} · ${u.role}`,
            description: 'Registration pending approval',
            date: u.createdAt || new Date(),
            user: u
          });
        });

      filteredMentorships.forEach(m => {
        m.mentees?.filter(mentee => mentee.status === 'pending').forEach(mentee => {
          requests.push({
            id: `${m._id}_${mentee._id}`,
            type: 'mentorship',
            title: `Mentorship Request: ${m.title}`,
            description: `Awaiting approval`,
            date: mentee.requestedAt || m.createdAt || new Date(),
            mentorship: m,
            mentee
          });
        });
      });

      requests.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNewRequests(requests.slice(0, 8));
    } catch (error) {
      console.error('Error fetching coordinator analytics:', error);
      setDepartmentSummary({
        users: 0,
        jobs: 0,
        events: 0,
        mentorships: 0
      });
      setAnalyticsStats({
        activeEvents: 0,
        ongoingMentorships: 0,
        pendingApprovals: 0,
        totalFeedback: 0
      });
      setEventParticipationData([]);
      setMentorshipProgressData([]);
      setApprovalStatusData([]);
      setFeedbackRatingsData([]);
      setRecentEventFeedback([]);
      setTopPerformingDepartments([]);
      setNewRequests([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const response = await api.get('/users/approvals/pending');
      const department = user?.department;
      const approvals = response.data || [];
      setPendingApprovals(
        department
          ? approvals.filter(p => p.department === department)
          : approvals
      );
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals([]);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleApprove = async (userId, status) => {
    setApproving(true);
    try {
      await api.put(`/users/${userId}/approval`, { approvalStatus: status });
      await Promise.all([fetchPendingApprovals(), fetchAnalyticsData()]);
      alert(`User ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${status} user`);
    } finally {
      setApproving(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      setSelectedUser(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      alert('Failed to fetch user details');
    }
  };

  const generateEventParticipationData = (events, departments) => {
    const participationMap = {};
    events.forEach(event => {
      const dept = event.department || 'Unknown';
      participationMap[dept] = (participationMap[dept] || 0) + (event.attendees?.length || 0);
    });

    return (departments || []).map(dept => ({
      department: dept,
      participation: participationMap[dept] || 0
    })).sort((a, b) => b.participation - a.participation).slice(0, 8);
  };

  const generateMentorshipProgressData = (mentorships) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

      let started = 0;
      let completed = 0;

      mentorships.forEach(mentorship => {
        const createdDate = new Date(mentorship.createdAt);
        if (createdDate.getMonth() === date.getMonth() && createdDate.getFullYear() === date.getFullYear()) {
          started++;
        }
        if (['closed', 'completed'].includes(mentorship.status)) {
          const closedDate = new Date(mentorship.updatedAt || mentorship.createdAt);
          if (closedDate.getMonth() === date.getMonth() && closedDate.getFullYear() === date.getFullYear()) {
            completed++;
          }
        }
      });

      data.push({ month: monthKey, started, completed });
    }

    return data;
  };

  const generateFeedbackRatingsData = (mentorships, events, departments, coordinator) => {
    const ratingsByDept = {};

    mentorships.forEach(m => {
      const dept = m.department || 'Unknown';
      ratingsByDept[dept] = ratingsByDept[dept] || [];
      if (Array.isArray(m.reviews)) {
        m.reviews.forEach(review => {
          if (review.rating && review.rating > 0) {
            ratingsByDept[dept].push(review.rating);
          }
        });
      }
      if ((!m.reviews || m.reviews.length === 0) && m.rating) {
        ratingsByDept[dept].push(m.rating);
      }
    });

    const eventSatisfactionByDept = {};
    events.forEach(event => {
      if (event.feedback && Array.isArray(event.feedback)) {
        const dept = event.department || 'Unknown';
        eventSatisfactionByDept[dept] = eventSatisfactionByDept[dept] || [];
        event.feedback.forEach(f => {
          if (f.rating && f.rating > 0) {
            eventSatisfactionByDept[dept].push(f.rating);
          }
        });
      }
    });

    Object.keys(eventSatisfactionByDept).forEach(dept => {
      ratingsByDept[dept] = ratingsByDept[dept] || [];
      ratingsByDept[dept].push(
        eventSatisfactionByDept[dept].reduce((sum, r) => sum + r, 0) / eventSatisfactionByDept[dept].length
      );
    });

    const avgRatings = Object.keys(ratingsByDept).reduce((acc, dept) => {
      if (ratingsByDept[dept].length > 0) {
        acc[dept] = ratingsByDept[dept].reduce((sum, r) => sum + r, 0) / ratingsByDept[dept].length;
      }
      return acc;
    }, {});

    const topDepts = Object.keys(avgRatings)
      .filter(dept => avgRatings[dept] > 0)
      .sort((a, b) => avgRatings[b] - avgRatings[a])
      .slice(0, 6);

    if (topDepts.length === 0 && coordinator?.department) {
      return [{
        department: coordinator.department.substring(0, 15),
        rating: 4.0,
        fullMark: 5
      }];
    }

    return topDepts.map(dept => ({
      department: dept.length > 15 ? `${dept.substring(0, 12)}...` : dept,
      rating: parseFloat(avgRatings[dept].toFixed(1)),
      fullMark: 5
    }));
  };

  const totalPendingApprovals = useMemo(() => pendingApprovals.length, [pendingApprovals]);

  if (loadingAnalytics) {
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

      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: '#f8f9fa' }}>
        <div className="mb-4">
          <h2 className="mb-2" style={{ fontWeight: '700', color: '#1a1a1a' }}>
            <i className="bi bi-clipboard-data-fill text-primary me-2" />
            Coordinator Intelligence
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Real-time visibility into approvals, mentorships, and departmental engagement
          </p>
        </div>

        <div className="row mb-4 g-3">
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{departmentSummary.users}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Department Users</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-briefcase-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{departmentSummary.jobs}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Live Job Posts</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-calendar-event-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{departmentSummary.events}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Coordinated Events</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{departmentSummary.mentorships}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Mentorship Programs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4 g-3">
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-activity text-primary d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{analyticsStats.activeEvents}</h3>
                <p className="text-muted mb-0">Active Events</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people text-success d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{analyticsStats.ongoingMentorships}</h3>
                <p className="text-muted mb-0">Ongoing Mentorships</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-clock-history text-warning d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{analyticsStats.pendingApprovals}</h3>
                <p className="text-muted mb-0">Pending Approvals</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-star-fill text-info d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{analyticsStats.totalFeedback}</h3>
                <p className="text-muted mb-0">Feedback Entries</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-fill text-primary me-2" />
                  Event Participation by Department
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventParticipationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="participation" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-graph-up text-success me-2" />
                  Mentorship Progress Trend
                </h5>
                <p className="text-muted small mb-0 mt-1">Started vs completed (last 6 months)</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mentorshipProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="started" stroke="#f5576c" strokeWidth={3} dot={{ r: 5 }} name="Started" />
                    <Line type="monotone" dataKey="completed" stroke="#43e97b" strokeWidth={3} dot={{ r: 5 }} name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-pie-chart-fill text-info me-2" />
                  Approval Status Distribution
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={approvalStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      dataKey="value"
                    >
                      {approvalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-radar text-warning me-2" />
                  Experience Satisfaction (Avg Rating)
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={feedbackRatingsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar name="Rating" dataKey="rating" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-chat-left-text text-primary me-2" />
                  Recent Feedback
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {recentEventFeedback.length > 0 ? (
                  recentEventFeedback.map(feedback => (
                    <div key={feedback.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start mb-2">
                        <div className="me-2">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`bi ${i < feedback.rating ? 'bi-star-fill' : 'bi-star'}`}
                              style={{ color: i < feedback.rating ? '#FFC107' : '#ddd', fontSize: '0.9rem' }}
                            />
                          ))}
                        </div>
                        <small className="text-muted ms-auto">
                          {new Date(feedback.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </small>
                      </div>
                      <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: '600' }}>{feedback.mentorshipTitle}</h6>
                      <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                        {feedback.studentName} → {feedback.mentorName}
                      </p>
                      {feedback.comment && (
                        <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                          “{feedback.comment.substring(0, 70)}...”
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No recent feedback</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-trophy-fill text-warning me-2" />
                  Top Performing Departments
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {topPerformingDepartments.length > 0 ? (
                  topPerformingDepartments.map((dept, index) => (
                    <div key={dept.department} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: index === 0
                                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                                : index === 1
                                  ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
                                  : index === 2
                                    ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              marginRight: '12px'
                            }}
                          >
                            {index + 1}
                          </div>
                          <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                            {dept.department}
                          </h6>
                        </div>
                        <span className="badge bg-primary">{dept.score} pts</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No departmental data available</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bell-fill text-danger me-2" />
                  New Requests
                </h5>
                {analyticsStats.pendingApprovals > 0 && (
                  <span className="badge bg-danger">{analyticsStats.pendingApprovals}</span>
                )}
              </div>
              <div className="card-body" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {newRequests.length > 0 ? (
                  newRequests.map(request => (
                    <div key={request.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <div className="me-3">
                          <i
                            className={`bi ${request.type === 'approval' ? 'bi-person-check' : 'bi-people'}`}
                            style={{ fontSize: '1.2rem', color: request.type === 'approval' ? '#4facfe' : '#f5576c' }}
                          />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                            {request.title}
                          </h6>
                          <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                            {request.description}
                          </p>
                          <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-clock me-1" />
                            {new Date(request.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          {request.type === 'approval' && request.user && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/coordinator/students/${request.user._id || request.user.id}`)}
                            >
                              Review
                            </button>
                          )}
                          {request.type === 'mentorship' && request.mentorship && (() => {
                            let mentorId = null;
                            if (request.mentorship.mentor?._id) {
                              mentorId = typeof request.mentorship.mentor._id === 'string'
                                ? request.mentorship.mentor._id
                                : request.mentorship.mentor._id.toString();
                            } else if (request.mentorship.mentor) {
                              mentorId = typeof request.mentorship.mentor === 'string'
                                ? request.mentorship.mentor
                                : request.mentorship.mentor.toString();
                            }

                            return (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => {
                                  if (mentorId) {
                                    navigate(`/coordinator/mentor/${mentorId}`);
                                  } else {
                                    alert('Mentor profile not available for this request.');
                                  }
                                }}
                              >
                                View
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No new requests</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow mb-4" style={{ borderRadius: '16px', borderTop: totalPendingApprovals > 0 ? '4px solid #ffc107' : 'none' }}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-clock-history" /> Pending Registration Approvals
              {totalPendingApprovals > 0 && (
                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                  {totalPendingApprovals} {totalPendingApprovals === 1 ? 'Request' : 'Requests'}
                </span>
              )}
            </h5>
          </div>
          <div className="card-body">
            {loadingApprovals ? (
              <div className="text-center p-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : totalPendingApprovals === 0 ? (
              <div className="alert alert-success mb-0">
                <i className="bi bi-check-circle-fill" /> No pending registration approvals. All users are verified.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map(pendingUser => (
                      <tr key={pendingUser._id}>
                        <td>
                          <strong>{pendingUser.name}</strong>
                          {pendingUser.enrollmentNumber && (
                            <div className="small text-muted">Enrollment: {pendingUser.enrollmentNumber}</div>
                          )}
                        </td>
                        <td>{pendingUser.email}</td>
                        <td>
                          <span className={`badge ${pendingUser.role === 'student' ? 'bg-info' : 'bg-success'}`}>
                            {pendingUser.role}
                          </span>
                        </td>
                        <td>{pendingUser.department}</td>
                        <td>{new Date(pendingUser.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => viewUserDetails(pendingUser._id)}
                              title="View Details"
                            >
                              <i className="bi bi-eye" />
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(pendingUser._id, 'approved')}
                              disabled={approving}
                            >
                              <i className="bi bi-check-circle" /> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleApprove(pendingUser._id, 'rejected')}
                              disabled={approving}
                            >
                              <i className="bi bi-x-circle" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showDetailsModal && selectedUser && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">User Details — {selectedUser.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6"><strong>Name:</strong> {selectedUser.name}</div>
                    <div className="col-md-6"><strong>Email:</strong> {selectedUser.email}</div>
                    <div className="col-md-6"><strong>Role:</strong> {selectedUser.role}</div>
                    <div className="col-md-6"><strong>Department:</strong> {selectedUser.department}</div>
                    {selectedUser.enrollmentNumber && (
                      <div className="col-md-6"><strong>Enrollment Number:</strong> {selectedUser.enrollmentNumber}</div>
                    )}
                    {selectedUser.graduationYear && (
                      <div className="col-md-6"><strong>Graduation Year:</strong> {selectedUser.graduationYear}</div>
                    )}
                    {selectedUser.phone && (
                      <div className="col-md-6"><strong>Phone:</strong> {selectedUser.phone}</div>
                    )}
                    {selectedUser.location && (
                      <div className="col-md-6"><strong>Location:</strong> {selectedUser.location}</div>
                    )}
                    {selectedUser.currentPosition && (
                      <div className="col-md-6"><strong>Current Position:</strong> {selectedUser.currentPosition}</div>
                    )}
                    {selectedUser.company && (
                      <div className="col-md-6"><strong>Company:</strong> {selectedUser.company}</div>
                    )}
                    {selectedUser.skills && selectedUser.skills.length > 0 && (
                      <div className="col-12">
                        <strong>Skills:</strong>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {selectedUser.skills.map((skill, idx) => (
                            <span key={idx} className="badge bg-info">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="col-12">
                      <strong>Registration Date:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                    <div className="col-12">
                      <strong>Approval Status:</strong>
                      <span
                        className={`badge ms-2 ${
                          selectedUser.approvalStatus === 'pending' ? 'bg-warning' :
                          selectedUser.approvalStatus === 'approved' ? 'bg-success' : 'bg-danger'
                        }`}
                      >
                        {selectedUser.approvalStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      handleApprove(selectedUser._id, 'approved');
                      setShowDetailsModal(false);
                    }}
                    disabled={approving}
                  >
                    <i className="bi bi-check-circle" /> Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleApprove(selectedUser._id, 'rejected');
                      setShowDetailsModal(false);
                    }}
                    disabled={approving}
                  >
                    <i className="bi bi-x-circle" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-grid-3x3-gap" /> Quick Navigation
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[
                { icon: 'bi-clipboard-data', color: 'text-primary', label: 'My Activity', path: '/coordinator/my-activity', description: 'Track departmental actions' },
                { icon: 'bi-people', color: 'text-info', label: 'Student Directory', path: '/coordinator/students', description: 'Browse all students' },
                { icon: 'bi-person-check', color: 'text-success', label: 'Alumni Directory', path: '/coordinator/alumni', description: 'Connect with alumni' },
                { icon: 'bi-mortarboard', color: 'text-warning', label: 'Faculty', path: '/coordinator/faculty', description: 'View faculty roster' },
                { icon: 'bi-briefcase', color: 'text-danger', label: 'Job Opportunity', path: '/coordinator/jobs', description: 'Manage job postings' },
                { icon: 'bi-person-heart', color: 'text-primary', label: 'Mentorship', path: '/coordinator/mentorships', description: 'Mentorship programs' },
                { icon: 'bi-newspaper', color: 'text-secondary', label: 'News', path: '/coordinator/news', description: 'Latest campus updates' },
                { icon: 'bi-calendar-event', color: 'text-info', label: 'Event', path: '/coordinator/events', description: 'Upcoming events' },
                { icon: 'bi-images', color: 'text-success', label: 'Gallery', path: '/coordinator/gallery', description: 'Event highlights' }
              ].map((item, idx) => (
                <div key={item.path} className="col-md-6 col-lg-4 col-xl-3">
                  <div
                    className="card h-100 border-0 shadow-sm"
                    style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                    onClick={() => navigate(item.path)}
                  >
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className={`bi ${item.icon} ${item.color}`} style={{ fontSize: '2.5rem' }} />
                      </div>
                      <h6 className="card-title mb-2">{item.label}</h6>
                      <p className="card-text small text-muted mb-3">{item.description}</p>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-arrow-right" /> Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div className="card-body text-center p-4">
            <h5 className="mb-3" style={{ fontWeight: '600' }}>
              <i className="bi bi-speedometer2 me-2" />
              Department Operations Hub
            </h5>
            <p className="mb-0" style={{ fontSize: '1rem', opacity: 0.95 }}>
              Coordinate approvals, mentorships, jobs, and events with confidence using real-time departmental insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
