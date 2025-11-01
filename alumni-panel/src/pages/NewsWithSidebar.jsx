import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';

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
                <div className="card shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/news/${n._id}`)}>
                  <div className="card-body">
                    <h5 className="card-title">{n.title}</h5>
                    <p className="text-muted">{new Date(n.publishedAt || n.createdAt).toLocaleDateString()} {n.department && `• ${n.department}`}</p>
                    <p className="card-text">{n.summary}</p>
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
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
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
                      <label className="form-label">Image URL</label>
                      <input
                        className="form-control"
                        type="url"
                        value={newsForm.image}
                        onChange={e => setNewsForm(f => ({ ...f, image: e.target.value }))}
                        placeholder="Optional image URL"
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


