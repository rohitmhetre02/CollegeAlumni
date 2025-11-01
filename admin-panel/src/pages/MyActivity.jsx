import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MyActivity = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/activities/mine');
        setList(res.data || []);
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getActivityIcon = (type) => {
    const icons = {
      job: 'bi-briefcase-fill',
      event: 'bi-calendar-event-fill',
      faculty: 'bi-mortarboard-fill',
      news: 'bi-newspaper',
      student: 'bi-person-fill',
      alumni: 'bi-person-check-fill'
    };
    return icons[type] || 'bi-activity';
  };

  const getActivityColor = (type) => {
    const colors = {
      job: 'primary',
      event: 'success',
      faculty: 'info',
      news: 'warning',
      student: 'secondary',
      alumni: 'danger'
    };
    return colors[type] || 'dark';
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4"><i className="bi bi-clipboard-data"></i> My Activity</h2>
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {list.map(a => (
              <div className="col-md-6" key={a._id}>
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-start mb-3">
                      <div className={`bg-${getActivityColor(a.type)} bg-opacity-10 rounded-circle p-3 me-3`}>
                        <i className={`bi ${getActivityIcon(a.type)} text-${getActivityColor(a.type)} fs-4`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-1">{a.title}</h5>
                        <small className="text-muted">
                          <i className="bi bi-clock"></i> {new Date(a.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <p className="card-text mb-2">{a.description}</p>
                    <span className={`badge bg-${getActivityColor(a.type)}`}>{a.type}</span>
                  </div>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle"></i> No activity yet.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivity;


