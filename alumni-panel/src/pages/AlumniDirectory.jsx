import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AlumniDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openChatWith } = useChat();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'alumni' } });
      setAlumni(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      setAlumni([]);
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter(alumnus => {
    const matchesSearch = alumnus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alumnus.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || alumnus.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const uniqueDepartments = [...new Set(alumni.map(a => a.department))];

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4">
        <h2 className="mb-4">
          <i className="bi bi-people-fill"></i> Alumni Directory
        </h2>

        {/* Search and Filter */}
        <div className="row mb-4">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alumni Cards */}
        <div className="row g-4">
          {filteredAlumni.map(alumnus => (
            <div className="col-md-4" key={alumnus._id}>
              <div className="card shadow h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/alumnus/${alumnus._id}`)}>
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-person-circle"></i> {alumnus.name}
                  </h5>
                  <p className="text-muted mb-2">
                    <i className="bi bi-envelope"></i> {alumnus.email}
                  </p>
                  <p className="mb-2">
                    <span className="badge bg-primary">{alumnus.department}</span>
                  </p>
                  {alumnus.currentPosition && (
                    <p className="mb-2">
                      <i className="bi bi-briefcase"></i> {alumnus.currentPosition}
                    </p>
                  )}
                  {alumnus.company && (
                    <p className="mb-2">
                      <i className="bi bi-building"></i> {alumnus.company}
                    </p>
                  )}
                  {alumnus.graduationYear && (
                    <p className="mb-2">
                      <i className="bi bi-calendar"></i> Class of {alumnus.graduationYear}
                    </p>
                  )}
                  {alumnus.phone && (
                    <p className="mb-0">
                      <i className="bi bi-telephone"></i> {alumnus.phone}
                    </p>
                  )}
                  <button className="btn btn-outline-primary mt-2 w-100" onClick={(e) => { e.stopPropagation(); openChatWith(alumnus); }}>
                    <i className="bi bi-chat-dots"></i> Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAlumni.length === 0 && (
          <div className="alert alert-info">
            No alumni found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectory;

