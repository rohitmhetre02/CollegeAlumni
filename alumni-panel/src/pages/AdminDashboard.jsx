import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    jobs: 0,
    events: 0,
    mentorships: 0
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const statsRes = await api.get('/departments/stats');
      setStatistics({
        totalUsers: statsRes.data.users,
        jobs: statsRes.data.jobs,
        events: statsRes.data.events,
        mentorships: statsRes.data.mentorships
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white p-3" style={{ width: '250px' }}>
        <h4 className="mb-4">
          <i className="bi bi-gear-fill"></i> Admin Panel
        </h4>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <a className="nav-link text-white active" href="#dashboard">
              Dashboard
            </a>
          </li>
          <li className="nav-item mb-2">
            <a className="nav-link text-white" href="#users">
              Users
            </a>
          </li>
          <li className="nav-item mb-2">
            <a className="nav-link text-white" href="#departments">
              Departments
            </a>
          </li>
          <li className="nav-item mb-2">
            <a className="nav-link text-white" href="#reports">
              Reports
            </a>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Welcome, {user.name} (Admin)</h2>
          <button className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-primary">{statistics.totalUsers}</h3>
                <p className="text-muted">Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-success">{statistics.jobs}</h3>
                <p className="text-muted">Jobs</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-info">{statistics.events}</h3>
                <p className="text-muted">Events</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-warning">{statistics.mentorships}</h3>
                <p className="text-muted">Mentorships</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-body">
            <h4 className="mb-3">College Overview</h4>
            <p>Manage all departments, users, jobs, events, and mentorship programs across the college.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

