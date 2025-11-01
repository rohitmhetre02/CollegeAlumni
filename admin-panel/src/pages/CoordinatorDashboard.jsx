import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const CoordinatorDashboard = () => {
  const { user, setUser } = useAuth();
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    jobs: 0,
    events: 0,
    mentorships: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/users/approvals/pending');
      setPendingApprovals(response.data || []);
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
      await fetchPendingApprovals();
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

  const fetchStatistics = async () => {
    try {
      const statsRes = await api.get('/departments/stats');
      setStatistics({
        totalUsers: statsRes.data?.users || 0,
        jobs: statsRes.data?.jobs || 0,
        events: statsRes.data?.events || 0,
        mentorships: statsRes.data?.mentorships || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics({
        totalUsers: 0,
        jobs: 0,
        events: 0,
        mentorships: 0
      });
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4">Welcome, {user?.name} (Coordinator)</h2>

        <div className="alert alert-info">
          <i className="bi bi-building"></i> Department: <strong>{user?.department}</strong>
        </div>

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-primary">{statistics.totalUsers}</h3>
                <p className="text-muted">Department Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-success">{statistics.jobs}</h3>
                <p className="text-muted">Department Jobs</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-info">{statistics.events}</h3>
                <p className="text-muted">Department Events</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow">
              <div className="card-body text-center">
                <h3 className="display-4 text-warning">{statistics.mentorships}</h3>
                <p className="text-muted">Department Mentorships</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="card shadow mb-4" style={{ borderTop: pendingApprovals.length > 0 ? '4px solid #ffc107' : 'none' }}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-clock-history"></i> Pending Registration Approvals
              {pendingApprovals.length > 0 && (
                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                  {pendingApprovals.length} {pendingApprovals.length === 1 ? 'Request' : 'Requests'}
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
            ) : pendingApprovals.length === 0 ? (
              <div className="alert alert-success mb-0">
                <i className="bi bi-check-circle-fill"></i> No pending registration approvals at the moment. All users are verified.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
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
                    {pendingApprovals.map((pendingUser) => (
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
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(pendingUser._id, 'approved')}
                              disabled={approving}
                            >
                              <i className="bi bi-check-circle"></i> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleApprove(pendingUser._id, 'rejected')}
                              disabled={approving}
                            >
                              <i className="bi bi-x-circle"></i> Reject
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

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">User Details - {selectedUser.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Name:</strong> {selectedUser.name}
                    </div>
                    <div className="col-md-6">
                      <strong>Email:</strong> {selectedUser.email}
                    </div>
                    <div className="col-md-6">
                      <strong>Role:</strong> {selectedUser.role}
                    </div>
                    <div className="col-md-6">
                      <strong>Department:</strong> {selectedUser.department}
                    </div>
                    {selectedUser.enrollmentNumber && (
                      <div className="col-md-6">
                        <strong>Enrollment Number:</strong> {selectedUser.enrollmentNumber}
                      </div>
                    )}
                    {selectedUser.graduationYear && (
                      <div className="col-md-6">
                        <strong>Graduation Year:</strong> {selectedUser.graduationYear}
                      </div>
                    )}
                    {selectedUser.phone && (
                      <div className="col-md-6">
                        <strong>Phone:</strong> {selectedUser.phone}
                      </div>
                    )}
                    {selectedUser.location && (
                      <div className="col-md-6">
                        <strong>Location:</strong> {selectedUser.location}
                      </div>
                    )}
                    {selectedUser.currentPosition && (
                      <div className="col-md-6">
                        <strong>Current Position:</strong> {selectedUser.currentPosition}
                      </div>
                    )}
                    {selectedUser.company && (
                      <div className="col-md-6">
                        <strong>Company:</strong> {selectedUser.company}
                      </div>
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
                      <span className={`badge ms-2 ${
                        selectedUser.approvalStatus === 'pending' ? 'bg-warning' :
                        selectedUser.approvalStatus === 'approved' ? 'bg-success' : 'bg-danger'
                      }`}>
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
                    <i className="bi bi-check-circle"></i> Approve
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
                    <i className="bi bi-x-circle"></i> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card shadow">
          <div className="card-body">
            <h4 className="mb-3">
              <i className="bi bi-building"></i> {user?.department} Department Management
            </h4>
            <p>Manage all users, jobs, events, and mentorship programs within your department.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
