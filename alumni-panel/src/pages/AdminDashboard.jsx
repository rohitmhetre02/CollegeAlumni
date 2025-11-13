import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAlumni: 0,
    totalFaculty: 0,
    activeUsers: 0,
    totalEvents: 0
  });

  // Chart data
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState([]);
  const [engagementDistributionData, setEngagementDistributionData] = useState([]);
  const [eventParticipationData, setEventParticipationData] = useState([]);

  // List data
  const [recentActivity, setRecentActivity] = useState([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, selectedYear, selectedDepartment, selectedRole]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [usersRes, eventsRes, jobsRes, mentorshipsRes, departmentsRes] = await Promise.all([
        api.get('/users'),
        api.get('/events'),
        api.get('/jobs'),
        api.get('/mentorships'),
        api.get('/departments')
      ]);

      const allUsers = usersRes.data || [];
      const allEvents = eventsRes.data || [];
      const allJobs = jobsRes.data || [];
      const allMentorships = mentorshipsRes.data || [];
      const allDepartments = departmentsRes.data || [];
      
      // Ensure departments is an array
      const departmentsArray = Array.isArray(allDepartments) ? allDepartments : [];
      setDepartments(departmentsArray);

      // Apply filters
      let filteredUsers = allUsers;
      let filteredEvents = allEvents;
      let filteredJobs = allJobs;
      let filteredMentorships = allMentorships;

      if (selectedDepartment !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.department === selectedDepartment);
        filteredEvents = filteredEvents.filter(e => e.department === selectedDepartment);
        filteredJobs = filteredJobs.filter(j => j.department === selectedDepartment);
        filteredMentorships = filteredMentorships.filter(m => m.department === selectedDepartment);
      }

      if (selectedRole !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === selectedRole);
      }

      // Calculate stats
      const totalStudents = filteredUsers.filter(u => u.role === 'student').length;
      const totalAlumni = filteredUsers.filter(u => u.role === 'alumni').length;
      const totalFaculty = filteredUsers.filter(u => u.role === 'coordinator').length; // Assuming coordinators are faculty
      const activeUsers = filteredUsers.filter(u => u.isActive !== false && u.approvalStatus === 'approved').length;
      const totalEvents = filteredEvents.length;

      setStats({
        totalStudents,
        totalAlumni,
        totalFaculty,
        activeUsers,
        totalEvents
      });

      // Generate user growth data
      const growthData = generateUserGrowthData(allUsers, selectedYear);
      setUserGrowthData(growthData);

      // Generate monthly activity data
      const activityData = generateMonthlyActivityData(allJobs, allMentorships, selectedYear);
      setMonthlyActivityData(activityData);

      // Generate engagement distribution
      const engagementData = [
        { name: 'Events', value: filteredEvents.length },
        { name: 'Jobs', value: filteredJobs.length },
        { name: 'Mentorships', value: filteredMentorships.length }
      ];
      setEngagementDistributionData(engagementData);

      // Generate event participation data
      const participationData = await generateEventParticipationData(allEvents, allUsers);
      setEventParticipationData(participationData);

      // Get recent activity
      const activities = [];
      
      // Recent jobs
      filteredJobs
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5)
        .forEach(job => {
          activities.push({
            id: job._id,
            type: 'job',
            title: `${job.title} at ${job.company}`,
            description: `Posted by ${job.postedBy?.name || 'Alumni'}`,
            date: job.createdAt || new Date(),
            action: () => navigate(`/job/${job._id}`)
          });
        });

      // New mentors
      filteredMentorships
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5)
        .forEach(mentorship => {
          // Extract mentor ID for navigation
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
          
          activities.push({
            id: mentorship._id,
            type: 'mentorship',
            title: mentorship.title,
            description: `Mentor: ${mentorship.mentor?.name || 'Alumni'}`,
            date: mentorship.createdAt || new Date(),
            action: () => {
              if (mentorId) {
                navigate(`/mentor/${mentorId}`);
              } else {
                console.error('Mentor ID not found for mentorship:', mentorship._id);
              }
            }
          });
        });

      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty states on error
      setStats({
        totalStudents: 0,
        totalAlumni: 0,
        totalFaculty: 0,
        activeUsers: 0,
        totalEvents: 0
      });
      setUserGrowthData([]);
      setMonthlyActivityData([]);
      setEngagementDistributionData([]);
      setEventParticipationData([]);
      setRecentActivity([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowthData = (users, year) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(year, new Date().getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      let students = 0;
      let alumni = 0;

      users.forEach(user => {
        const userDate = new Date(user.createdAt || user.date);
        if (userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear()) {
          if (user.role === 'student') students++;
          if (user.role === 'alumni') alumni++;
        }
      });

      data.push({ month: monthKey, students, alumni });
    }

    return data;
  };

  const generateMonthlyActivityData = (jobs, mentorships, year) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(year, new Date().getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      let jobPostings = 0;
      let mentorshipSessions = 0;

      jobs.forEach(job => {
        const jobDate = new Date(job.createdAt || job.date);
        if (jobDate.getMonth() === date.getMonth() && jobDate.getFullYear() === date.getFullYear()) {
          jobPostings++;
        }
      });

      mentorships.forEach(mentorship => {
        const mentorshipDate = new Date(mentorship.createdAt || mentorship.date);
        if (mentorshipDate.getMonth() === date.getMonth() && mentorshipDate.getFullYear() === date.getFullYear()) {
          mentorshipSessions++;
        }
      });

      data.push({ month: monthKey, jobPostings, mentorshipSessions });
    }

    return data;
  };

  const generateEventParticipationData = async (events, allUsers) => {
    const data = [];

    // Create a map of user IDs to their roles for quick lookup
    const userRoleMap = {};
    allUsers.forEach(user => {
      if (user._id) {
        const userId = typeof user._id === 'string' ? user._id : user._id.toString();
        userRoleMap[userId] = user.role;
      }
    });

    events.slice(0, 10).forEach(event => {
      let students = 0;
      let alumni = 0;

      if (event.attendees && Array.isArray(event.attendees)) {
        event.attendees.forEach(attendee => {
          let userId = null;
          if (attendee.user) {
            userId = typeof attendee.user === 'string' 
              ? attendee.user 
              : (attendee.user._id ? (typeof attendee.user._id === 'string' ? attendee.user._id : attendee.user._id.toString()) : null);
          }

          if (userId) {
            const role = userRoleMap[userId];
            if (role === 'student') students++;
            if (role === 'alumni') alumni++;
          } else if (attendee.user?.role) {
            // Fallback: check if role is directly available
            if (attendee.user.role === 'student') students++;
            if (attendee.user.role === 'alumni') alumni++;
          }
        });
      }

      // If no attendees or no role data, estimate based on typical distribution
      const totalAttendees = event.attendees?.length || 0;
      if (students === 0 && alumni === 0 && totalAttendees > 0) {
        students = Math.floor(totalAttendees * 0.6);
        alumni = Math.floor(totalAttendees * 0.4);
      } else if (students === 0 && alumni === 0) {
        // No attendees, set to 0
        students = 0;
        alumni = 0;
      }

      data.push({
        event: (event.title || `Event ${event._id?.substring(0, 8) || 'Unknown'}`).substring(0, 20),
        students: students,
        alumni: alumni
      });
    });

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: '#f8f9fa' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-2" style={{ fontWeight: '700', color: '#1a1a1a' }}>
            <i className="bi bi-speedometer2 text-primary me-2"></i>
            Admin Dashboard
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Analytics and management controls for the Student–Alumni Engagement Portal
          </p>
      </div>

        {/* Filter Controls */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: '12px', border: 'none' }}>
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Year</label>
                <select 
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Department</label>
                <select 
                  className="form-select"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Role</label>
                <select 
                  className="form-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="alumni">Alumni</option>
                  <option value="coordinator">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-md-3">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSelectedYear(new Date().getFullYear());
                    setSelectedDepartment('all');
                    setSelectedRole('all');
                  }}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Reset Filters
          </button>
              </div>
            </div>
          </div>
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
                  <i className="bi bi-people-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.totalStudents}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Total Students</p>
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
                  <i className="bi bi-mortarboard-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.totalAlumni}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Total Alumni</p>
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
                  <i className="bi bi-person-badge-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.totalFaculty}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Total Faculty</p>
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
                  <i className="bi bi-person-check-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.activeUsers}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Active Users</p>
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
                  <i className="bi bi-calendar-event-fill" style={{ fontSize: '2.5rem', opacity: 0.9 }}></i>
                </div>
                <h2 className="mb-2" style={{ fontWeight: '700', fontSize: '2.5rem' }}>{stats.totalEvents}</h2>
                <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.95 }}>Total Events</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 - Line and Bar Charts */}
        <div className="row mb-4">
          {/* Line Chart - User Growth */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-graph-up text-primary me-2"></i>
                  User Growth Over Time
                </h5>
                <p className="text-muted small mb-0 mt-1">Students vs Alumni</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#667eea" strokeWidth={3} dot={{ r: 5 }} name="Students" />
                    <Line type="monotone" dataKey="alumni" stroke="#f5576c" strokeWidth={3} dot={{ r: 5 }} name="Alumni" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bar Chart - Monthly Activity */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-fill text-success me-2"></i>
                  Monthly Activity
                </h5>
                <p className="text-muted small mb-0 mt-1">Job Postings & Mentorship Sessions</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="jobPostings" fill="#4facfe" radius={[8, 8, 0, 0]} name="Job Postings" />
                    <Bar dataKey="mentorshipSessions" fill="#43e97b" radius={[8, 8, 0, 0]} name="Mentorship Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </div>
            </div>
          </div>

        {/* Charts Row 2 - Pie and Stacked Bar */}
        <div className="row mb-4">
          {/* Pie Chart - Engagement Distribution */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-pie-chart-fill text-info me-2"></i>
                  Engagement Distribution
                </h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementDistributionData.map((entry, index) => (
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

          {/* Stacked Bar Chart - Event Participation */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-steps text-warning me-2"></i>
                  Event Participation
                </h5>
                <p className="text-muted small mb-0 mt-1">Students vs Alumni</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventParticipationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="event" tick={{ fontSize: 11, angle: -45, textAnchor: 'end', height: 80 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="students" stackId="a" fill="#667eea" name="Students" />
                    <Bar dataKey="alumni" stackId="a" fill="#f5576c" name="Alumni" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-clock-history text-primary me-2"></i>
                  Recent Activity
                </h5>
                <p className="text-muted small mb-0 mt-1">Latest jobs posted and new mentors joined</p>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map(activity => (
                      <div key={activity.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 border" style={{ borderRadius: '12px', cursor: 'pointer' }}
                             onClick={activity.action}>
          <div className="card-body">
                            <div className="d-flex align-items-start mb-2">
                              <div className="me-3">
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: activity.type === 'job' 
                                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '1.2rem'
                                }}>
                                  <i className={`bi ${activity.type === 'job' ? 'bi-briefcase-fill' : 'bi-people-fill'}`}></i>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                  {activity.title}
                                </h6>
                                <p className="text-muted small mb-1" style={{ fontSize: '0.85rem' }}>
                                  {activity.description}
                                </p>
                                <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-clock me-1"></i>
                                  {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <p className="text-muted text-center py-4">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="card shadow-sm" style={{ 
          borderRadius: '16px', 
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div className="card-body text-center p-4">
            <h5 className="mb-3" style={{ fontWeight: '600' }}>
              <i className="bi bi-building me-2"></i>
              College Engagement Portal - Admin Overview
            </h5>
            <p className="mb-0" style={{ fontSize: '1rem', opacity: 0.95 }}>
              Manage all departments, users, jobs, events, and mentorship programs across the college with comprehensive analytics and insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
