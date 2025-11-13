import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, [id]);

  const fetchNews = async () => {
    try {
      const response = await api.get(`/news/${id}`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
      alert('Failed to load news details');
    } finally {
      setLoading(false);
    }
  };

  const getBackRoute = () => {
    if (user?.role === 'admin') return '/admin/news';
    if (user?.role === 'coordinator') return '/coordinator/news';
    return '/news';
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading news details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>News not found
          </div>
          <button className="btn btn-primary" onClick={() => navigate(getBackRoute())}>
            <i className="bi bi-arrow-left me-2"></i>Back to News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(getBackRoute())}>
          <i className="bi bi-arrow-left me-2"></i>Back to News
        </button>

        <div className="card shadow-sm mb-4">
          {news.image && (
            <img 
              src={news.image} 
              alt={news.title}
              className="card-img-top"
              style={{ maxHeight: '400px', objectFit: 'cover' }}
            />
          )}
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h2 className="mb-0">{news.title}</h2>
              <span className="badge bg-warning text-dark">{news.department || 'General'}</span>
            </div>

            <div className="d-flex align-items-center gap-3 mb-4 text-muted">
              <small>
                <i className="bi bi-calendar me-1"></i>
                {new Date(news.publishedAt || news.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </small>
              {news.department && (
                <small>
                  <i className="bi bi-building me-1"></i>
                  {news.department}
                </small>
              )}
              {news.author && (
                <small>
                  <i className="bi bi-person me-1"></i>
                  {news.author}
                </small>
              )}
            </div>

            {news.summary && (
              <div className="alert alert-info mb-4">
                <strong>Summary:</strong> {news.summary}
              </div>
            )}

            <div className="mb-4">
              <h5 className="mb-3">Content</h5>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '16px', color: '#333' }}>
                {news.content || news.summary || 'No content available.'}
              </div>
            </div>

            <div className="border-top pt-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">
                    <strong>Published:</strong> {new Date(news.publishedAt || news.createdAt).toLocaleString()}
                  </small>
                  {news.department && (
                    <small className="text-muted d-block">
                      <strong>Department:</strong> {news.department}
                    </small>
                  )}
                </div>
                <div className="col-md-6 text-end">
                  {news.author && (
                    <small className="text-muted d-block">
                      <strong>Author:</strong> {news.author}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => navigate(getBackRoute())}>
          <i className="bi bi-list me-2"></i>View All News
        </button>
      </div>
    </div>
  );
};

export default NewsDetail;

