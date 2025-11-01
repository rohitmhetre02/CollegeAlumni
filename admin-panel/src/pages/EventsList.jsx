import { useEffect, useState } from 'react';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EventsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/events');
        const eventsData = (res.data || []).map(e => ({
          ...e,
          attendees: e.attendees?.length || 0,
          image: e.image || null
        }));
        setList(eventsData);
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredList = list.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4"><i className="bi bi-calendar-event"></i> Event</h2>
        
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search events by title, location, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="row g-4 mb-4">
              {filteredList.map(e => (
                <div className="col-md-6 col-lg-4" key={e._id}>
                  <div className="card shadow-sm h-100" style={{ borderRadius: '12px', overflow: 'hidden', border: 'none' }}>
                    {/* Event Image */}
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      <img 
                        src={e.image || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000)}?w=800&h=400&fit=crop`}
                        alt={e.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(err) => {
                          err.target.src = 'https://via.placeholder.com/800x400?text=Event+Image';
                        }}
                      />
                      {/* Featured Tag */}
                      {e.featured && (
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
                            background: getCategoryColor(e.category),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {e.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h5 className="card-title mb-2" style={{ fontSize: '18px', fontWeight: '700', color: '#333', lineHeight: '1.3' }}>
                        {e.title}
                      </h5>

                      {/* Description */}
                      <p className="card-text mb-3" style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', minHeight: '42px' }}>
                        {e.description || 'No description available.'}
                      </p>

                      {/* Event Details */}
                      <div className="mb-3" style={{ fontSize: '13px', color: '#666' }}>
                        <div className="mb-2 d-flex align-items-center">
                          <i className="bi bi-calendar3 me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                          <span>{new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="mb-2 d-flex align-items-center">
                          <i className="bi bi-clock me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                          <span>{e.time}</span>
                        </div>
                        <div className="mb-2 d-flex align-items-center">
                          <i className="bi bi-geo-alt me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                          <span>{e.location}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-people me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                          <span>{e.attendees || 0} attendees registered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredList.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> No events found matching your search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsList;


