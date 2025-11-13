import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { uploadGeneralImageToBackend } from '../utils/upload';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NewsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchNews = async () => {
    try {
      const res = await api.get('/news');
      setList(res.data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setList([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (user?.department) {
      setNewsForm(f => ({ ...f, department: user.department }));
    }
    if (user?.name) {
      setNewsForm(f => ({ ...f, author: user.name }));
    }
  }, [user]);

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
      fetchNews();
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

  const filteredList = list.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search news by title, summary, or department..."
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
              {filteredList.map(n => (
                <div className="col-md-6" key={n._id}>
                  <div className="card shadow-sm h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => {
                      if (user?.role === 'admin') {
                        navigate(`/admin/news/${n._id}`);
                      } else if (user?.role === 'coordinator') {
                        navigate(`/coordinator/news/${n._id}`);
                      }
                    }}>
                    {n.image && (
                      <img 
                        src={n.image} 
                        alt={n.title}
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    )}
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title flex-grow-1">{n.title}</h5>
                        <span className="badge bg-warning text-dark ms-2">{n.department || 'General'}</span>
                      </div>
                      <p className="card-text mb-3 flex-grow-1">{n.summary || n.content?.substring(0, 150) + '...'}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i> 
                          {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                        </small>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user?.role === 'admin') {
                              navigate(`/admin/news/${n._id}`);
                            } else if (user?.role === 'coordinator') {
                              navigate(`/coordinator/news/${n._id}`);
                            }
                          }}
                        >
                          <i className="bi bi-eye me-1"></i>View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredList.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> No news found matching your search.
              </div>
            )}
          </>
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

export default NewsList;


