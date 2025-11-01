import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
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
    return job.applications?.some(app => app.student?._id === user?.id);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Job Opportunities</h2>
      
      <div className="row g-4">
        {jobs.map(job => (
          <div className="col-md-6" key={job._id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">{job.title}</h5>
                <p className="text-muted">{job.company} - {job.location}</p>
                <p className="card-text">{job.description}</p>
                <div className="mb-2">
                  <span className="badge bg-primary">{job.type}</span>
                  <span className="badge bg-secondary ms-2">{job.department}</span>
                </div>
                {user?.role === 'student' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApply(job._id)}
                    disabled={hasApplied(job)}
                  >
                    {hasApplied(job) ? 'Applied' : 'Apply Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <p className="text-center text-muted">No jobs available at the moment.</p>
      )}
    </div>
  );
};

export default Jobs;

