import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import { uploadGeneralImageToBackend } from '../utils/upload';

const NewsWithSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    content: '',
    department: user?.department || '',
    image: '',
    author: user?.name || ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/news');
        setNews(res.data || []);
      } catch (e) {
        console.error(e);
        setNews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canCreateNews = () => {
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
      const imageUrl = await uploadGeneralImageToBackend(file, 'alumni_portal/news');
      setNewsForm(f => ({ ...f, image: imageUrl }));
      setImagePreview(imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      alert('Failed to upload image. Please try again.');
      console.error('Image upload error:', error);
    }
    setUploadingImage(false);
  };

  const handleCreateNews = async () => {
    setCreating(true);
    try {
      await api.post('/news', newsForm);
      setShowCreateModal(false);
      setNews([]);
      const res = await api.get('/news');
      setNews(res.data || []);
      alert('News created successfully!');
      setNewsForm({
        title: '',
        summary: '',
        content: '',
        department: user?.department || '',
        image: '',
        author: user?.name || ''
      });
      setImagePreview('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create news');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0"><i className="bi bi-newspaper"></i> News</h2>
          {canCreateNews() && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Create News
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="row g-4">
            {news.map(n => (
              <div className="col-md-6" key={n._id}>
                <div 
                  className="card shadow-sm h-100 border-0" 
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onClick={() => navigate(`/news/${n._id}`)}
                >
                  {/* News Image */}
                  {n.image && (
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      <img 
                        src={n.image} 
                        alt={n.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="card-body p-4">
                    <h5 className="card-title mb-2" style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                      {n.title}
                    </h5>
                    <p className="text-muted small mb-3">
                      {new Date(n.publishedAt || n.createdAt).toLocaleDateString()} 
                      {n.department && ` • ${n.department}`}
                      {n.author && ` • ${n.author}`}
                    </p>
                    <p className="card-text" style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                      {n.summary}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {news.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">No news available.</div>
              </div>
            )}
          </div>
        )}

        {/* Create News Modal */}
        {showCreateModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create News</h5>
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
                      <label className="form-label">Title *</label>
                      <input
                        className="form-control"
                        value={newsForm.title}
                        onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="News title"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input
                        className="form-control"
                        value={newsForm.department}
                        onChange={e => setNewsForm(f => ({ ...f, department: e.target.value }))}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Summary *</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={newsForm.summary}
                        onChange={e => setNewsForm(f => ({ ...f, summary: e.target.value }))}
                        placeholder="Brief summary of the news"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Content *</label>
                      <textarea
                        className="form-control"
                        rows={6}
                        value={newsForm.content}
                        onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))}
                        placeholder="Full news content"
                      />
                    </div>
                    <div className="col-12">
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
                              setNewsForm(f => ({ ...f, image: '' }));
                              setImagePreview('');
                            }}
                          >
                            <i className="bi bi-trash"></i> Remove Image
                          </button>
                        </div>
                      )}
                      {!imagePreview && newsForm.image && (
                        <div className="mt-2">
                          <label className="form-label small">Or enter image URL directly:</label>
                          <input
                            className="form-control form-control-sm"
                            type="url"
                            value={newsForm.image}
                            onChange={e => setNewsForm(f => ({ ...f, image: e.target.value }))}
                            placeholder="Optional image URL"
                          />
                        </div>
                      )}
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
                    onClick={handleCreateNews}
                    disabled={creating || !newsForm.title || !newsForm.summary || !newsForm.content}
                  >
                    {creating ? 'Creating...' : 'Create News'}
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

export default NewsWithSidebar;


