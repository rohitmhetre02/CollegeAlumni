import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    department: '',
    role: 'student', // 'student' or 'alumni'
    currentYear: '',
    graduationYear: '',
    mobileNumber: '',
    email: ''
  });

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    // Pre-fill form with user data if available
    setRegistrationForm({
      name: user?.name || '',
      department: user?.department || '',
      role: user?.role === 'alumni' ? 'alumni' : 'student',
      currentYear: user?.role === 'student' ? calculateCurrentYear(user?.graduationYear) : '',
      graduationYear: user?.graduationYear || '',
      mobileNumber: user?.mobileNumber || user?.phoneNumber || '',
      email: user?.email || ''
    });
    setShowRegisterModal(true);
  };

  const calculateCurrentYear = (graduationYear) => {
    if (!graduationYear) return '';
    const currentYear = new Date().getFullYear();
    const yearDiff = graduationYear - currentYear;
    if (yearDiff === 4) return 'FE';
    if (yearDiff === 3) return 'SE';
    if (yearDiff === 2) return 'TE';
    if (yearDiff === 1) return 'BE';
    return '';
  };

  const handleRegisterSubmit = async () => {
    // Validate form
    if (!registrationForm.name || !registrationForm.department || !registrationForm.mobileNumber || !registrationForm.email) {
      alert('Please fill in all required fields');
      return;
    }
    if (registrationForm.role === 'alumni' && !registrationForm.graduationYear) {
      alert('Please enter graduation year for alumni');
      return;
    }
    if (registrationForm.role === 'student' && !registrationForm.currentYear) {
      alert('Please enter current year for student');
      return;
    }

    setRegistering(true);
    try {
      // Submit registration with form data
      await api.post(`/events/${id}/register`, {
        name: registrationForm.name,
        department: registrationForm.department,
        role: registrationForm.role,
        currentYear: registrationForm.role === 'student' ? registrationForm.currentYear : undefined,
        graduationYear: registrationForm.role === 'alumni' ? registrationForm.graduationYear : undefined,
        mobileNumber: registrationForm.mobileNumber,
        email: registrationForm.email
      });
      alert('Registered successfully!');
      setShowRegisterModal(false);
      setRegistrationForm({
        name: '',
        department: '',
        role: 'student',
        currentYear: '',
        graduationYear: '',
        mobileNumber: '',
        email: ''
      });
      fetchEvent();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const isRegistered = () => {
    if (!event || !event.attendees || !Array.isArray(event.attendees)) return false;
    return event.attendees.some(attendee => attendee.user?._id === user?.id || attendee.user === user?.id);
  };

  const isEventOwner = () => {
    if (!event || !user) return false;
    return event.organizer?._id === user.id || event.organizer === user.id || 
           user.role === 'admin' || user.role === 'coordinator';
  };

  const fetchRegistrations = async () => {
    setLoadingRegistrations(true);
    try {
      const response = await api.get(`/events/${id}/registrations`);
      setRegistrations(response.data.registrations || []);
      setShowRegistrationsModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch registrations');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Sr. No.', 'Name', 'Department', 'Role', 'Current Year', 'Graduation Year', 'Mobile Number', 'Email', 'Registered At'];
    
    const rows = registrations.map((reg, index) => [
      index + 1,
      reg.name || reg.user?.name || 'N/A',
      reg.department || reg.user?.department || 'N/A',
      reg.role || reg.user?.role || 'N/A',
      reg.currentYear || 'N/A',
      reg.graduationYear || 'N/A',
      reg.mobileNumber || 'N/A',
      reg.email || reg.user?.email || 'N/A',
      reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : 'N/A'
    ]);

    // Convert to CSV format
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_')}_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Event Registrations - ${event.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4F46E5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${event.title} - Registrations</h1>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Total Registrations:</strong> ${registrations.length}</p>
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Current Year</th>
                <th>Graduation Year</th>
                <th>Mobile Number</th>
                <th>Email</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              ${registrations.map((reg, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${reg.name || reg.user?.name || 'N/A'}</td>
                  <td>${reg.department || reg.user?.department || 'N/A'}</td>
                  <td>${reg.role || reg.user?.role || 'N/A'}</td>
                  <td>${reg.currentYear || 'N/A'}</td>
                  <td>${reg.graduationYear || 'N/A'}</td>
                  <td>${reg.mobileNumber || 'N/A'}</td>
                  <td>${reg.email || reg.user?.email || 'N/A'}</td>
                  <td>${reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #4F46E5; color: white; border: none; cursor: pointer;">Print</button>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Reunion': '#1976D2',
      'Webinar': '#42A5F5',
      'Recreation': '#66BB6A',
      'Conference': '#1976D2',
      'Networking': '#AB47BC',
      'Workshop': '#FFA726',
      'Career': '#26A69A'
    };
    return colors[category] || '#1976D2';
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

  if (!event) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">Event not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/events-directory')}>
          <i className="bi bi-arrow-left"></i> Back to Events
        </button>

        <div className="card shadow-sm">
          {event.image && (
            <img src={event.image} alt={event.title} className="card-img-top" style={{ maxHeight: '400px', objectFit: 'cover' }} />
          )}
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h2 className="mb-2">{event.title}</h2>
                <span
                  className="badge"
                  style={{
                    background: getCategoryColor(event.category),
                    color: 'white',
                    fontSize: '14px',
                    padding: '6px 12px'
                  }}
                >
                  {event.category}
                </span>
              </div>
              {!isRegistered() && (
                <button
                  className="btn btn-primary"
                  onClick={handleRegisterClick}
                  disabled={registering}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  {registering ? 'Registering...' : 'Register'}
                </button>
              )}
              {isRegistered() && (
                <span className="badge bg-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Registered
                </span>
              )}
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <p><strong><i className="bi bi-calendar-event"></i> Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong><i className="bi bi-clock"></i> Time:</strong> {event.time}</p>
                <p><strong><i className="bi bi-geo-alt"></i> Location:</strong> {event.location}</p>
              </div>
              <div className="col-md-6">
                <p><strong><i className="bi bi-building"></i> Department:</strong> {event.department}</p>
                {event.maxAttendees && (
                  <p><strong><i className="bi bi-people"></i> Max Attendees:</strong> {event.maxAttendees}</p>
                )}
                {event.attendees && Array.isArray(event.attendees) && (
                  <p><strong><i className="bi bi-people-fill"></i> Registered:</strong> {event.attendees.length}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h5>Description</h5>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{event.description}</p>
            </div>

            {event.organizer && (
              <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Organized by: {event.organizer.name || 'Unknown'}
                </small>
                {isEventOwner() && (
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={fetchRegistrations}
                    disabled={loadingRegistrations}
                  >
                    <i className="bi bi-list-ul me-2"></i>
                    {loadingRegistrations ? 'Loading...' : 'View Registrations'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Registration Modal */}
        {showRegisterModal && event && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-calendar-check"></i> Register for Event: {event.title}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowRegisterModal(false);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={registrationForm.name}
                        onChange={(e) => setRegistrationForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={registrationForm.department}
                        onChange={(e) => setRegistrationForm(f => ({ ...f, department: e.target.value }))}
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Role *</label>
                      <select
                        className="form-select"
                        value={registrationForm.role}
                        onChange={(e) => setRegistrationForm(f => ({ ...f, role: e.target.value, graduationYear: e.target.value === 'student' ? '' : f.graduationYear }))}
                        required
                      >
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                      </select>
                    </div>
                    {registrationForm.role === 'student' && (
                      <div className="col-md-6">
                        <label className="form-label">Current Year *</label>
                        <select
                          className="form-select"
                          value={registrationForm.currentYear}
                          onChange={(e) => setRegistrationForm(f => ({ ...f, currentYear: e.target.value }))}
                          required
                        >
                          <option value="">Select Year</option>
                          <option value="FE">FE (First Year)</option>
                          <option value="SE">SE (Second Year)</option>
                          <option value="TE">TE (Third Year)</option>
                          <option value="BE">BE (Fourth Year)</option>
                        </select>
                      </div>
                    )}
                    {registrationForm.role === 'alumni' && (
                      <div className="col-md-6">
                        <label className="form-label">Graduation Year *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={registrationForm.graduationYear}
                          onChange={(e) => setRegistrationForm(f => ({ ...f, graduationYear: e.target.value }))}
                          placeholder="e.g., 2019"
                          min="1900"
                          max={new Date().getFullYear() + 10}
                          required
                        />
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={registrationForm.mobileNumber}
                        onChange={(e) => setRegistrationForm(f => ({ ...f, mobileNumber: e.target.value }))}
                        placeholder="e.g., +91 9876543210"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={registrationForm.email}
                        onChange={(e) => setRegistrationForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="e.g., example@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowRegisterModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRegisterSubmit}
                    disabled={registering}
                  >
                    {registering ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Register
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registrations Modal */}
        {showRegistrationsModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-list-ul"></i> Event Registrations: {event.title}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowRegistrationsModal(false);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <p className="mb-0"><strong>Total Registrations:</strong> {registrations.length}</p>
                      <small className="text-muted">Date: {new Date(event.date).toLocaleDateString()} | Location: {event.location}</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={exportToExcel}
                        disabled={registrations.length === 0}
                      >
                        <i className="bi bi-file-earmark-excel me-2"></i>
                        Export to CSV
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handlePrint}
                        disabled={registrations.length === 0}
                      >
                        <i className="bi bi-printer me-2"></i>
                        Print
                      </button>
                    </div>
                  </div>
                  
                  {registrations.length === 0 ? (
                    <div className="alert alert-info text-center">
                      No registrations yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Sr. No.</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Current Year</th>
                            <th>Graduation Year</th>
                            <th>Mobile Number</th>
                            <th>Email</th>
                            <th>Registered At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrations.map((reg, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{reg.name || reg.user?.name || 'N/A'}</td>
                              <td>{reg.department || reg.user?.department || 'N/A'}</td>
                              <td>
                                <span className={`badge ${reg.role === 'student' ? 'bg-primary' : 'bg-success'}`}>
                                  {reg.role || reg.user?.role || 'N/A'}
                                </span>
                              </td>
                              <td>{reg.currentYear || 'N/A'}</td>
                              <td>{reg.graduationYear || 'N/A'}</td>
                              <td>{reg.mobileNumber || 'N/A'}</td>
                              <td>{reg.email || reg.user?.email || 'N/A'}</td>
                              <td>
                                {reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowRegistrationsModal(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;




