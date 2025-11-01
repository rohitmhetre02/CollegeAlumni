import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
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

  const handleRegister = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/register`);
      alert('Registered successfully!');
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register');
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
              <div className="card shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`/event/${event._id}`)}>
                {/* Event Image */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img 
                    src={event.image || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000)}?w=800&h=400&fit=crop`}
                    alt={event.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x400?text=Event+Image';
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

                  {/* Register Button */}
                  {(user?.role === 'student' || user?.role === 'alumni') && (
                    <button
                      className="btn w-100"
                      onClick={(e) => { e.stopPropagation(); handleRegister(event._id); }}
                      disabled={isRegistered(event)}
                      style={{
                        background: '#1976D2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="bi bi-check-circle-fill"></i>
                      {isRegistered(event) ? 'Registered' : 'Register Now'}
                    </button>
                  )}
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
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
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
                      <label className="form-label">Image URL</label>
                      <input
                        className="form-control"
                        type="url"
                        value={eventForm.image}
                        onChange={e => setEventForm(f => ({ ...f, image: e.target.value }))}
                        placeholder="Optional event image URL"
                      />
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
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
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
      </div>
    </div>
  );
};

export default EventsWithSidebar;

