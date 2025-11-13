import { useState, useEffect, useMemo } from 'react';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAlumni: 0,
    totalFaculty: 0,
    totalCoordinators: 0,
    activeUsers: 0,
    totalEvents: 0,
    totalJobs: 0,
    totalMentorships: 0
  });

  const [userGrowthData, setUserGrowthData] = useState([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState([]);
  const [engagementDistributionData, setEngagementDistributionData] = useState([]);
  const [eventParticipationData, setEventParticipationData] = useState([]);
  const [departmentUtilizationData, setDepartmentUtilizationData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedYear, selectedDepartment, selectedRole]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
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
      const allDepartments = Array.isArray(departmentsRes.data) ? departmentsRes.data : [];

      setDepartments(allDepartments);

      let filteredUsers = [...allUsers];
      let filteredEvents = [...allEvents];
      let filteredJobs = [...allJobs];
      let filteredMentorships = [...allMentorships];

      if (selectedDepartment !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.department === selectedDepartment);
        filteredEvents = filteredEvents.filter(e => e.department === selectedDepartment);
        filteredJobs = filteredJobs.filter(j => j.department === selectedDepartment);
        filteredMentorships = filteredMentorships.filter(m => m.department === selectedDepartment);
      }

      if (selectedRole !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === selectedRole);
      }

      const totalStudents = filteredUsers.filter(u => u.role === 'student').length;
      const totalAlumni = filteredUsers.filter(u => u.role === 'alumni').length;
      const totalFaculty = filteredUsers.filter(u => u.role === 'faculty').length;
      const totalCoordinators = filteredUsers.filter(u => u.role === 'coordinator').length;
      const activeUsers = filteredUsers.filter(u => u.isActive !== false && u.approvalStatus === 'approved').length;
      const totalEvents = filteredEvents.length;
      const totalJobs = filteredJobs.length;
      const totalMentorships = filteredMentorships.length;

      setStats({
        totalStudents,
        totalAlumni,
        totalFaculty,
        totalCoordinators,
        activeUsers,
        totalEvents,
        totalJobs,
        totalMentorships
      });

      setUserGrowthData(generateUserGrowthData(allUsers, selectedYear));
      setMonthlyActivityData(generateMonthlyActivityData(allJobs, allMentorships, selectedYear));

      setEngagementDistributionData([
        { name: 'Events', value: filteredEvents.length },
        { name: 'Jobs', value: filteredJobs.length },
        { name: 'Mentorships', value: filteredMentorships.length }
      ]);

      setEventParticipationData(await generateEventParticipationData(filteredEvents, allUsers));
      setDepartmentUtilizationData(generateDepartmentUtilizationData(allDepartments, allUsers, allEvents, allJobs, allMentorships));
      setRecentActivity(buildRecentActivity(filteredJobs, filteredMentorships));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalStudents: 0,
        totalAlumni: 0,
        totalFaculty: 0,
        totalCoordinators: 0,
        activeUsers: 0,
        totalEvents: 0,
        totalJobs: 0,
        totalMentorships: 0
      });
      setUserGrowthData([]);
      setMonthlyActivityData([]);
      setEngagementDistributionData([]);
      setEventParticipationData([]);
      setDepartmentUtilizationData([]);
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
      let coordinators = 0;

      users.forEach(user => {
        const userDate = new Date(user.createdAt || user.date);
        if (userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear()) {
          if (user.role === 'student') students++;
          if (user.role === 'alumni') alumni++;
          if (user.role === 'coordinator') coordinators++;
        }
      });

      data.push({ month: monthKey, students, alumni, coordinators });
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
    const userRoleMap = {};

    allUsers.forEach(u => {
      if (u._id) {
        const id = typeof u._id === 'string' ? u._id : u._id.toString();
        userRoleMap[id] = u.role;
      }
    });

    events.slice(0, 10).forEach(event => {
      let students = 0;
      let alumni = 0;

      if (Array.isArray(event.attendees)) {
        event.attendees.forEach(attendee => {
          let userId = null;
          if (attendee.user) {
            if (typeof attendee.user === 'string') {
              userId = attendee.user;
            } else if (attendee.user._id) {
              userId = typeof attendee.user._id === 'string' ? attendee.user._id : attendee.user._id.toString();
            }
          }

          if (userId && userRoleMap[userId]) {
            const role = userRoleMap[userId];
            if (role === 'student') students++;
            if (role === 'alumni') alumni++;
          }
        });
      }

      const totalAttendees = event.attendees?.length || 0;
      if (students === 0 && alumni === 0 && totalAttendees > 0) {
        students = Math.floor(totalAttendees * 0.6);
        alumni = Math.floor(totalAttendees * 0.4);
      }

      data.push({
        event: (event.title || `Event ${event._id?.substring(0, 8) || 'Unknown'}`).substring(0, 20),
        students,
        alumni
      });
    });

    return data;
  };

  const generateDepartmentUtilizationData = (departmentsList, users, events, jobs, mentorships) => {
    if (!departmentsList || departmentsList.length === 0) {
      return [];
    }

    return departmentsList.map(dept => {
      const deptUsers = users.filter(u => u.department === dept && u.approvalStatus === 'approved').length;
      const deptEvents = events.filter(e => e.department === dept).length;
      const deptJobs = jobs.filter(j => j.department === dept).length;
      const deptMentorships = mentorships.filter(m => m.department === dept).length;

      return {
        department: dept,
        users: deptUsers,
        events: deptEvents,
        jobs: deptJobs,
        mentorships: deptMentorships,
        score: deptUsers + deptEvents * 2 + deptJobs * 1.5 + deptMentorships * 2.5
      };
    }).sort((a, b) => b.score - a.score).slice(0, 6);
  };

  const buildRecentActivity = (jobs, mentorships) => {
    const activities = [];

    jobs
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5)
      .forEach(job => {
        activities.push({
          id: job._id,
          type: 'job',
          title: `${job.title} at ${job.company}`,
          description: `Posted by ${job.postedBy?.name || 'Alumni'}`,
          date: job.createdAt || new Date(),
          action: () => navigate(`/admin/jobs/${job._id}`)
        });
      });

    mentorships
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5)
      .forEach(mentorship => {
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
              navigate(`/admin/mentor/${mentorId}`);
            }
          }
        });
      });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);

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
        <div className="mb-4">
          <h2 className="mb-2" style={{ fontWeight: '700', color: '#1a1a1a' }}>
            <i className="bi bi-speedometer2 text-primary me-2" />
            Admin Analytics
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Unified overview of students, alumni, and departmental engagement
          </p>
        </div>

        <div className="card shadow-sm mb-4" style={{ borderRadius: '12px', border: 'none' }}>
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Year</label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
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
                  <option value="coordinator">Coordinators</option>
                  <option value="faculty">Faculty</option>
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
                  <i className="bi bi-arrow-clockwise me-1" /> Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4 g-3">
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-mortarboard-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{stats.totalStudents}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Students</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{stats.totalAlumni}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Alumni</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-person-badge-fill d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{stats.totalCoordinators}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Coordinators</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-activity d-block mb-3" style={{ fontSize: '2.5rem', opacity: 0.9 }} />
                <h2 style={{ fontWeight: '700' }}>{stats.activeUsers}</h2>
                <p className="mb-0" style={{ opacity: 0.95 }}>Active Users</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4 g-3">
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-calendar-event-fill text-primary d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{stats.totalEvents}</h3>
                <p className="text-muted mb-0">Events Managed</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-briefcase-fill text-success d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{stats.totalJobs}</h3>
                <p className="text-muted mb-0">Job Opportunities</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-people-fill text-warning d-block mb-2" style={{ fontSize: '2.3rem' }} />
                <h3 style={{ fontWeight: '700', color: '#1a1a1a' }}>{stats.totalMentorships}</h3>
                <p className="text-muted mb-0">Mentorship Programs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-graph-up text-primary me-2" />
                  User Growth Trajectory
                </h5>
                <p className="text-muted small mb-0 mt-1">Monthly onboarding across roles</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="students" stroke="#667eea" strokeWidth={3} dot={{ r: 5 }} name="Students" />
                    <Line type="monotone" dataKey="alumni" stroke="#f5576c" strokeWidth={3} dot={{ r: 5 }} name="Alumni" />
                    <Line type="monotone" dataKey="coordinators" stroke="#43e97b" strokeWidth={3} dot={{ r: 5 }} name="Coordinators" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-fill text-success me-2" />
                  Opportunity Pipeline
                </h5>
                <p className="text-muted small mb-0 mt-1">Jobs vs mentorship programs per month</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="jobPostings" fill="#4facfe" radius={[8, 8, 0, 0]} name="Job Postings" />
                    <Bar dataKey="mentorshipSessions" fill="#43e97b" radius={[8, 8, 0, 0]} name="Mentorship Launches" />
                  </BarChart>
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
                  <i className="bi bi-pie-chart-fill text-warning me-2" />
                  Engagement Mix
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
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-bar-chart-steps text-info me-2" />
                  Event Participation Snapshot
                </h5>
                <p className="text-muted small mb-0 mt-1">Student vs Alumni attendance</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventParticipationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="event" tick={{ fontSize: 11, angle: -30, textAnchor: 'end', height: 70 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="students" stackId="a" fill="#667eea" name="Students" />
                    <Bar dataKey="alumni" stackId="a" fill="#f5576c" name="Alumni" />
                  </BarChart>
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
                  <i className="bi bi-award-fill text-primary me-2" />
                  Department Utilization Index
                </h5>
                <p className="text-muted small mb-0 mt-1">Top performing departments</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentUtilizationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} width={140} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="users" fill="#4facfe" radius={[0, 8, 8, 0]} name="Approved Users" />
                    <Bar dataKey="events" fill="#667eea" radius={[0, 8, 8, 0]} name="Events" />
                    <Bar dataKey="jobs" fill="#43e97b" radius={[0, 8, 8, 0]} name="Jobs" />
                    <Bar dataKey="mentorships" fill="#f5576c" radius={[0, 8, 8, 0]} name="Mentorships" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-2">
                <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  <i className="bi bi-clock-history text-success me-2" />
                  Recent Platform Activity
                </h5>
                <p className="text-muted small mb-0 mt-1">Latest jobs and mentorship updates</p>
              </div>
              <div className="card-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px', cursor: 'pointer' }} onClick={activity.action}>
                      <div className="card-body d-flex align-items-start">
                        <div
                          className="me-3"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: activity.type === 'job'
                              ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.2rem'
                          }}
                        >
                          <i className={`bi ${activity.type === 'job' ? 'bi-briefcase-fill' : 'bi-people-fill'}`} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{ fontWeight: '600' }}>{activity.title}</h6>
                          <p className="text-muted small mb-1">{activity.description}</p>
                          <p className="text-muted small mb-0">
                            <i className="bi bi-calendar-event me-1" />
                            {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-4">No recent activity recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div className="card-body text-center p-4">
            <h5 className="mb-3" style={{ fontWeight: '600' }}>
              <i className="bi bi-building me-2" />
              Institution Overview
            </h5>
            <p className="mb-0" style={{ fontSize: '1rem', opacity: 0.95 }}>
              Monitor growth, unlock bottlenecks, and coordinate seamlessly across departments with a data-rich control center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
