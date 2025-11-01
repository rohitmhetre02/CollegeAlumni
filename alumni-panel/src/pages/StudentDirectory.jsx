import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const StudentDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openChatWith } = useChat();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'student' } });
      setStudents(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || student.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const uniqueDepartments = [...new Set(students.map(s => s.department))];

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
          <i className="bi bi-person-badge"></i> Student Directory
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

        {/* Student Cards */}
        <div className="row g-4">
          {filteredStudents.map(student => (
            <div className="col-md-4" key={student._id}>
              <div className="card shadow h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/${student._id}`)}>
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-person-circle"></i> {student.name}
                  </h5>
                  <p className="text-muted mb-2">
                    <i className="bi bi-envelope"></i> {student.email}
                  </p>
                  <p className="mb-2">
                    <span className="badge bg-primary">{student.department}</span>
                  </p>
                  {student.enrollmentNumber && (
                    <p className="mb-2">
                      <i className="bi bi-card-text"></i> {student.enrollmentNumber}
                    </p>
                  )}
                  {student.phone && (
                    <p className="mb-0">
                      <i className="bi bi-telephone"></i> {student.phone}
                    </p>
                  )}
                  <button className="btn btn-outline-primary mt-2 w-100" onClick={(e) => { e.stopPropagation(); openChatWith(student); }}>
                    <i className="bi bi-chat-dots"></i> Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="alert alert-info">
            No students found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDirectory;

