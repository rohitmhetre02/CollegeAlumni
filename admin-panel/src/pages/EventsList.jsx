import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { uploadGeneralImageToBackend } from '../utils/upload';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EventsList = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      const res = await api.get('/events');
      const eventsData = (res.data || []).map(e => ({
        ...e,
        attendees: e.attendees?.length || 0,
        image: e.image || null
      }));
      setList(eventsData);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setList([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (user?.department) {
      setEventForm(f => ({ ...f, department: user.department }));
    }
  }, [user]);

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

  const filteredList = list.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0"><i className="bi bi-calendar-event"></i> Event</h2>
          {canCreateEvent() && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Create Event
            </button>
          )}
        </div>
        
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
      </div>
    </div>
  );
};

export default EventsList;


