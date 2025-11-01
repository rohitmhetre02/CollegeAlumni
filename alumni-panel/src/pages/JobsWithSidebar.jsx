import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import '../styles/sidebar.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const JobsWithSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    type: 'full-time',
    department: user?.department || '',
    requirements: [],
    salary: { min: '', max: '', currency: 'INR' }
  });
  const [newRequirement, setNewRequirement] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      const jobsData = (response.data || []).map(job => ({
        ...job,
        jobType: job.jobType || (job.type?.toLowerCase().includes('intern') ? 'Internship' : 'Job'),
        skills: job.skills || job.expertise || [],
        applications: Array.isArray(job.applications) ? job.applications : [],
        applicationsCount: Array.isArray(job.applications) ? job.applications.length : 0
      }));
      setJobs(jobsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setLoading(false);
    }
  };

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

  const handleApply = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/apply`);
      alert('Applied successfully!');
      fetchJobs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply');
    }
  };

  const hasApplied = (job) => {
    if (!job.applications) return false;
    // Check if applications is an array
    if (Array.isArray(job.applications)) {
      return job.applications.some(app => app.student?._id === user?.id || app.student === user?.id);
    }
    // If applications is a number, check if user has applied (would need separate check)
    return false;
  };

  const canCreateJob = () => {
    return user?.role === 'alumni' || user?.role === 'admin' || user?.role === 'coordinator';
  };

  const handleCreateJob = async () => {
    setCreating(true);
    try {
      const payload = {
        ...jobForm,
        requirements: jobForm.requirements,
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
        requirements: [],
        salary: { min: '', max: '', currency: 'INR' }
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !jobForm.requirements.includes(newRequirement.trim())) {
      setJobForm(f => ({ ...f, requirements: [...f.requirements, newRequirement.trim()] }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setJobForm(f => ({ ...f, requirements: f.requirements.filter((_, i) => i !== index) }));
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

  return (
    <div className="d-flex">
      <Sidebar />
      
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: '#f5f5f5' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="bi bi-briefcase-fill"></i> Job Opportunities
          </h2>
          {canCreateJob() && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle"></i> Create Job
            </button>
          )}
        </div>
        
        <div className="row g-4">
          {jobs.map(job => {
            const displayedSkills = job.skills?.slice(0, 3) || [];
            const remainingSkills = (job.skills?.length || 0) - displayedSkills.length;
            
            return (
              <div className="col-md-6" key={job._id}>
                <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: 'none', position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/job/${job._id}`)}>
                  {/* Special Tag */}
                  {job.tag && (
                    <div 
                      className={`badge bg-${job.tagColor}`}
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
                      {job.tag}
                    </div>
                  )}

                  <div className="card-body" style={{ padding: '24px' }}>
                    {/* Job Type Badge */}
                    <div className="mb-2">
                      <span 
                        className={`badge ${job.jobType === 'Internship' ? 'bg-success' : 'bg-primary'}`}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px' }}
                      >
                        {job.jobType || 'Job'}
                      </span>
                    </div>

                    {/* Job Title */}
                    <h4 className="card-title mb-2" style={{ fontSize: '20px', fontWeight: '700', color: '#333', lineHeight: '1.2' }}>
                      {job.title}
                    </h4>

                    {/* Company Name */}
                    <p className="mb-3" style={{ fontSize: '16px', color: '#1976D2', fontWeight: '500', marginBottom: '16px' }}>
                      {job.company}
                    </p>

                    {/* Job Details */}
                    <div className="mb-3" style={{ fontSize: '14px', color: '#666' }}>
                      <div className="mb-2 d-flex align-items-center">
                        <i className="bi bi-geo-alt me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                        <span>{job.location}</span>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <i className="bi bi-clock me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                        <span>{job.experience || '2-5 years'}</span>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <i className="bi bi-briefcase me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                        <span>{job.type}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-currency-rupee me-2" style={{ fontSize: '14px', color: '#999' }}></i>
                        <span>{formatSalary(job.salary)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="card-text mb-3" style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                      {job.description}
                    </p>

                    {/* Skills Tags */}
                    {job.skills && job.skills.length > 0 && (
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
                      Posted {getDaysAgo(job.postedAt || job.createdAt)} • {Array.isArray(job.applications) ? job.applications.length : (job.applications || 0)} applications
                    </p>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary flex-fill"
                        onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:hr@${job.company.toLowerCase().replace(/\s+/g, '')}.com?subject=Application for ${job.title}`; }}
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
                      <button
                        className="btn btn-primary flex-fill"
                        onClick={(e) => { e.stopPropagation(); handleApply(job._id); }}
                        disabled={hasApplied(job)}
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
                        <i className="bi bi-person-plus"></i>
                        {hasApplied(job) ? 'Applied' : 'Referral Request'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {jobs.length === 0 && (
          <div className="alert alert-info">
            <i className="bi bi-info-circle"></i> No jobs available at the moment.
          </div>
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
                      <label className="form-label">Requirements/Skills</label>
                      <div className="d-flex gap-2 mb-2">
                        <input
                          className="form-control"
                          value={newRequirement}
                          onChange={e => setNewRequirement(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                          placeholder="Add requirement or skill"
                        />
                        <button className="btn btn-outline-primary" onClick={addRequirement}>
                          Add
                        </button>
                      </div>
                      {jobForm.requirements.length > 0 && (
                        <div className="d-flex flex-wrap gap-2">
                          {jobForm.requirements.map((req, idx) => (
                            <span key={idx} className="badge bg-info text-dark" style={{ fontSize: '13px', padding: '6px 12px' }}>
                              {req}
                              <button
                                className="btn btn-sm p-0 ms-2 text-dark"
                                style={{ border: 'none', background: 'transparent' }}
                                onClick={() => removeRequirement(idx)}
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

export default JobsWithSidebar;

