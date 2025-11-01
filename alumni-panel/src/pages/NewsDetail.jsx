import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    } finally {
      setLoading(false);
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

  if (!news) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">News not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/news')}>
          <i className="bi bi-arrow-left"></i> Back to News
        </button>

        <div className="card shadow-sm">
          {news.image && (
            <img src={news.image} alt={news.title} className="card-img-top" style={{ maxHeight: '400px', objectFit: 'cover' }} />
          )}
          <div className="card-body p-4">
            <h2 className="mb-3">{news.title}</h2>
            <div className="d-flex align-items-center gap-3 mb-4 text-muted">
              <small><i className="bi bi-calendar"></i> {new Date(news.publishedAt || news.createdAt).toLocaleDateString()}</small>
              {news.department && <small><i className="bi bi-building"></i> {news.department}</small>}
              {news.author && <small><i className="bi bi-person"></i> {news.author}</small>}
            </div>

            {news.summary && (
              <div className="alert alert-info mb-4">
                <strong>Summary:</strong> {news.summary}
              </div>
            )}

            <div className="mb-4">
              <h5>Content</h5>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '16px' }}>
                {news.content || news.summary}
              </div>
            </div>

            <div className="border-top pt-3">
              <small className="text-muted">
                Published: {new Date(news.publishedAt || news.createdAt).toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;


