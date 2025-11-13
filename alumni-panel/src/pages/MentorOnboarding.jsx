import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const MentorOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const totalSteps = 2;

  // Step 1: Personal & Professional Details
  const [step1Form, setStep1Form] = useState({
    profilePicture: null,
    profilePictureUrl: user?.profilePicture || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    profileLink: '',
    gender: user?.gender || '',
    currentOrganization: user?.company || '',
    industry: user?.industry || '',
    currentRole: user?.currentPosition || '',
    workExperience: user?.workExperience || user?.experience || 0,
    headline: user?.headline || '',
    bio: user?.bio || '',
    language: '',
    linkedinUrl: user?.linkedinUrl || '',
    facebookUrl: user?.facebookUrl || '',
    youtubeUrl: user?.youtubeUrl || '',
    instagramUrl: user?.instagramUrl || ''
  });

  // Step 2: Topics & Skills
  const [step2Form, setStep2Form] = useState({
    domain: '',
    topics: [],
    skills: []
  });

  const [newTopic, setNewTopic] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    checkExistingMentorship();
    if (!step1Form.profileLink && user?.name) {
      const baseName = user.name.toLowerCase().replace(/\s+/g, '');
      setStep1Form(prev => ({ ...prev, profileLink: baseName }));
    }
  }, []);

  const checkExistingMentorship = async () => {
    try {
      const response = await api.get('/mentorships');
      const mentorships = response.data;
      const myMentorship = mentorships.find(m => 
        (m.mentor?._id === user?.id || m.mentor === user?.id)
      );
      
      if (myMentorship) {
        const mentorId = myMentorship.mentor?._id || myMentorship.mentor || user?.id;
        navigate(`/mentor/${mentorId}/dashboard`);
      }
    } catch (error) {
      console.error('Error checking mentorship:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!step1Form.firstName || !step1Form.lastName || !step1Form.gender || !step1Form.currentOrganization) {
        alert('Please fill all required fields');
        return;
      }
      
      // Profile picture will be uploaded when updating profile
      // For now, we'll use the file URL directly
      
      // Update user profile
      try {
        await api.put('/users/profile', {
          name: `${step1Form.firstName} ${step1Form.lastName}`.trim(),
          gender: step1Form.gender,
          company: step1Form.currentOrganization,
          industry: step1Form.industry,
          currentPosition: step1Form.currentRole,
          workExperience: step1Form.workExperience,
          headline: step1Form.headline,
          bio: step1Form.bio,
          profileLink: step1Form.profileLink,
          linkedinUrl: step1Form.linkedinUrl,
          facebookUrl: step1Form.facebookUrl,
          youtubeUrl: step1Form.youtubeUrl,
          instagramUrl: step1Form.instagramUrl,
          profilePicture: step1Form.profilePictureUrl || user?.profilePicture,
          languages: step1Form.language ? [{ language: step1Form.language, proficiency: 'Fluent' }] : []
        });
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addTopic = () => {
    if (newTopic.trim() && step2Form.topics.length < 5 && !step2Form.topics.includes(newTopic.trim())) {
      setStep2Form({
        ...step2Form,
        topics: [...step2Form.topics, newTopic.trim()]
      });
      setNewTopic('');
    }
  };

  const removeTopic = (topic) => {
    setStep2Form({
      ...step2Form,
      topics: step2Form.topics.filter(t => t !== topic)
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && step2Form.skills.length < 10 && !step2Form.skills.includes(newSkill.trim())) {
      setStep2Form({
        ...step2Form,
        skills: [...step2Form.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setStep2Form({
      ...step2Form,
      skills: step2Form.skills.filter(s => s !== skill)
    });
  };

  const handleSubmit = async () => {
    if (step2Form.topics.length === 0) {
      alert('Please add at least one topic');
      return;
    }

    setLoading(true);
    try {
      // Create mentorship
      const mentorshipData = {
        title: `${step1Form.firstName}'s Mentorship Program`,
        description: step1Form.bio || 'Welcome to my mentorship program!',
        department: user?.department || '',
        domain: step2Form.domain,
        topics: step2Form.topics,
        skills: step2Form.skills,
        about: step1Form.bio
      };

      const response = await api.post('/mentorships', mentorshipData);
      const newMentorship = response.data;

      // Navigate to mentor dashboard
      const mentorId = newMentorship.mentor?._id || newMentorship.mentor || user?.id;
      if (mentorId) {
        const id = typeof mentorId === 'string' ? mentorId : mentorId.toString();
        navigate(`/mentor/${id}/dashboard`);
      }
    } catch (error) {
      console.error('Error creating mentorship:', error);
      alert(error.response?.data?.message || 'Failed to create mentorship profile');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1" style={{ background: '#f5f5f5', padding: '20px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
        {/* Step 1: Personal & Professional Details */}
        {currentStep === 1 && (
          <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-warning text-dark" style={{ borderRadius: '12px 12px 0 0', padding: '20px' }}>
              <h2 className="mb-1">Become an Unstoppable Mentor!</h2>
              <p className="mb-2">Enter your details</p>
              <div className="progress mt-2" style={{ height: '8px', borderRadius: '4px', background: '#fff' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Profile Picture with Yellow Wavy Background */}
              <div className="text-center mb-4" style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)',
                    borderRadius: '50%',
                    padding: '8px',
                    backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)'
                  }}
                >
                  <div
                    style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '4px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {step1Form.profilePictureUrl || step1Form.profilePicture ? (
                      <img
                        src={step1Form.profilePicture ? URL.createObjectURL(step1Form.profilePicture) : step1Form.profilePictureUrl}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-person" style={{ fontSize: '70px', color: '#999' }}></i>
                    )}
                  </div>
                  <label
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: '#FFC107',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '3px solid white',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    <i className="bi bi-camera-fill text-dark" style={{ fontSize: '18px' }}></i>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setStep1Form({ ...step1Form, profilePicture: e.target.files[0] })}
                    />
                  </label>
                </div>
              </div>

              {/* Personal Details */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={step1Form.firstName}
                    onChange={(e) => setStep1Form({ ...step1Form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={step1Form.lastName}
                    onChange={(e) => setStep1Form({ ...step1Form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Profile Link */}
              <div className="mb-3">
                <label className="form-label">Profile Link</label>
                <input
                  type="text"
                  className="form-control"
                  value={step1Form.profileLink}
                  onChange={(e) => setStep1Form({ ...step1Form, profileLink: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="yourprofilelink"
                />
                <small className="text-muted">(Note: Once saved, profile link cannot be changed.)</small>
              </div>

              {/* Gender */}
              <div className="mb-3">
                <label className="form-label">Gender <span className="text-danger">*</span></label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { label: 'Male', icon: 'bi-gender-male' },
                    { label: 'Female', icon: 'bi-gender-female' },
                    { label: 'Transgender', icon: 'bi-gender-trans' },
                    { label: 'Intersex', icon: 'bi-gender-ambiguous' },
                    { label: 'Non-binary', icon: 'bi-gender-neuter' },
                    { label: 'Others', icon: 'bi-plus-circle' }
                  ].map(({ label, icon }) => (
                    <button
                      key={label}
                      type="button"
                      className={`btn ${step1Form.gender === label ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setStep1Form({ ...step1Form, gender: label })}
                      style={{ borderRadius: '8px', padding: '8px 16px' }}
                    >
                      <i className={`bi ${icon} me-1`}></i>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Organisation */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Current Organisation/Institute <span className="text-danger">*</span></label>
                  <a href="#" className="text-decoration-none small">Change logo</a>
                </div>
                <input
                  type="text"
                  className="form-control"
                  value={step1Form.currentOrganization}
                  onChange={(e) => setStep1Form({ ...step1Form, currentOrganization: e.target.value })}
                  required
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Industry</label>
                  <select
                    className="form-select"
                    value={step1Form.industry}
                    onChange={(e) => setStep1Form({ ...step1Form, industry: e.target.value })}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Current Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value={step1Form.currentRole}
                    onChange={(e) => setStep1Form({ ...step1Form, currentRole: e.target.value })}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Work Experience</label>
                  <input
                    type="number"
                    className="form-control"
                    value={step1Form.workExperience}
                    onChange={(e) => setStep1Form({ ...step1Form, workExperience: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Headline</label>
                  <input
                    type="text"
                    className="form-control"
                    value={step1Form.headline}
                    onChange={(e) => setStep1Form({ ...step1Form, headline: e.target.value })}
                    placeholder="Example: McKinsey & Co. | ISB | Chartered Accountant | CFA (Cleared Level 3) | 740 GMAT"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mb-3">
                <label className="form-label">Bio/About you</label>
                <textarea
                  className="form-control"
                  rows="6"
                  value={step1Form.bio}
                  onChange={(e) => setStep1Form({ ...step1Form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                ></textarea>
                <button
                  type="button"
                  className="btn btn-sm mt-2"
                  style={{ background: '#6f42c1', color: 'white' }}
                >
                  <i className="bi bi-brain"></i> Generate with AI
                </button>
              </div>

              {/* Languages */}
              <div className="mb-3">
                <label className="form-label">Languages you're fluent in</label>
                <select
                  className="form-select"
                  value={step1Form.language}
                  onChange={(e) => setStep1Form({ ...step1Form, language: e.target.value })}
                >
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Social Media */}
              <div className="mb-3">
                <label className="form-label">Social Media Handles</label>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label small">LinkedIn</label>
                    <input
                      type="url"
                      className="form-control"
                      value={step1Form.linkedinUrl}
                      onChange={(e) => setStep1Form({ ...step1Form, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label small">Facebook</label>
                    <input
                      type="url"
                      className="form-control"
                      value={step1Form.facebookUrl}
                      onChange={(e) => setStep1Form({ ...step1Form, facebookUrl: e.target.value })}
                      placeholder="https://Facebook Link"
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label small">YouTube</label>
                    <input
                      type="url"
                      className="form-control"
                      value={step1Form.youtubeUrl}
                      onChange={(e) => setStep1Form({ ...step1Form, youtubeUrl: e.target.value })}
                      placeholder="https://Youtube Link"
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label small">Instagram</label>
                    <input
                      type="url"
                      className="form-control"
                      value={step1Form.instagramUrl}
                      onChange={(e) => setStep1Form({ ...step1Form, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between mt-4">
                <div>
                  <button type="button" className="btn btn-outline-primary" onClick={handleBack} disabled={currentStep === 1}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary ms-2">
                    Guidelines
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={uploading || !step1Form.firstName || !step1Form.lastName || !step1Form.gender || !step1Form.currentOrganization}
                >
                  {uploading ? 'Uploading...' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Topics & Skills */}
        {currentStep === 2 && (
          <div className="card shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-warning text-dark" style={{ borderRadius: '12px 12px 0 0', padding: '20px' }}>
              <h2 className="mb-1">ADD TOPICS</h2>
              <div className="progress mt-2" style={{ height: '8px', borderRadius: '4px', background: '#fff' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Info Alert */}
              <div className="alert alert-info border border-dashed mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Add your domain, topics and skills as per your expertise for conducting the mentorship sessions. This categorisation will help the mentees to find you!
              </div>

              {/* Domain */}
              <div className="mb-4">
                <label className="form-label fw-bold">Domain</label>
                <p className="text-muted small">The domain label is used to place you within a limited selection of predetermined groups</p>
                <select
                  className="form-select"
                  value={step2Form.domain}
                  onChange={(e) => setStep2Form({ ...step2Form, domain: e.target.value })}
                >
                  <option value="">Select Domain</option>
                  <option value="Engineering, Technology & Data">Engineering, Technology & Data</option>
                  <option value="Business & Management">Business & Management</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Education & Research">Education & Research</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Topics */}
              <div className="mb-4">
                <label className="form-label fw-bold">Topics ({step2Form.topics.length}/5)</label>
                <p className="text-muted small">Select the relevant topics which a mentee can choose as a goal through your mentorship sessions</p>
                <div className="d-flex gap-2 mb-2">
                  <select
                    className="form-select"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    disabled={step2Form.topics.length >= 5}
                  >
                    <option value="">Choose topics</option>
                    <option value="Change careers">Change careers</option>
                    <option value="Get your Resume/CV reviewed">Get your Resume/CV reviewed</option>
                    <option value="Pass interviews">Pass interviews</option>
                    <option value="Set career goals">Set career goals</option>
                    <option value="Study Abroad">Study Abroad</option>
                    <option value="Career guidance">Career guidance</option>
                    <option value="Skill development">Skill development</option>
                    <option value="Networking">Networking</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addTopic}
                    disabled={step2Form.topics.length >= 5 || !newTopic}
                  >
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {step2Form.topics.map((topic, idx) => (
                    <span key={idx} className="badge bg-primary" style={{ fontSize: '14px', padding: '8px 16px', borderRadius: '20px' }}>
                      {topic}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        style={{ fontSize: '10px' }}
                        onClick={() => removeTopic(topic)}
                      ></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <label className="form-label fw-bold">Skills ({step2Form.skills.length}/10)</label>
                <p className="text-muted small">Provide a list of your skills (up to 10), that mentees can use to discover you</p>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add skill"
                    disabled={step2Form.skills.length >= 10}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addSkill}
                    disabled={step2Form.skills.length >= 10 || !newSkill.trim()}
                  >
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {step2Form.skills.map((skill, idx) => (
                    <span key={idx} className="badge bg-primary" style={{ fontSize: '14px', padding: '8px 16px', borderRadius: '20px' }}>
                      {skill}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        onClick={() => removeSkill(skill)}
                      ></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || step2Form.topics.length === 0}
                >
                  {loading ? 'Saving...' : 'Save & Next'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MentorOnboarding;
