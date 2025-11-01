import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MentorDashboard = () => {
  const { mentorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentorship, setMentorship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    type: 'resource',
    fileUrl: '',
    price: 0,
    duration: 30,
    isFree: false,
    isBestSeller: false
  });

  useEffect(() => {
    fetchMentorProfile();
  }, [mentorId]);

  const fetchMentorProfile = async () => {
    try {
      const response = await api.get(`/mentorships/mentor/${mentorId}`);
      setMentorship(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentor profile:', error);
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    if (!mentorship) return 0;
    let completed = 0;
    let total = 7;

    if (mentorship.about) completed++;
    if (mentorship.topics && mentorship.topics.length > 0) completed++;
    if (mentorship.skills && mentorship.skills.length > 0) completed++;
    if (mentorship.resources && mentorship.resources.length > 0) completed++;
    if (user?.education) completed++;
    if (user?.linkedinUrl) completed++;
    if (mentorship.isAvailable !== false) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleAddResource = async () => {
    try {
      await api.post(`/mentorships/${mentorship._id}/resources`, resourceForm);
      setShowResourceModal(false);
      setResourceForm({
        title: '',
        description: '',
        type: 'resource',
        fileUrl: '',
        price: 0,
        duration: 30,
        isFree: false,
        isBestSeller: false
      });
      fetchMentorProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add resource');
    }
  };

  const handleUpdateResource = async () => {
    try {
      await api.put(`/mentorships/${mentorship._id}/resources/${editingResource._id}`, resourceForm);
      setShowResourceModal(false);
      setEditingResource(null);
      setResourceForm({
        title: '',
        description: '',
        type: 'resource',
        fileUrl: '',
        price: 0,
        duration: 30,
        isFree: false,
        isBestSeller: false
      });
      fetchMentorProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update resource');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await api.delete(`/mentorships/${mentorship._id}/resources/${resourceId}`);
        fetchMentorProfile();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete resource');
      }
    }
  };

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  if (!mentorship) {
    return <div className="text-center p-5">Mentor profile not found</div>;
  }

  const completionPercentage = calculateCompletion();
  const hasEducation = user?.education || user?.degree || user?.college;
  const hasPayment = true; // Placeholder
  const hasAvailability = mentorship.isAvailable !== false;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1" style={{ marginLeft: '250px', padding: '20px' }}>
        {/* Welcome Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            Hi, {user?.name} 👋 Welcome to Your Dashboard
          </h2>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/mentor/${mentorId}`)}
          >
            <i className="bi bi-eye"></i> View Public Profile
          </button>
        </div>

        {/* Moderation Alert */}
        {user?.approvalStatus === 'pending' && (
          <div className="alert alert-warning mb-4">
            <i className="bi bi-exclamation-triangle"></i> Your profile is under moderation. Our admin team will take an action within 72 hours. However, your profile is not complete. Please complete your profile so that moderation process can be executed at the earliest.
          </div>
        )}

        {/* Next Steps Section */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Next steps for you</h4>
              <div className="d-flex align-items-center">
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#28a745"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * (completionPercentage / 100)} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#28a745'
                    }}
                  >
                    {completionPercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Cards */}
            <div className="row g-3 mb-4">
              {/* Add Availability */}
              <div className="col-md-4">
                <div
                  className="card h-100"
                  style={{ cursor: 'pointer', borderRadius: '12px' }}
                  onClick={() => {
                    // Navigate to availability settings
                    alert('Availability feature coming soon!');
                  }}
                >
                  <div className="card-body text-center position-relative">
                    {!hasAvailability && (
                      <span
                        className="badge bg-danger"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          padding: '0'
                        }}
                      ></span>
                    )}
                    <div className="mb-3" style={{ position: 'relative', display: 'inline-block' }}>
                      <i className="bi bi-calendar3" style={{ fontSize: '48px', color: '#007bff' }}></i>
                      <span
                        className="badge bg-warning"
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-plus" style={{ fontSize: '12px' }}></i>
                      </span>
                    </div>
                    <h6 className="mb-0">Add Availability</h6>
                  </div>
                </div>
              </div>

              {/* Add Payment */}
              <div className="col-md-4">
                <div
                  className="card h-100"
                  style={{ cursor: 'pointer', borderRadius: '12px' }}
                  onClick={() => {
                    // Navigate to payment settings
                    alert('Payment feature coming soon!');
                  }}
                >
                  <div className="card-body text-center position-relative">
                    {!hasPayment && (
                      <span
                        className="badge bg-danger"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          padding: '0'
                        }}
                      ></span>
                    )}
                    <div className="mb-3" style={{ position: 'relative', display: 'inline-block' }}>
                      <span style={{ fontSize: '48px', color: '#007bff' }}>₹</span>
                      <span
                        className="badge bg-warning"
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-plus" style={{ fontSize: '12px' }}></i>
                      </span>
                    </div>
                    <h6 className="mb-0">Add Payment</h6>
                  </div>
                </div>
              </div>

              {/* Add Education */}
              <div className="col-md-4">
                <div
                  className="card h-100"
                  style={{ cursor: 'pointer', borderRadius: '12px' }}
                  onClick={() => {
                    // Navigate to profile to add education
                    navigate('/profile');
                  }}
                >
                  <div className="card-body text-center position-relative">
                    {!hasEducation && (
                      <span
                        className="badge bg-danger"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          padding: '0'
                        }}
                      ></span>
                    )}
                    <div className="mb-3" style={{ position: 'relative', display: 'inline-block' }}>
                      <i className="bi bi-journal-bookmark" style={{ fontSize: '48px', color: '#007bff' }}></i>
                      <span
                        className="badge bg-warning"
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className="bi bi-plus" style={{ fontSize: '12px' }}></i>
                      </span>
                    </div>
                    <h6 className="mb-0">Add Education</h6>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Cards */}
            <h5 className="mb-3">Your Services</h5>
            <div className="row g-3">
              {mentorship.resources && mentorship.resources.length > 0 ? (
                mentorship.resources.map((resource, idx) => (
                  <div className="col-md-4" key={idx}>
                    <div className="card h-100" style={{ borderRadius: '12px' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <i className="bi bi-camera-video" style={{ fontSize: '24px', color: '#007bff' }}></i>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setEditingResource(resource);
                              setResourceForm({
                                title: resource.title,
                                description: resource.description || '',
                                type: resource.type,
                                fileUrl: resource.fileUrl || '',
                                price: resource.price || 0,
                                duration: resource.duration || 30,
                                isFree: resource.isFree || false,
                                isBestSeller: resource.isBestSeller || false
                              });
                              setShowResourceModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                        </div>
                        <h6 className="mb-2">{resource.title}</h6>
                        <p className="text-muted small mb-2">{resource.description || 'No description'}</p>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>{resource.duration || 30} min Duration</span>
                          <span className="fw-bold">
                            {resource.isFree ? 'Free' : `₹${resource.price || 0}`}
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-danger mt-2"
                          onClick={() => handleDeleteResource(resource._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info">
                    No services added yet. Click the button below to add your first service.
                  </div>
                </div>
              )}
              <div className="col-md-4">
                <div
                  className="card h-100 border-dashed"
                  style={{
                    borderRadius: '12px',
                    border: '2px dashed #ddd',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px'
                  }}
                  onClick={() => {
                    setEditingResource(null);
                    setResourceForm({
                      title: '',
                      description: '',
                      type: 'resource',
                      fileUrl: '',
                      price: 0,
                      duration: 30,
                      isFree: false,
                      isBestSeller: false
                    });
                    setShowResourceModal(true);
                  }}
                >
                  <div className="text-center">
                    <i className="bi bi-plus-circle" style={{ fontSize: '48px', color: '#999' }}></i>
                    <p className="mt-2 text-muted">Add New Service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Resource Modal */}
      {showResourceModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingResource ? 'Edit Service' : 'Add New Service'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowResourceModal(false);
                    setEditingResource(null);
                    setResourceForm({
                      title: '',
                      description: '',
                      type: 'resource',
                      fileUrl: '',
                      price: 0,
                      duration: 30,
                      isFree: false,
                      isBestSeller: false
                    });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Service Type</label>
                  <select
                    className="form-select"
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  >
                    <option value="resource">Resource</option>
                    <option value="1:1_call">1:1 Call</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  ></textarea>
                </div>
                {resourceForm.type === '1:1_call' && (
                  <div className="mb-3">
                    <label className="form-label">Duration (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={resourceForm.duration}
                      onChange={(e) => setResourceForm({ ...resourceForm, duration: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={resourceForm.price}
                    onChange={(e) => setResourceForm({ ...resourceForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={resourceForm.isFree}
                      onChange={(e) => setResourceForm({ ...resourceForm, isFree: e.target.checked, price: e.target.checked ? 0 : resourceForm.price })}
                    />
                    <label className="form-check-label">Free Service</label>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">File URL (optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    value={resourceForm.fileUrl}
                    onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowResourceModal(false);
                    setEditingResource(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={editingResource ? handleUpdateResource : handleAddResource}
                >
                  {editingResource ? 'Update' : 'Add'} Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;

