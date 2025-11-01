import { useEffect, useState } from 'react';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AlumniDirectory = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users?role=alumni');
        setList(res.data || []);
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredList = list.filter(alumnus =>
    alumnus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumnus.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumnus.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4"><i className="bi bi-person-check"></i> Alumni Directory</h2>
        
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, or company..."
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
              {filteredList.map(u => (
                <div className="col-md-6 col-lg-4" key={u._id}>
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-person-check-fill text-success"></i> {u.name}
                      </h5>
                      <p className="text-muted mb-2">
                        <i className="bi bi-envelope"></i> {u.email}
                      </p>
                      <p className="mb-2">
                        <span className="badge bg-primary">{u.department}</span>
                      </p>
                      {u.company && (
                        <p className="mb-2">
                          <i className="bi bi-building"></i> <strong>{u.company}</strong>
                        </p>
                      )}
                      {u.currentPosition && (
                        <p className="mb-2">
                          <i className="bi bi-briefcase"></i> {u.currentPosition}
                        </p>
                      )}
                      {u.graduationYear && (
                        <p className="mb-3 text-muted">
                          <i className="bi bi-calendar"></i> Class of {u.graduationYear}
                        </p>
                      )}
                      <button className="btn btn-outline-primary btn-sm w-100">
                        <i className="bi bi-chat-dots"></i> Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredList.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> No alumni found matching your search.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectory;


