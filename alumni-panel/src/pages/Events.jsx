import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
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
    return event.attendees?.some(attendee => attendee.user?._id === user?.id);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Events</h2>
      
      <div className="row g-4">
        {events.map(event => (
          <div className="col-md-6" key={event._id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">{event.title}</h5>
                <p className="text-muted">
                  <i className="bi bi-calendar"></i> {new Date(event.date).toLocaleDateString()}
                  <br />
                  <i className="bi bi-clock"></i> {event.time}
                  <br />
                  <i className="bi bi-geo-alt"></i> {event.location}
                </p>
                <p className="card-text">{event.description}</p>
                <div className="mb-2">
                  <span className="badge bg-info">{event.category}</span>
                  <span className="badge bg-secondary ms-2">{event.department}</span>
                </div>
                {(user?.role === 'student' || user?.role === 'alumni') && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleRegister(event._id)}
                    disabled={isRegistered(event)}
                  >
                    {isRegistered(event) ? 'Registered' : 'Register'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <p className="text-center text-muted">No events available at the moment.</p>
      )}
    </div>
  );
};

export default Events;

