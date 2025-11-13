import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { uploadGeneralImageToBackend } from '../utils/upload';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EventsWithSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    department: user?.department || '',
    category: 'workshop',
    maxAttendees: '',
    image: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    department: '',
    role: 'student', // 'student' or 'alumni'
    graduationYear: '',
    mobileNumber: '',
    email: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

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

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      const eventsData = (response.data || []).map(e => ({
        ...e,
        attendees: Array.isArray(e.attendees) ? e.attendees : [],
        image: e.image || null
      }));
      setEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setLoading(false);
    }
  };

  const handleRegisterClick = (event) => {
    // Pre-fill form with user data if available
    setRegistrationForm({
      name: user?.name || '',
      department: user?.department || '',
      role: user?.role === 'alumni' ? 'alumni' : 'student',
      graduationYear: user?.graduationYear || '',
      mobileNumber: user?.mobileNumber || user?.phoneNumber || '',
      email: user?.email || ''
    });
    setSelectedEvent(event);
    setShowRegisterModal(true);
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

    setRegistering(true);
    try {
      // Submit registration with form data
      await api.post(`/events/${selectedEvent._id}/register`, {
        name: registrationForm.name,
        department: registrationForm.department,
        role: registrationForm.role,
        graduationYear: registrationForm.role === 'alumni' ? registrationForm.graduationYear : undefined,
        mobileNumber: registrationForm.mobileNumber,
        email: registrationForm.email
      });
      alert('Registered successfully!');
      setShowRegisterModal(false);
      setSelectedEvent(null);
      setRegistrationForm({
        name: '',
        department: '',
        role: 'student',
        graduationYear: '',
        mobileNumber: '',
        email: ''
      });
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const isRegistered = (event) => {
    if (!event.attendees || !Array.isArray(event.attendees)) return false;
    return event.attendees.some(attendee => attendee.user?._id === user?.id || attendee.user === user?.id);
  };

  const getAttendeesCount = (event) => {
    if (!event.attendees) return 0;
    return Array.isArray(event.attendees) ? event.attendees.length : 0;
  };

  const canCreateEvent = () => {
    return user?.role === 'alumni' || user?.role === 'admin' || user?.role === 'coordinator';
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadGeneralImageToBackend(file, 'alumni_portal/events');
      setEventForm(f => ({ ...f, image: imageUrl }));
      setImagePreview(imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      alert('Failed to upload image. Please try again.');
      console.error('Image upload error:', error);
    }
    setUploadingImage(false);
  };

  const handleCreateEvent = async () => {
    setCreating(true);
    try {
      const payload = {
        ...eventForm,
        maxAttendees: eventForm.maxAttendees ? parseInt(eventForm.maxAttendees) : undefined,
        date: new Date(eventForm.date).toISOString()
      };
      await api.post('/events', payload);
      setShowCreateModal(false);
      fetchEvents();
      alert('Event created successfully!');
      setEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        department: user?.department || '',
        category: 'workshop',
        maxAttendees: '',
        image: ''
      });
      setImagePreview('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create event');
    } finally {
      setCreating(false);
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

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="bi bi-calendar-event-fill"></i> Events
          </h2>
          {canCreateEvent() && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Create Event
            </button>
          )}
        </div>
        
        <div className="row g-4">
          {events.map(event => (
            <div className="col-md-6 col-lg-4" key={event._id}>
              <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} 
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = 'translateY(-4px)';
                     e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                   }}
                   onClick={() => navigate(`/event/${event._id}`)}>
                {/* Event Image */}
                {event.image && (
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <img 
                      src={event.image}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Featured Tag */}
                    {event.featured && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#1976D2',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        Featured
                      </div>
                    )}
                  </div>
                )}

                {/* Card Body */}
                <div className="card-body" style={{ padding: '20px' }}>
                  {/* Category Tag */}
                  <div className="mb-3">
                    <span 
                      style={{
                        background: getCategoryColor(event.category),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {event.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h5 className="card-title mb-2" style={{ fontSize: '18px', fontWeight: '700', color: '#333', lineHeight: '1.3' }}>
                    {event.title}
                  </h5>

                  {/* Description */}
                  <p className="card-text mb-3" style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', minHeight: '42px' }}>
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="mb-3" style={{ fontSize: '13px', color: '#666' }}>
                    <div className="mb-2 d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                      <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <i className="bi bi-clock me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                      <span>{event.time}</span>
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <i className="bi bi-geo-alt me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                      <span>{event.location}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-people me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                      <span>{getAttendeesCount(event)} attendees registered</span>
                    </div>
                  </div>

                  {/* Register Button - Available to all roles */}
                  <button
                    className="btn w-100"
                    onClick={(e) => { e.stopPropagation(); handleRegisterClick(event); }}
                    disabled={isRegistered(event)}
                    style={{
                      background: isRegistered(event) ? '#6c757d' : '#1976D2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: isRegistered(event) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                    {isRegistered(event) ? 'Registered' : 'Register Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="alert alert-info">
            <i className="bi bi-info-circle"></i> No events available at the moment.
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Event</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setImagePreview('');
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Event Title *</label>
                      <input
                        className="form-control"
                        value={eventForm.title}
                        onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g., Tech Conference 2025"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-control"
                        value={eventForm.category}
                        onChange={e => setEventForm(f => ({ ...f, category: e.target.value }))}
                      >
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                        <option value="networking">Networking</option>
                        <option value="conference">Conference</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date *</label>
                      <input
                        className="form-control"
                        type="datetime-local"
                        value={eventForm.date}
                        onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Time *</label>
                      <input
                        className="form-control"
                        value={eventForm.time}
                        onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                        placeholder="e.g., 10:00 AM - 6:00 PM"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Location *</label>
                      <input
                        className="form-control"
                        value={eventForm.location}
                        onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))}
                        placeholder="e.g., Main Campus Auditorium"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <input
                        className="form-control"
                        value={eventForm.department}
                        onChange={e => setEventForm(f => ({ ...f, department: e.target.value }))}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Max Attendees</label>
                      <input
                        className="form-control"
                        type="number"
                        value={eventForm.maxAttendees}
                        onChange={e => setEventForm(f => ({ ...f, maxAttendees: e.target.value }))}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Image</label>
                      <div className="mb-2">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        <small className="text-muted">
                          {uploadingImage ? 'Uploading...' : 'Upload image to Cloudinary (JPG, PNG, GIF - Max 5MB)'}
                        </small>
                      </div>
                      {imagePreview && (
                        <div className="mt-2">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            style={{ 
                              width: '100%', 
                              maxHeight: '200px', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: '2px solid #ddd'
                            }} 
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger mt-2"
                            onClick={() => {
                              setEventForm(f => ({ ...f, image: '' }));
                              setImagePreview('');
                            }}
                          >
                            <i className="bi bi-trash"></i> Remove Image
                          </button>
                        </div>
                      )}
                      {!imagePreview && eventForm.image && (
                        <div className="mt-2">
                          <label className="form-label small">Or enter image URL directly:</label>
                          <input
                            className="form-control form-control-sm"
                            type="url"
                            value={eventForm.image}
                            onChange={e => setEventForm(f => ({ ...f, image: e.target.value }))}
                            placeholder="Optional event image URL"
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={eventForm.description}
                        onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Event description, agenda, etc."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setImagePreview('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreateEvent}
                    disabled={creating || !eventForm.title || !eventForm.description || !eventForm.date || !eventForm.time || !eventForm.location}
                  >
                    {creating ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Modal */}
        {showRegisterModal && selectedEvent && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-calendar-check"></i> Register for Event: {selectedEvent.title}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowRegisterModal(false);
                      setSelectedEvent(null);
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
                      setSelectedEvent(null);
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
      </div>
    </div>
  );
};

export default EventsWithSidebar;

