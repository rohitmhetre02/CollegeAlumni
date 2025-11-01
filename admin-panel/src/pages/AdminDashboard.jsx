import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const AdminDashboard = () => {
  const { user } = useAuth();
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
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4">Welcome, {user?.name} (Admin)</h2>

        <div className="alert alert-success">
          <i className="bi bi-info-circle"></i> College Level Management Dashboard
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
                <p className="text-muted">Total Jobs</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-info">{statistics.events}</h3>
                <p className="text-muted">Total Events</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-warning">{statistics.mentorships}</h3>
                <p className="text-muted">Total Mentorships</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-body">
            <h4 className="mb-3">
              <i className="bi bi-building"></i> College Overview
            </h4>
            <p>You have full access to manage all departments, users, jobs, events, and mentorship programs across the entire college.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
