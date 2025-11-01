import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const Mentorships = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorships();
  }, []);

  const fetchMentorships = async () => {
    try {
      const response = await api.get('/mentorships');
      setMentorships(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
      setLoading(false);
    }
  };

  const handleRequest = async (mentorshipId) => {
    try {
      await api.post(`/mentorships/${mentorshipId}/request`);
      alert('Mentorship request submitted!');
      fetchMentorships();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const hasRequested = (mentorship) => {
    return mentorship.mentees?.some(mentee => mentee.student?._id === user?.id);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4">Mentorship Programs</h2>
      
      <div className="row g-4">
        {mentorships.map(mentorship => (
          <div className="col-md-6" key={mentorship._id}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">{mentorship.title}</h5>
                <p className="text-muted">
                  Mentor: {mentorship.mentor?.name}
                  <br />
                  {mentorship.mentor?.currentPosition} at {mentorship.mentor?.company}
                </p>
                <p className="card-text">{mentorship.description}</p>
                <div className="mb-2">
                  {mentorship.expertise?.map((skill, idx) => (
                    <span key={idx} className="badge bg-primary me-1">{skill}</span>
                  ))}
                  <span className="badge bg-secondary ms-2">{mentorship.department}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted">
                    Status: {mentorship.status} | Max Mentees: {mentorship.maxMentees}
                  </small>
                </div>
                {user?.role === 'student' && (
                  <button
                    className="btn btn-info text-white"
                    onClick={() => handleRequest(mentorship._id)}
                    disabled={hasRequested(mentorship) || mentorship.status === 'full'}
                  >
                    {hasRequested(mentorship) ? 'Requested' : 'Request Mentorship'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {mentorships.length === 0 && (
        <p className="text-center text-muted">No mentorship programs available at the moment.</p>
      )}
    </div>
  );
};

export default Mentorships;

