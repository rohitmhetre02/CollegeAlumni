import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { uploadGeneralImageToBackend } from '../utils/upload';

const Gallery = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category: 'all',
    batch: 'all',
    event: 'all',
    days: 'all',
    department: 'all',
    graduationYear: 'all'
  });

  // Filter values
  const [filterValues, setFilterValues] = useState({
    categories: [],
    batches: [],
    departments: [],
    graduationYears: [],
    events: []
  });

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    category: '',
    title: '',
    description: '',
    project: '',
    batch: '',
    event: '',
    graduationYear: '',
    tags: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchPhotos();
    fetchFilterValues();
  }, [filters]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/gallery?${params.toString()}`);
      setPhotos(response.data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterValues = async () => {
    try {
      const response = await api.get('/gallery/filters/values');
      setFilterValues(response.data || {
        categories: [],
        batches: [],
        departments: [],
        graduationYears: [],
        events: []
      });
    } catch (error) {
      console.error('Error fetching filter values:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    if (!uploadForm.category) {
      alert('Category is required');
      return;
    }

    try {
      setUploading(true);
      setUploadingImage(true);

      // Upload image to Cloudinary
      const imageUrl = await uploadGeneralImageToBackend(selectedImage, 'alumni_portal/gallery');

      // Prepare tags array
      const tags = uploadForm.tags
        ? uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      // Submit to backend
      const photoData = {
        imageUrl,
        category: uploadForm.category,
        title: uploadForm.title || '',
        description: uploadForm.description || '',
        project: uploadForm.project || '',
        batch: uploadForm.batch || '',
        event: uploadForm.event || '',
        graduationYear: uploadForm.graduationYear || null,
        tags
      };

      const response = await api.post('/gallery', photoData);
      
      // Add to photos list
      setPhotos([response.data, ...photos]);
      
      // Reset form
      setUploadForm({
        category: '',
        title: '',
        description: '',
        project: '',
        batch: '',
        event: '',
        graduationYear: '',
        tags: ''
      });
      setSelectedImage(null);
      setImagePreview('');
      setShowUploadModal(false);
      
      // Refresh filter values
      await fetchFilterValues();
      
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      await api.delete(`/gallery/${photoId}`);
      setPhotos(photos.filter(p => p._id !== photoId));
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(error.response?.data?.message || 'Failed to delete photo.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'event': 'primary',
      'batch': 'success',
      'project': 'info',
      'campus': 'warning',
      'achievement': 'danger',
      'other': 'secondary'
    };
    return colors[category] || 'secondary';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysFilterOptions = () => [
    { value: 'all', label: 'All Time' },
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '365', label: 'Last Year' }
  ];

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="bi bi-images"></i> Gallery
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            <i className="bi bi-plus-circle"></i> Upload Photo
          </button>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Filters</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {filterValues.categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Batch</label>
                <select
                  className="form-select"
                  value={filters.batch}
                  onChange={(e) => handleFilterChange('batch', e.target.value)}
                >
                  <option value="all">All Batches</option>
                  {filterValues.batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Event</label>
                <select
                  className="form-select"
                  value={filters.event}
                  onChange={(e) => handleFilterChange('event', e.target.value)}
                >
                  <option value="all">All Events</option>
                  {filterValues.events.map(event => (
                    <option key={event._id} value={event._id}>{event.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Time Period</label>
                <select
                  className="form-select"
                  value={filters.days}
                  onChange={(e) => handleFilterChange('days', e.target.value)}
                >
                  {getDaysFilterOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {filterValues.departments.length > 0 && (
                <div className="col-md-3">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {filterValues.departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}
              {filterValues.graduationYears.length > 0 && (
                <div className="col-md-3">
                  <label className="form-label">Graduation Year</label>
                  <select
                    className="form-select"
                    value={filters.graduationYear}
                    onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                  >
                    <option value="all">All Years</option>
                    {filterValues.graduationYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFilters({
                    category: 'all',
                    batch: 'all',
                    event: 'all',
                    days: 'all',
                    department: 'all',
                    graduationYear: 'all'
                  });
                }}
              >
                <i className="bi bi-x-circle"></i> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-images" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">No photos found. Upload the first photo!</p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {photos.map((photo) => (
              <div key={photo._id} className="col-md-4 col-lg-3">
                <div className="card shadow-sm h-100">
                  <div className="position-relative">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title || 'Gallery Photo'}
                      className="card-img-top"
                      style={{ 
                        height: '250px', 
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(photo.imageUrl, '_blank')}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found';
                      }}
                    />
                    <span className={`badge bg-${getCategoryBadgeColor(photo.category)} position-absolute top-0 end-0 m-2`}>
                      {photo.category.charAt(0).toUpperCase() + photo.category.slice(1)}
                    </span>
                  </div>
                  <div className="card-body">
                    {photo.title && <h6 className="card-title">{photo.title}</h6>}
                    {photo.description && (
                      <p className="card-text small text-muted">{photo.description.substring(0, 100)}{photo.description.length > 100 ? '...' : ''}</p>
                    )}
                    <div className="small text-muted mb-2">
                      <i className="bi bi-person"></i> {photo.uploadedBy?.name || 'Unknown'}
                      <br />
                      <i className="bi bi-calendar"></i> {formatDate(photo.uploadedAt)}
                    </div>
                    {photo.batch && (
                      <span className="badge bg-secondary me-1">{photo.batch}</span>
                    )}
                    {photo.project && (
                      <span className="badge bg-info me-1">Project: {photo.project}</span>
                    )}
                    {(user?.role === 'admin' || photo.uploadedBy?._id === user?.id) && (
                      <button
                        className="btn btn-sm btn-danger mt-2 w-100"
                        onClick={() => handleDelete(photo._id)}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Upload Photo</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedImage(null);
                      setImagePreview('');
                      setUploadForm({
                        category: '',
                        title: '',
                        description: '',
                        project: '',
                        batch: '',
                        event: '',
                        graduationYear: '',
                        tags: ''
                      });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Image Upload */}
                  <div className="mb-3">
                    <label className="form-label">
                      Photo <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Category (Required) */}
                  <div className="mb-3">
                    <label className="form-label">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="event">Event</option>
                      <option value="batch">Batch</option>
                      <option value="project">Project</option>
                      <option value="campus">Campus</option>
                      <option value="achievement">Achievement</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Title (Optional) */}
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Enter photo title"
                    />
                  </div>

                  {/* Description (Optional) */}
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Enter photo description"
                    />
                  </div>

                  {/* Project (Optional) */}
                  <div className="mb-3">
                    <label className="form-label">Project</label>
                    <input
                      type="text"
                      className="form-control"
                      value={uploadForm.project}
                      onChange={(e) => setUploadForm({ ...uploadForm, project: e.target.value })}
                      placeholder="Enter project name (optional)"
                    />
                  </div>

                  <div className="row">
                    {/* Batch (Optional) */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Batch</label>
                      <input
                        type="text"
                        className="form-control"
                        value={uploadForm.batch}
                        onChange={(e) => setUploadForm({ ...uploadForm, batch: e.target.value })}
                        placeholder="e.g., 2020-2024"
                      />
                    </div>

                    {/* Graduation Year (Optional) */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Graduation Year</label>
                      <input
                        type="number"
                        className="form-control"
                        value={uploadForm.graduationYear}
                        onChange={(e) => setUploadForm({ ...uploadForm, graduationYear: e.target.value })}
                        placeholder="e.g., 2024"
                        min="2000"
                        max="2099"
                      />
                    </div>
                  </div>

                  {/* Event (Optional) */}
                  <div className="mb-3">
                    <label className="form-label">Event</label>
                    <select
                      className="form-select"
                      value={uploadForm.event}
                      onChange={(e) => setUploadForm({ ...uploadForm, event: e.target.value })}
                    >
                      <option value="">Select Event (Optional)</option>
                      {filterValues.events.map(event => (
                        <option key={event._id} value={event._id}>{event.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags (Optional) */}
                  <div className="mb-3">
                    <label className="form-label">Tags</label>
                    <input
                      type="text"
                      className="form-control"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      placeholder="Comma-separated tags (optional)"
                    />
                    <small className="text-muted">e.g., graduation, ceremony, celebration</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedImage(null);
                      setImagePreview('');
                      setUploadForm({
                        category: '',
                        title: '',
                        description: '',
                        project: '',
                        batch: '',
                        event: '',
                        graduationYear: '',
                        tags: ''
                      });
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || !selectedImage || !uploadForm.category}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {uploadingImage ? 'Uploading Image...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload me-2"></i>Upload Photo
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

export default Gallery;

