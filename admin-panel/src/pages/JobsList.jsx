import { useEffect, useState } from 'react';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const JobsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    (async () => {
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
      } catch (e) {
        console.error(e);
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredList = list.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4" style={{ background: '#f5f5f5' }}>
        <h2 className="mb-4"><i className="bi bi-briefcase"></i> Job Opportunity</h2>
        
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
                    <div className="card shadow-sm h-100" style={{ borderRadius: '12px', border: 'none', position: 'relative' }}>
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
                            <span>{j.experience || '2-5 years'}</span>
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
                            onClick={() => window.location.href = `mailto:hr@${j.company.toLowerCase().replace(/\s+/g, '')}.com?subject=Application for ${j.title}`}
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
                            onClick={() => console.log('Referral requested for:', j._id)}
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
                            Referral Request
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
      </div>
    </div>
  );
};

export default JobsList;


