import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const JobsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    type: 'full-time',
    department: user?.department || '',
    skills: [],
    salary: { min: '', max: '', currency: 'INR' }
  });
  const [newSkill, setNewSkill] = useState('');

  const getDaysAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    if (typeof salary === 'string') return salary;
    if (typeof salary === 'object') {
      const { min, max, currency } = salary;
      if (!min && !max) return 'Not specified';
      const symbol = currency === 'USD' ? '$' : '₹';
      if (min && max) {
        // Format large numbers with Lakhs or Crores
        if (currency === 'INR') {
          const formatLakhs = (num) => {
            if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
            if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
            return num.toString();
          };
          return `${symbol}${formatLakhs(min)}-${formatLakhs(max)}`;
        }
        return `${symbol}${min.toLocaleString()}-${max.toLocaleString()}`;
      }
      if (min) return `${symbol}${currency === 'INR' && min >= 100000 ? (min / 100000).toFixed(1) + 'L+' : min.toLocaleString()}+`;
      if (max) return `Up to ${symbol}${currency === 'INR' && max >= 100000 ? (max / 100000).toFixed(1) + 'L' : max.toLocaleString()}`;
    }
    return 'Not specified';
  };

  const formatExperience = (experience) => {
    if (!experience) return '2-5 years';
    if (typeof experience === 'string') return experience;
    if (typeof experience === 'object') {
      const { min, max, unit } = experience;
      const unitText = unit || 'years';
      if (min !== undefined && max !== undefined) {
        return `${min}-${max} ${unitText}`;
      }
      if (min !== undefined) {
        return `${min}+ ${unitText}`;
      }
      if (max !== undefined) {
        return `Up to ${max} ${unitText}`;
      }
      // If object has unit but no min/max, return default
      return `2-5 ${unitText}`;
    }
    // If it's a number, assume it's years
    if (typeof experience === 'number') {
      return `${experience} years`;
    }
    return '2-5 years';
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      const jobsData = (res.data || []).map(job => ({
        ...job,
        jobType: job.jobType || (job.type?.toLowerCase().includes('intern') ? 'Internship' : 'Job'),
        skills: job.skills || job.expertise || [],
        applications: Array.isArray(job.applications) ? job.applications : [],
        applicationsCount: Array.isArray(job.applications) ? job.applications.length : 0
      }));
      setList(jobsData);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setList([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (user?.department) {
      setJobForm(f => ({ ...f, department: user.department }));
    }
  }, [user]);

  const canCreateJob = () => {
    return user?.role === 'alumni' || user?.role === 'admin' || user?.role === 'coordinator';
  };

  const handleCreateJob = async () => {
    setCreating(true);
    try {
      const payload = {
        ...jobForm,
        skills: jobForm.skills,
        salary: {
          min: jobForm.salary.min ? parseInt(jobForm.salary.min) : undefined,
          max: jobForm.salary.max ? parseInt(jobForm.salary.max) : undefined,
          currency: jobForm.salary.currency || 'INR'
        }
      };
      await api.post('/jobs', payload);
      setShowCreateModal(false);
      fetchJobs();
      alert('Job posted successfully!');
      setJobForm({
        title: '',
        description: '',
        company: '',
        location: '',
        type: 'full-time',
        department: user?.department || '',
        skills: [],
        salary: { min: '', max: '', currency: 'INR' }
      });
      setNewSkill('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !jobForm.skills.includes(newSkill.trim())) {
      setJobForm(f => ({ ...f, skills: [...f.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setJobForm(f => ({ ...f, skills: f.skills.filter((_, i) => i !== index) }));
  };

  const filteredList = list.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: '#f5f5f5' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0"><i className="bi bi-briefcase"></i> Job Opportunity</h2>
          {canCreateJob() && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Create Job
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, company, or location..."
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
              {filteredList.map(j => {
                const displayedSkills = j.skills?.slice(0, 3) || [];
                const remainingSkills = (j.skills?.length || 0) - displayedSkills.length;
                
                return (
                  <div className="col-md-6" key={j._id}>
                    <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      onClick={() => {
                        if (user?.role === 'admin') {
                          navigate(`/admin/jobs/${j._id}`);
                        } else if (user?.role === 'coordinator') {
                          navigate(`/coordinator/jobs/${j._id}`);
                        }
                      }}>
                      {/* Special Tag */}
                      {j.tag && (
                        <div 
                          className={`badge bg-${j.tagColor}`}
                          style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            borderRadius: '20px',
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            zIndex: 2
                          }}
                        >
                          {j.tag}
                        </div>
                      )}

                      <div className="card-body" style={{ padding: '24px' }}>
                        {/* Job Type Badge */}
                        <div className="mb-2">
                          <span 
                            className={`badge ${j.jobType === 'Internship' ? 'bg-success' : 'bg-primary'}`}
                            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px' }}
                          >
                            {j.jobType || 'Job'}
                          </span>
                        </div>

                        {/* Job Title */}
                        <h4 className="card-title mb-2" style={{ fontSize: '20px', fontWeight: '700', color: '#333', lineHeight: '1.2' }}>
                          {j.title}
                        </h4>

                        {/* Company Name */}
                        <p className="mb-3" style={{ fontSize: '16px', color: '#1976D2', fontWeight: '500', marginBottom: '16px' }}>
                          {j.company}
                        </p>

                        {/* Job Details */}
                        <div className="mb-3" style={{ fontSize: '14px', color: '#666' }}>
                          <div className="mb-2 d-flex align-items-center">
                            <i className="bi bi-geo-alt me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                            <span>{j.location}</span>
                          </div>
                          <div className="mb-2 d-flex align-items-center">
                            <i className="bi bi-clock me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                            <span>{formatExperience(j.experience)}</span>
                          </div>
                          <div className="mb-2 d-flex align-items-center">
                            <i className="bi bi-briefcase me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                            <span>{j.type}</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-currency-rupee me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                            <span>{formatSalary(j.salary)}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="card-text mb-3" style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                          {j.description || 'No description available.'}
                        </p>

                        {/* Skills Tags */}
                        {j.skills && j.skills.length > 0 && (
                          <div className="mb-3 d-flex flex-wrap align-items-center" style={{ gap: '8px' }}>
                            {displayedSkills.map((skill, index) => (
                              <span 
                                key={index}
                                style={{
                                  background: '#E0E0E0',
                                  color: '#666',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                            {remainingSkills > 0 && (
                              <span 
                                style={{
                                  background: '#E0E0E0',
                                  color: '#666',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                +{remainingSkills} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Posted Date and Applications */}
                        <p className="mb-3" style={{ fontSize: '12px', color: '#999' }}>
                          Posted {getDaysAgo(j.postedAt || j.createdAt)} • {Array.isArray(j.applications) ? j.applications.length : (j.applications || 0)} applications
                        </p>

                        {/* Action Buttons */}
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary flex-fill"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user?.role === 'admin') {
                                navigate(`/admin/jobs/${j._id}`);
                              } else if (user?.role === 'coordinator') {
                                navigate(`/coordinator/jobs/${j._id}`);
                              }
                            }}
                            style={{
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className="bi bi-eye"></i>
                            View Details
                          </button>
                          <button
                            className="btn btn-primary flex-fill"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:hr@${j.company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com?subject=Application for ${j.title}`;
                            }}
                            style={{
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className="bi bi-envelope"></i>
                            Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredList.length === 0 && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> No jobs found matching your search.
          </div>
            )}
          </>
        )}

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Job Posting</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Job Title *</label>
                      <input
                        className="form-control"
                        value={jobForm.title}
                        onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Company *</label>
                      <input
                        className="form-control"
                        value={jobForm.company}
                        onChange={e => setJobForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Location *</label>
                      <input
                        className="form-control"
                        value={jobForm.location}
                        onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))}
                        placeholder="e.g., Bangalore, India"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Job Type *</label>
                      <select
                        className="form-control"
                        value={jobForm.type}
                        onChange={e => setJobForm(f => ({ ...f, type: e.target.value }))}
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <input
                        className="form-control"
                        value={jobForm.department}
                        onChange={e => setJobForm(f => ({ ...f, department: e.target.value }))}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Salary Currency</label>
                      <select
                        className="form-control"
                        value={jobForm.salary.currency}
                        onChange={e => setJobForm(f => ({ ...f, salary: { ...f.salary, currency: e.target.value } }))}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Min Salary</label>
                      <input
                        className="form-control"
                        type="number"
                        value={jobForm.salary.min}
                        onChange={e => setJobForm(f => ({ ...f, salary: { ...f.salary, min: e.target.value } }))}
                        placeholder="e.g., 500000"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Max Salary</label>
                      <input
                        className="form-control"
                        type="number"
                        value={jobForm.salary.max}
                        onChange={e => setJobForm(f => ({ ...f, salary: { ...f.salary, max: e.target.value } }))}
                        placeholder="e.g., 1200000"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={jobForm.description}
                        onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Job description, responsibilities, etc."
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Skills</label>
                      <div className="d-flex gap-2 mb-2">
                        <input
                          className="form-control"
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          placeholder="Add skill"
                        />
                        <button className="btn btn-outline-primary" onClick={addSkill}>
                          Add
                        </button>
                      </div>
                      {jobForm.skills.length > 0 && (
                        <div className="d-flex flex-wrap gap-2">
                          {jobForm.skills.map((skill, idx) => (
                            <span key={idx} className="badge bg-info text-dark" style={{ fontSize: '13px', padding: '6px 12px' }}>
                              {skill}
                              <button
                                className="btn btn-sm p-0 ms-2 text-dark"
                                style={{ border: 'none', background: 'transparent' }}
                                onClick={() => removeSkill(idx)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreateJob}
                    disabled={creating || !jobForm.title || !jobForm.company || !jobForm.location || !jobForm.description}
                  >
                    {creating ? 'Creating...' : 'Create Job'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;


