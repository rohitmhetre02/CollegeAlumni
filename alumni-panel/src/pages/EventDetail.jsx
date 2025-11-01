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

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await api.post(`/events/${id}/register`);
      alert('Registered successfully!');
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
                  onClick={handleRegister}
                  disabled={registering}
                >
                  {registering ? 'Registering...' : 'Register'}
                </button>
              )}
              {isRegistered() && (
                <span className="badge bg-success">Registered</span>
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
              <div className="border-top pt-3">
                <small className="text-muted">
                  Organized by: {event.organizer.name || 'Unknown'}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;


