import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Stats
  const [stats, setStats] = useState({
    activeEvents: 0,
    ongoingMentorships: 0,
    pendingApprovals: 0,
    departmentsActive: 0,
    totalFeedback: 0
  });

  // Chart data
  const [eventParticipationData, setEventParticipationData] = useState([]);
  const [mentorshipProgressData, setMentorshipProgressData] = useState([]);
  const [approvalStatusData, setApprovalStatusData] = useState([]);
  const [feedbackRatingsData, setFeedbackRatingsData] = useState([]);

  // List data
  const [recentEventFeedback, setRecentEventFeedback] = useState([]);
  const [topPerformingDepartments, setTopPerformingDepartments] = useState([]);
  const [newRequests, setNewRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const department = user?.department;
      
      // Fetch all data in parallel
      const [usersRes, eventsRes, mentorshipsRes, jobsRes, departmentsRes] = await Promise.all([
        api.get('/users'), // Coordinator can only see their department users (handled by backend)
        api.get('/events'),
        api.get('/mentorships'),
        api.get('/jobs'),
        api.get('/departments')
      ]);

      const allUsers = usersRes.data || [];
      const allEvents = eventsRes.data || [];
      const allMentorships = mentorshipsRes.data || [];
      const allDepartments = departmentsRes.data || [];
      
      // Filter by coordinator's department (backend may not filter for coordinators)
      const filteredUsers = department ? allUsers.filter(u => u.department === department) : allUsers;
      const filteredEvents = department ? allEvents.filter(e => e.department === department) : allEvents;
      const filteredMentorships = department ? allMentorships.filter(m => m.department === department) : allMentorships;

      // Calculate stats using filtered data
      const activeEvents = filteredEvents.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;
      const ongoingMentorships = filteredMentorships.filter(m => m.status === 'active').length;
      const pendingApprovals = filteredUsers.filter(u => u.approvalStatus === 'pending' && (u.role === 'student' || u.role === 'alumni')).length;
      
      // Count departments with active users/events/mentorships (at least coordinator's department)
      const activeDepartments = new Set();
      filteredUsers.forEach(u => activeDepartments.add(u.department));
      filteredEvents.forEach(e => activeDepartments.add(e.department));
      filteredMentorships.forEach(m => activeDepartments.add(m.department));

      // Count total feedback (reviews from mentorships)
      const totalFeedback = filteredMentorships.reduce((total, m) => total + (m.reviews?.length || 0), 0);

      setStats({
        activeEvents,
        ongoingMentorships,
        pendingApprovals,
        departmentsActive: activeDepartments.size || 1, // At least coordinator's department
        totalFeedback
      });

      // Generate event participation by department data
      const eventData = generateEventParticipationData(filteredEvents, allDepartments);
      setEventParticipationData(eventData);

      // Generate mentorship progress data
      const progressData = generateMentorshipProgressData(filteredMentorships);
      setMentorshipProgressData(progressData);

      // Generate approval status data
      const approvalData = [
        { name: 'Approved', value: filteredUsers.filter(u => u.approvalStatus === 'approved' && (u.role === 'student' || u.role === 'alumni')).length },
        { name: 'Pending', value: pendingApprovals },
        { name: 'Rejected', value: filteredUsers.filter(u => u.approvalStatus === 'rejected' && (u.role === 'student' || u.role === 'alumni')).length }
      ];
      setApprovalStatusData(approvalData);

      // Generate feedback ratings radar data
      const feedbackData = generateFeedbackRatingsData(filteredMentorships, filteredEvents, allDepartments, user);
      setFeedbackRatingsData(feedbackData);

      // Get recent event feedback (mentorship reviews)
      const feedback = [];
      filteredMentorships.forEach(mentorship => {
        if (mentorship.reviews && mentorship.reviews.length > 0) {
          mentorship.reviews.forEach(review => {
            feedback.push({
              id: review._id || Math.random(),
              mentorshipTitle: mentorship.title,
              mentorName: mentorship.mentor?.name || 'Unknown',
              studentName: review.student?.name || 'Student',
              rating: review.rating,
              comment: review.comment,
              date: review.createdAt || new Date()
            });
          });
        }
      });
      feedback.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentEventFeedback(feedback.slice(0, 5));

      // Get top performing departments (based on activity) - only show coordinator's department and related
      const deptPerformance = allDepartments.map(dept => {
        const deptEvents = filteredEvents.filter(e => e.department === dept).length;
        const deptMentorships = filteredMentorships.filter(m => m.department === dept).length;
        const deptUsers = filteredUsers.filter(u => u.department === dept && u.approvalStatus === 'approved').length;
        return {
          department: dept,
          score: deptEvents * 2 + deptMentorships * 3 + deptUsers * 1
        };
      }).sort((a, b) => b.score - a.score).slice(0, 5);
      setTopPerformingDepartments(deptPerformance);

      // Get new requests (pending mentorship requests and pending approvals)
      const requests = [];
      
      // Add pending approvals
      filteredUsers
        .filter(u => u.approvalStatus === 'pending' && (u.role === 'student' || u.role === 'alumni'))
        .forEach(u => {
          requests.push({
            id: u._id,
            type: 'approval',
            title: `${u.name} - ${u.role}`,
            description: `Registration pending approval`,
            date: u.createdAt || new Date(),
            user: u
          });
        });

      // Add pending mentorship requests
      filteredMentorships.forEach(m => {
        m.mentees?.filter(mentee => mentee.status === 'pending').forEach(mentee => {
          requests.push({
            id: `${m._id}_${mentee._id}`,
            type: 'mentorship',
            title: `Mentorship Request: ${m.title}`,
            description: `Student requested mentorship`,
            date: mentee.requestedAt || m.createdAt || new Date(),
            mentorship: m,
            mentee: mentee
          });
        });
      });

      requests.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNewRequests(requests.slice(0, 10));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty states on error
      setStats({
        activeEvents: 0,
        ongoingMentorships: 0,
        pendingApprovals: 0,
        departmentsActive: 1,
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
      setLoading(false);
    }
  };

  const generateEventParticipationData = (events, departments) => {
    const data = [];
    const participationMap = {};

    events.forEach(event => {
      const dept = event.department || 'Unknown';
      if (!participationMap[dept]) {
        participationMap[dept] = 0;
      }
      participationMap[dept] += event.attendees?.length || 0;
    });

    departments.forEach(dept => {
      data.push({
        department: dept,
        participation: participationMap[dept] || 0
      });
    });

    return data.sort((a, b) => b.participation - a.participation);
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
        if (mentorship.status === 'closed' || mentorship.status === 'completed') {
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
    // Generate radar chart data based on average ratings per department
    const ratingsByDept = {};

    mentorships.forEach(m => {
      const dept = m.department || 'Unknown';
      if (!ratingsByDept[dept]) {
        ratingsByDept[dept] = [];
      }
      
      // Get ratings from reviews if available
      if (m.reviews && Array.isArray(m.reviews)) {
        m.reviews.forEach(review => {
          if (review.rating && review.rating > 0) {
            ratingsByDept[dept].push(review.rating);
          }
        });
      }
      
      // Fallback to mentorship rating if available
      if (m.rating && m.rating > 0 && (!m.reviews || m.reviews.length === 0)) {
        ratingsByDept[dept].push(m.rating);
      }
    });

    // Calculate average ratings per department
    const avgRatings = {};
    Object.keys(ratingsByDept).forEach(dept => {
      const ratings = ratingsByDept[dept];
      if (ratings.length > 0) {
        avgRatings[dept] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      }
    });

    // Create radar data points (limit to top 6 departments with ratings)
    const topDepts = Object.keys(avgRatings)
      .filter(dept => avgRatings[dept] > 0)
      .sort((a, b) => avgRatings[b] - avgRatings[a])
      .slice(0, 6);

    // If no departments with ratings, use coordinator's department with a default
    if (topDepts.length === 0 && coordinator?.department) {
      return [{
        department: coordinator.department.substring(0, 15),
        rating: 4.0,
        fullMark: 5
      }];
    }

    return topDepts.map(dept => ({
      department: dept.length > 15 ? dept.substring(0, 12) + '...' : dept,
      rating: parseFloat(avgRatings[dept].toFixed(1)),
      fullMark: 5
    }));
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
      
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: '#f8f9fa' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-2" style={{ fontWeight: '700', color: '#1a1a1a' }}>
            <i className="bi bi-clipboard-data-fill text-primary me-2"></i>
            Coordinator Dashboard
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Manage events, mentorships, and departmental activities - {user?.department || 'Department'}
          </p>
      </div>

        {/* Summary Cards */}
        <div className="row mb-4 g-3" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-calendar-event-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.activeEvents}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Active Events</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-people-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.ongoingMentorships}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Ongoing Mentorships</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-clock-history" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.pendingApprovals}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Pending Approvals</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-building" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.departmentsActive}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Departments Active</p>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-md-4 col-lg" style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '100%' }}>
            <div className="card shadow-sm h-100" style={{ 
              border: 'none', 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-star-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.totalFeedback}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Total Feedback</p>
              </div>
            </div>
          </div>
      </div>

        {/* Charts Row 1 - Bar and Line Charts */}
        <div className="row mb-4">
          {/* Bar Chart - Event Participation by Department */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-fill text-primary me-2"></i>
                  Event Participation by Department
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventParticipationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="participation" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>

          {/* Line Chart - Mentorship Progress */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-graph-up text-success me-2"></i>
                  Mentorship Progress
                </h5>
                <p className="text-muted small mb-0 mt-1">Started vs Completed</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mentorshipProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="started" stroke="#f5576c" strokeWidth={3} dot={{ r: 5 }} name="Started" />
                    <Line type="monotone" dataKey="completed" stroke="#43e97b" strokeWidth={3} dot={{ r: 5 }} name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 - Pie and Radar Charts */}
        <div className="row mb-4">
          {/* Pie Chart - Approval Status */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-pie-chart-fill text-info me-2"></i>
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
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {approvalStatusData.map((entry, index) => (
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

          {/* Radar Chart - Feedback Ratings */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-radar text-warning me-2"></i>
                  Average Feedback Ratings
                </h5>
                <p className="text-muted small mb-0 mt-1">By Department</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={feedbackRatingsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Rating"
                      dataKey="rating"
                      stroke="#667eea"
                      fill="#667eea"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Recent Feedback, Top Departments, New Requests */}
        <div className="row">
          {/* Recent Event Feedback */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-chat-left-text text-primary me-2"></i>
                  Recent Feedback
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recentEventFeedback.length > 0 ? (
                  recentEventFeedback.map(feedback => (
                    <div key={feedback.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start mb-2">
                        <div className="me-2">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`bi ${i < feedback.rating ? 'bi-star-fill' : 'bi-star'}`}
                              style={{ color: i < feedback.rating ? '#FFC107' : '#ddd', fontSize: '0.85rem' }}
                            ></i>
                          ))}
                        </div>
                        <small className="text-muted ms-auto">
                          {new Date(feedback.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </small>
                      </div>
                      <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                        {feedback.mentorshipTitle}
                      </h6>
                      <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                        By {feedback.studentName} for {feedback.mentorName}
                      </p>
                      {feedback.comment && (
                        <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                          "{feedback.comment.substring(0, 60)}..."
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

          {/* Top Performing Departments */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-trophy-fill text-warning me-2"></i>
                  Top Performing Departments
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {topPerformingDepartments.length > 0 ? (
                  topPerformingDepartments.map((dept, index) => (
                    <div key={dept.department} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' : index === 2 ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            marginRight: '12px'
                          }}>
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
                  <p className="text-muted text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* New Requests */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bell-fill text-danger me-2"></i>
                  New Requests
                </h5>
                {stats.pendingApprovals > 0 && (
                  <span className="badge bg-danger">{stats.pendingApprovals}</span>
                )}
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {newRequests.length > 0 ? (
                  newRequests.map(request => (
                    <div key={request.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <div className="me-2">
                          <i className={`bi ${request.type === 'approval' ? 'bi-person-check' : 'bi-people'}`} 
                             style={{ fontSize: '1.2rem', color: request.type === 'approval' ? '#4facfe' : '#f5576c' }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                            {request.title}
                          </h6>
                          <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                            {request.description}
                          </p>
                          <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-clock me-1"></i>
                            {new Date(request.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          {request.type === 'approval' && request.user && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/users/${request.user._id || request.user.id}`)}
                            >
                              Review
                            </button>
                          )}
                          {request.type === 'mentorship' && request.mentorship && (() => {
                            // Extract mentor ID for navigation
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
                                    navigate(`/mentor/${mentorId}`);
                                  } else {
                                    alert('Unable to view mentor profile. Mentor information is missing.');
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

        {/* Summary Footer */}
        <div className="card shadow-sm mt-4" style={{ 
          borderRadius: '16px', 
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div className="card-body text-center p-4">
            <h5 className="mb-3" style={{ fontWeight: '600' }}>
              <i className="bi bi-speedometer2 me-2"></i>
              Management Efficiency Dashboard
            </h5>
            <p className="mb-0" style={{ fontSize: '1rem', opacity: 0.95 }}>
              Monitor and manage all departmental activities, approvals, and engagement metrics from one centralized location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
