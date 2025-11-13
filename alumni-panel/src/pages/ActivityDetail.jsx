import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const response = await api.get(`/activities/${id}`);
      setActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      job: 'bi-briefcase-fill',
      event: 'bi-calendar-event-fill',
      mentorship: 'bi-people-fill',
      profile: 'bi-person-fill',
      message: 'bi-chat-dots-fill',
      news: 'bi-newspaper'
    };
    return icons[type] || 'bi-activity';
  };

  const getActivityColor = (type) => {
    const colors = {
      job: 'primary',
      event: 'success',
      mentorship: 'info',
      profile: 'secondary',
      message: 'warning',
      news: 'danger'
    };
    return colors[type] || 'dark';
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

  if (!activity) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="alert alert-warning">Activity not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/my-activity')}>
          <i className="bi bi-arrow-left"></i> Back to Activities
        </button>

        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex align-items-start mb-4">
              <div className={`bg-${getActivityColor(activity.type)} bg-opacity-10 rounded-circle p-4 me-3`}>
                <i className={`bi ${getActivityIcon(activity.type)} text-${getActivityColor(activity.type)}`} style={{ fontSize: '2rem' }}></i>
              </div>
              <div className="flex-grow-1">
                <h2 className="mb-2">{activity.title}</h2>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className={`badge bg-${getActivityColor(activity.type)}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                    {activity.type}
                  </span>
                  <small className="text-muted">
                    <i className="bi bi-clock"></i> {new Date(activity.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="mb-3">Description</h5>
              <p className="text-muted" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                {activity.description}
              </p>
            </div>

            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="mb-4">
                <h5 className="mb-3">Additional Information</h5>
                <div className="row">
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <div className="col-md-6 mb-2" key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-top pt-3">
              <small className="text-muted">
                Activity ID: {activity._id}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;




