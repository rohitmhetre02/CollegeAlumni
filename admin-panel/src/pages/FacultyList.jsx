import { useEffect, useState } from 'react';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const FacultyList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users?role=coordinator');
        const facultyData = (res.data || []).map(f => ({
          ...f,
          profileImage: f.profilePicture || f.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1976D2&color=fff&size=200`
        }));
        setList(facultyData);
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleViewProfile = (facultyId) => {
    // Navigate to profile or show details
    console.log('View profile:', facultyId);
  };

  const filteredList = list.filter(faculty =>
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4"><i className="bi bi-mortarboard"></i> Faculty</h2>
        
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, or department..."
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
              {filteredList.map(f => (
                <div className="col-md-6 col-lg-4" key={f._id}>
                  <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: 'none', overflow: 'hidden' }}>
                    <div className="card-body text-center" style={{ padding: '24px' }}>
                      {/* Profile Image */}
                      <div 
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          margin: '0 auto 16px',
                          overflow: 'hidden',
                          border: '4px solid #f0f0f0',
                          background: '#f0f0f0'
                        }}
                      >
                        <img 
                          src={f.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1976D2&color=fff&size=200`}
                          alt={f.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&size=200`;
                          }}
                        />
                      </div>

                      {/* Name */}
                      <h5 className="card-title mb-2" style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                        {f.name}
                      </h5>

                      {/* Department */}
                      <p className="mb-2">
                        <span className="badge bg-primary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                          {f.department}
                        </span>
                      </p>

                      {/* Title/Designation */}
                      <p className="mb-3" style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                        {f.designation || f.title || 'Faculty'}
                      </p>

                      {/* View Profile Button */}
                      <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={() => handleViewProfile(f._id)}
                        style={{
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderWidth: '1.5px'
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredList.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> No faculty found matching your search.
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyList;


