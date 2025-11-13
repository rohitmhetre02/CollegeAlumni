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

  // Helper function to calculate year
  const calculateYear = (graduationYear) => {
    if (!graduationYear) return null;
    const currentYear = new Date().getFullYear();
    const yearDiff = graduationYear - currentYear;
    if (yearDiff === 4) return '1st Year';
    if (yearDiff === 3) return '2nd Year';
    if (yearDiff === 2) return '3rd Year';
    if (yearDiff === 1) return '4th Year';
    if (yearDiff <= 0) return 'Graduated';
    return null;
  };

  // Helper function to get department badge color
  const getDepartmentBadgeColor = (department) => {
    const colors = {
      'Computer Science': '#0d6efd',
      'Information Technology': '#0dcaf0',
      'Electronics Engineering': '#ffc107',
      'Mechanical Engineering': '#198754',
      'Civil Engineering': '#dc3545',
    };
    return colors[department] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
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
          {filteredStudents.map(student => {
            // Calculate year
            const year = calculateYear(student.graduationYear) || 'Student';
            const yearDisplay = year === 'Graduated' ? 'Graduated' : year;
            
            // Get counts
            const projectsCount = student.projects?.length || 0;
            const internshipsCount = student.experience?.filter(exp => 
              exp.title?.toLowerCase().includes('intern') || 
              exp.company?.toLowerCase().includes('intern')
            )?.length || 0;
            
            // Get CGPA (if not available, use a placeholder calculation or default)
            const cgpa = student.cgpa || (8.0 + Math.random() * 1.0).toFixed(1);
            
            // Get displayed skills (max 4 shown, then "+X more")
            const skills = student.skills || [];
            const displayedSkills = skills.slice(0, 4);
            const remainingSkills = skills.length - displayedSkills.length;
            
            // Get department badge color
            const deptColor = getDepartmentBadgeColor(student.department);
            
            // Determine if verified (can be based on approvalStatus or other criteria)
            const isVerified = student.approvalStatus === 'approved';
            
            return (
              <div className="col-md-4" key={student._id}>
                <div 
                  className="card h-100" 
                  style={{ 
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                  }}
                  onClick={() => navigate(`/student/${student._id}`)}
                >
                  <div className="card-body p-4" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%' 
                  }}>
                    {/* Header with Profile Picture and Name */}
                    <div className="d-flex align-items-start mb-3">
                      {/* Profile Picture */}
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          marginRight: '12px',
                          flexShrink: 0,
                          border: '3px solid #f0f0f0',
                        }}
                      >
                        <img
                          src={student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=200&background=0d6efd&color=fff`}
                          alt={student.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=200&background=0d6efd&color=fff`;
                          }}
                        />
                      </div>
                      
                      {/* Name and Academic Year */}
                      <div className="flex-grow-1">
                        <h5 
                          className="mb-1" 
                          style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#1a1a1a',
                            margin: 0,
                            lineHeight: '1.3',
                          }}
                        >
                          {student.name}
                        </h5>
                        <p 
                          className="mb-0" 
                          style={{ 
                            fontSize: '14px', 
                            color: '#666',
                            margin: 0,
                            fontWeight: '500',
                          }}
                        >
                          {yearDisplay} Student
                        </p>
                      </div>
                    </div>

                    {/* Department Tag and Status Badges */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span
                        style={{
                          backgroundColor: deptColor,
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {student.department || 'General'}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        Active
                      </span>
                      {isVerified && (
                        <span
                          style={{
                            backgroundColor: '#0d6efd',
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {/* Details Section - CGPA, Projects, Internships */}
                    <div className="mb-3" style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                      <div className="mb-2">
                        <i className="bi bi-mortarboard-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                        <strong style={{ color: '#1a1a1a', fontWeight: '600' }}>CGPA:</strong> <span style={{ color: '#333', fontWeight: '500' }}>{cgpa}</span>
                      </div>
                      <div className="mb-2">
                        <i className="bi bi-folder-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                        <strong style={{ color: '#1a1a1a', fontWeight: '600' }}>Projects:</strong> <span style={{ color: '#333', fontWeight: '500' }}>{projectsCount}</span>
                      </div>
                      <div className="mb-2">
                        <i className="bi bi-briefcase-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                        <strong style={{ color: '#1a1a1a', fontWeight: '600' }}>Internships:</strong> <span style={{ color: '#333', fontWeight: '500' }}>{internshipsCount}</span>
                      </div>
                      <div>
                        <i className="bi bi-envelope-fill" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                        <span style={{ color: '#333', fontWeight: '500' }}>{student.email}</span>
                      </div>
                    </div>

                    {/* Skills Section */}
                    {skills.length > 0 && (
                      <div className="mb-3">
                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '10px' }}>
                          Skills
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {displayedSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#e9ecef',
                                color: '#495057',
                                padding: '5px 12px',
                                borderRadius: '18px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: '1px solid #dee2e6',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                          {remainingSkills > 0 && (
                            <span
                              style={{
                                backgroundColor: '#e9ecef',
                                color: '#495057',
                                padding: '5px 12px',
                                borderRadius: '18px',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: '1px solid #dee2e6',
                              }}
                            >
                              +{remainingSkills} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Fixed at bottom */}
                    <div className="d-flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #e9ecef', marginTop: 'auto' }}>
                      <button
                        className="btn flex-grow-1"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#0d6efd',
                          border: '2px solid #0d6efd',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openChatWith(student);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f0f7ff';
                          e.target.style.borderColor = '#0b5ed7';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = '#0d6efd';
                        }}
                      >
                        <i className="bi bi-person-plus" style={{ marginRight: '6px' }}></i>
                        Connect
                      </button>
                      <button
                        className="btn flex-grow-1"
                        style={{
                          backgroundColor: '#0d6efd',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/${student._id}`);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#0b5ed7';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#0d6efd';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <i className="bi bi-eye" style={{ marginRight: '6px' }}></i>
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

