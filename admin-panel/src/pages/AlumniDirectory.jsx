import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AlumniDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchAlumni();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('[data-dropdown]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    // Remove any existing country code or spaces
    const cleaned = phone.replace(/^\+91\s*/, '').replace(/\s+/g, '');
    // Format as +91 9370949370 (10 digits after +91)
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    // If already has country code or different format, return as is
    return phone.startsWith('+') ? phone : `+91 ${cleaned}`;
  };

  const getDetailRoute = (alumnusId) => {
    if (user?.role === 'admin') {
      return `/admin/alumni/${alumnusId}`;
    } else if (user?.role === 'coordinator') {
      return `/coordinator/alumni/${alumnusId}`;
    }
    return `/alumni/${alumnusId}`;
  };

  const filteredAlumni = useMemo(() => {
    return alumni.filter(alumnus => {
      const matchesSearch = 
        alumnus.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumnus.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumnus.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || alumnus.department === departmentFilter;
      
      const matchesYear = !yearFilter || alumnus.graduationYear === parseInt(yearFilter);
      
      return matchesSearch && matchesDepartment && matchesYear;
    });
  }, [alumni, searchTerm, departmentFilter, yearFilter]);

  const sortedAlumni = useMemo(() => {
    if (!sortConfig.key) return filteredAlumni;
    
    return [...filteredAlumni].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'roll':
          aValue = a.enrollmentNumber || '';
          bValue = b.enrollmentNumber || '';
          break;
        case 'class':
          aValue = a.graduationYear || '';
          bValue = b.graduationYear || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAlumni, sortConfig]);

  const paginatedAlumni = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAlumni.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAlumni, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedAlumni.length / itemsPerPage);

  const uniqueDepartments = [...new Set(alumni.map(a => a.department).filter(Boolean))];
  const uniqueYears = [...new Set(alumni.map(a => a.graduationYear).filter(Boolean))].sort((a, b) => b - a);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(paginatedAlumni.map(a => a._id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (alumnusId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alumnusId)) {
        newSet.delete(alumnusId);
      } else {
        newSet.add(alumnusId);
      }
      return newSet;
    });
  };

  const handleDeactivate = async (alumnusId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to deactivate this alumnus?')) {
      try {
        await api.put(`/users/${alumnusId}`, { isActive: false });
        fetchAlumni();
      } catch (error) {
        console.error('Error deactivating alumnus:', error);
        alert('Failed to deactivate alumnus');
      }
    }
  };

  const handleDelete = async (alumnusId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this alumnus? This action cannot be undone.')) {
      try {
        await api.delete(`/users/${alumnusId}`);
        fetchAlumni();
        setSelectedRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(alumnusId);
          return newSet;
        });
      } catch (error) {
        console.error('Error deleting alumnus:', error);
        alert('Failed to delete alumnus');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedRows.size} selected alumnus/alumni?`)) {
      try {
        await Promise.all(Array.from(selectedRows).map(id => api.delete(`/users/${id}`)));
        fetchAlumni();
        setSelectedRows(new Set());
      } catch (error) {
        console.error('Error deleting alumni:', error);
        alert('Failed to delete some alumni');
      }
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedRows.size === 0) return;
    if (window.confirm(`Are you sure you want to deactivate ${selectedRows.size} selected alumnus/alumni?`)) {
      try {
        await Promise.all(Array.from(selectedRows).map(id => api.put(`/users/${id}`, { isActive: false })));
        fetchAlumni();
        setSelectedRows(new Set());
      } catch (error) {
        console.error('Error deactivating alumni:', error);
        alert('Failed to deactivate some alumni');
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Alumni Directory
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Manage and view all alumni records
            </p>
          </div>

          {/* Search and Filter Section */}
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Search
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9CA3AF',
                    fontSize: '16px'
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search by name, roll, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#111827',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Graduation Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#111827',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>Class of {year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  {selectedRows.size} selected
                </span>
                <button
                  onClick={handleBulkDeactivate}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#FDE68A'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#FEF3C7'}
                >
                  Deactivate Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#FECACA'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '48px' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.size === paginatedAlumni.length && paginatedAlumni.length > 0}
                        onChange={handleSelectAll}
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          cursor: 'pointer',
                          accentColor: '#4F46E5'
                        }}
                      />
                    </th>
                    <th 
                      style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('name')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Alumni Name
                        {sortConfig.key === 'name' && (
                          <i className={`bi bi-chevron-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
                        )}
                      </div>
                    </th>
                    <th 
                      style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('roll')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Roll
                        {sortConfig.key === 'roll' && (
                          <i className={`bi bi-chevron-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
                        )}
                      </div>
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Email
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Department
                    </th>
                    <th 
                      style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => handleSort('class')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Graduation Year
                        {sortConfig.key === 'class' && (
                          <i className={`bi bi-chevron-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
                        )}
                      </div>
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Phone
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '80px'
                    }}>
                      View
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      width: '60px'
                    }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlumni.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
                        No alumni found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAlumni.map((alumnus, index) => {
                      const isSelected = selectedRows.has(alumnus._id);
                      const isHovered = hoveredRow === alumnus._id;
                      const isActive = alumnus.isActive !== false;
                      
                      return (
                        <tr
                          key={alumnus._id}
                          onMouseEnter={() => setHoveredRow(alumnus._id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          onClick={() => navigate(getDetailRoute(alumnus._id))}
                          style={{
                            backgroundColor: isSelected ? '#F8F0FC' : (isHovered ? '#F9FAFB' : '#FFFFFF'),
                            borderBottom: index < paginatedAlumni.length - 1 ? '1px solid #E5E7EB' : 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(alumnus._id)}
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                cursor: 'pointer',
                                accentColor: isSelected ? '#9333EA' : '#4F46E5'
                              }}
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ position: 'relative' }}>
                                <img
                                  src={alumnus.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.name)}&size=40&background=4F46E5&color=fff`}
                                  alt={alumnus.name}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #E5E7EB'
                                  }}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.name)}&size=40&background=4F46E5&color=fff`;
                                  }}
                                />
                                {isActive && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#10B981',
                                    border: '2px solid #FFFFFF',
                                    borderRadius: '50%'
                                  }}></div>
                                )}
                                {!isActive && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#EF4444',
                                    border: '2px solid #FFFFFF',
                                    borderRadius: '50%'
                                  }}></div>
                                )}
                              </div>
                              <div>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: '600', 
                                  color: '#111827',
                                  marginBottom: '2px'
                                }}>
                                  {alumnus.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                  {alumnus.currentPosition || alumnus.headline || alumnus.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                              #{alumnus.enrollmentNumber || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {alumnus.email || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {alumnus.department || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {alumnus.graduationYear ? `Class of ${alumnus.graduationYear}` : '-'}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '14px', color: '#374151' }}>
                              {formatPhone(alumnus.phone)}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(getDetailRoute(alumnus._id));
                              }}
                              style={{
                                padding: '8px',
                                backgroundColor: 'transparent',
                                color: '#4F46E5',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#EEF2FF';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="View Profile"
                            >
                              <i className="bi bi-eye" style={{ fontSize: '20px' }}></i>
                            </button>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()} data-dropdown>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === alumnus._id ? null : alumnus._id);
                              }}
                              style={{
                                padding: '8px',
                                backgroundColor: 'transparent',
                                color: '#6B7280',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#F3F4F6';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="More actions"
                            >
                              <i className="bi bi-three-dots" style={{ fontSize: '20px' }}></i>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openMenuId === alumnus._id && (
                              <div 
                                data-dropdown
                                style={{
                                  position: 'absolute',
                                  right: '0',
                                  top: '100%',
                                  marginTop: '4px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                  zIndex: 1000,
                                  minWidth: '160px',
                                  overflow: 'hidden'
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeactivate(alumnus._id, e);
                                    setOpenMenuId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    color: '#F59E0B',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#FEF3C7';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <i className="bi bi-pause-circle" style={{ fontSize: '16px' }}></i>
                                  Deactivate
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(alumnus._id, e);
                                    setOpenMenuId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    color: '#EF4444',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#FEE2E2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '16px' }}></i>
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ 
                padding: '16px', 
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedAlumni.length)} of {sortedAlumni.length} alumni
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: currentPage === 1 ? '#F3F4F6' : '#FFFFFF',
                      color: currentPage === 1 ? '#9CA3AF' : '#374151',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.target.style.backgroundColor = '#FFFFFF';
                      }
                    }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: currentPage === page ? '#4F46E5' : '#FFFFFF',
                            color: currentPage === page ? '#FFFFFF' : '#374151',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: currentPage === page ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '40px'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage !== page) {
                              e.target.style.backgroundColor = '#F9FAFB';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== page) {
                              e.target.style.backgroundColor = '#FFFFFF';
                            }
                          }}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} style={{ padding: '8px', color: '#6B7280' }}>...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#FFFFFF',
                      color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.target.style.backgroundColor = '#FFFFFF';
                      }
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniDirectory;
