import { useEffect, useState } from 'react';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NewsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/news');
        setList(res.data || []);
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredList = list.filter(news =>
    news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4"><i className="bi bi-newspaper"></i> News</h2>
        
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
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title flex-grow-1">{n.title}</h5>
                        <span className="badge bg-warning text-dark ms-2">{n.department || 'General'}</span>
                      </div>
                      <p className="card-text mb-3">{n.summary}</p>
                      <small className="text-muted">
                        <i className="bi bi-calendar"></i> {new Date(n.publishedAt || n.createdAt).toLocaleDateString()}
                      </small>
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
      </div>
    </div>
  );
};

export default NewsList;


