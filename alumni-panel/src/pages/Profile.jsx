import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import ProfileTopCard from '../components/ProfileTopCard';
import { uploadImageToBackend, uploadResumeToBackend } from '../utils/upload';

const extractExperienceValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return '';
    if (value.value !== undefined) return value.value;
    if (value.amount !== undefined) return value.amount;
    if (value.years !== undefined) return value.years;
    if (value.total !== undefined) return value.total;
    return '';
  }
  return value;
};

const extractExperienceUnit = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.unit || value.units || value.label || '';
  }
  return value === '' ? '' : 'yrs';
};

const sanitizeExperienceForState = (value) => {
  const numeric = extractExperienceValue(value);
  if (numeric === '' || numeric === undefined || numeric === null) return '';
  if (typeof numeric === 'string') {
    const trimmed = numeric.trim();
    if (!trimmed) return '';
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)/);
    return match ? match[1] : trimmed;
  }
  return numeric;
};

const formatExperienceDisplay = (value) => {
  if (value === '' || value === undefined || value === null) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const numericMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)/);
    if (numericMatch) {
      const numericValue = numericMatch[1];
      return `${numericValue} yrs`;
    }
    return trimmed;
  }
  const numeric = extractExperienceValue(value);
  if (numeric === '' || numeric === undefined || numeric === null) return '';
  const unit = extractExperienceUnit(value) || 'yrs';
  return `${numeric} ${unit}`.trim();
};

const formatFlexibleText = (input) => {
  if (input === null || input === undefined) return '';
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  if (Array.isArray(input)) {
    return input.map(item => formatFlexibleText(item)).filter(Boolean).join(', ');
  }
  if (typeof input === 'object') {
    const numeric = input.value ?? input.amount ?? input.years ?? input.total ?? input.duration ?? undefined;
    const unit = input.unit || input.units || input.label || input.text || '';
    if (numeric !== undefined) {
      const numericText = formatFlexibleText(numeric);
      const unitText = unit ? formatFlexibleText(unit) : '';
      return [numericText, unitText].filter(Boolean).join(' ').trim();
    }
    if (input.description !== undefined) {
      return formatFlexibleText(input.description);
    }
    const flatValues = Object.values(input)
      .map(value => (typeof value === 'object' ? formatFlexibleText(value) : formatFlexibleText(String(value))))
      .filter(Boolean);
    return flatValues.join(' ').trim();
  }
  return '';
};

const Profile = () => {
  const { user, setUser } = useAuth();
  // Profile/general info
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || '',
    email: user?.email || '',
    location: user?.location || user?.city || '',
    gender: user?.gender || '',
    headline: user?.headline || '',
    currentPosition: user?.currentPosition || '',
    company: user?.company || '',
    degree: user?.degree || '',
    college: user?.college || '',
    graduationYear: user?.graduationYear || '',
    cgpa: user?.cgpa || '',
    enrollmentNumber: user?.enrollmentNumber || '',
    linkedinUrl: user?.linkedinUrl || '',
    facebookUrl: user?.facebookUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
    githubUrl: user?.githubUrl || '',
    role: user?.role || '',
    department: user?.department || '',
    staffId: user?.staffId || user?.facultyId || '',
    workExperience: sanitizeExperienceForState(user?.workExperience),
  });

  // Section edit states
  const [editingSection, setEditingSection] = useState(null);
  
  // Secondary sections: always mock/state
  const [skills, setSkills] = useState(user?.skills || []);
  const [languages, setLanguages] = useState(user?.languages || []);
  const [experience, setExperience] = useState(user?.experience || user?.internships || []);
  const [projects, setProjects] = useState(user?.projects || []);
  const [resumeUrl, setResumeUrl] = useState(user?.resumeUrl || '');

  // Form inputs for adding new items
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: '' });
  const [newExperience, setNewExperience] = useState({ 
    job_title: '', 
    employment_type: '', 
    company: '', 
    is_current: false,
    start_month: '', 
    start_year: '', 
    end_month: '', 
    end_year: '', 
    location: '', 
    location_type: '', 
    description: '', 
    skills: '' 
  });
  const [newEducation, setNewEducation] = useState({
    school: '',
    degree: '',
    field_of_study: '',
    start_month: '',
    start_year: '',
    end_month: '',
    end_year: '',
    grade: '',
    activities: '',
    description: '',
    skills: ''
  });
  const [newProject, setNewProject] = useState({ 
    project_name: '', 
    description: '', 
    skills: '', 
    start_month: '', 
    start_year: '', 
    end_month: '', 
    end_year: '', 
    is_current: false,
    contributors: '', 
    media: '' 
  });

  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [activeSection, setActiveSection] = useState('education');
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    name: form.name,
    phone: form.phone,
    profilePicture: form.profilePicture,
    email: form.email,
    location: form.location,
    gender: form.gender,
    headline: form.headline,
    currentPosition: form.currentPosition,
    company: form.company,
    role: form.role,
    department: form.department,
    staffId: form.staffId,
    workExperience: sanitizeExperienceForState(form.workExperience),
  });

  const role = user?.role;
  const isStudent = role === 'student';
  const isAlumni = role === 'alumni';
  const isAcademia = role === 'coordinator' || role === 'admin';
  const isCoordinator = role === 'coordinator';

  const experienceLabel = formatExperienceDisplay(
    form.workExperience !== '' && form.workExperience !== undefined && form.workExperience !== null
      ? form.workExperience
      : user?.workExperience
  );

  // Compute completion:
  let filled = 2; // name, department
  let possible = 3;
  if (form.bio) filled++;
  if (form.phone) filled++;
  if (isAlumni && form.graduationYear) filled++;
  if (isAlumni && form.currentPosition) filled++;
  if (isAlumni && form.company) filled++;
  if (isStudent && user.enrollmentNumber) filled++;
  possible += isAlumni ? 3 : isStudent ? 1 : 0;
  const completion = Math.floor((filled/possible)*100);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Scroll to active section (only when clicking quick links, not on input changes)
  const scrollToSection = (sectionId, shouldScroll = true) => {
    setActiveSection(sectionId);
    if (shouldScroll) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          const offset = 100;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Handle editable fields only for main info
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  async function saveHeader() {
    setSaving(true); setMessage('');
    try {
      const experienceCandidate = extractExperienceValue(headerForm.workExperience);
      let normalizedExperience;
      if (experienceCandidate !== '' && experienceCandidate !== null && experienceCandidate !== undefined) {
        const parsedExperience = Number(experienceCandidate);
        normalizedExperience = Number.isNaN(parsedExperience) ? undefined : parsedExperience;
      }
      const payload = {
        name: headerForm.name,
        phone: headerForm.phone,
        profilePicture: headerForm.profilePicture,
        email: headerForm.email,
        location: headerForm.location,
        gender: headerForm.gender,
        headline: headerForm.headline,
        currentPosition: headerForm.currentPosition,
        company: headerForm.company,
        role: headerForm.role,
        department: headerForm.department,
        staffId: headerForm.staffId,
        facultyId: headerForm.staffId,
        workExperience: normalizedExperience,
      };
      const { data } = await api.put('/users/profile', payload);
      setUser && setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setForm(f => ({
        ...f,
        name: data.name || headerForm.name,
        phone: data.phone || headerForm.phone,
        profilePicture: data.profilePicture || headerForm.profilePicture,
        email: data.email || headerForm.email,
        location: data.location || headerForm.location || '',
        gender: data.gender || headerForm.gender || '',
        headline: data.headline || headerForm.headline || '',
        currentPosition: data.currentPosition || headerForm.currentPosition || '',
        company: data.company || headerForm.company || '',
        role: data.role || headerForm.role || '',
        department: data.department || headerForm.department || '',
        staffId: data.staffId || data.facultyId || headerForm.staffId || '',
        workExperience: sanitizeExperienceForState(data.workExperience ?? normalizedExperience ?? ''),
      }));
      setShowHeaderEdit(false);
      setMessage('Profile updated successfully!');
    } catch (e) {
      setMessage(e?.response?.data?.message || 'Failed to update');
    }
    setSaving(false);
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setMessage('');
    try {
      const imageUrl = await uploadImageToBackend(file);
      if (!imageUrl) {
        throw new Error('No URL returned from Cloudinary');
      }
      
      // Update form states
      setHeaderForm(h => ({ ...h, profilePicture: imageUrl }));
      setForm(f => ({ ...f, profilePicture: imageUrl }));
      
      // Save to backend immediately
      try {
        const { data } = await api.put('/users/profile', { profilePicture: imageUrl });
        // Update user context and localStorage immediately
        if (setUser && data) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
        setMessage('Profile picture uploaded and saved successfully!');
      } catch (saveError) {
        console.error('Error saving profile picture:', saveError);
        // Still show success for upload, but warn about save
        setMessage('Picture uploaded but failed to save. Please save your profile to save it.');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      const errorMessage = error?.message || 'Failed to upload image. Please check your Cloudinary configuration.';
      setMessage(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setMessage('Please select a valid resume file (PDF, DOC, or DOCX)');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Resume size should be less than 10MB');
      return;
    }

    setUploadingResume(true);
    setMessage('');
    try {
      const uploadedResumeUrl = await uploadResumeToBackend(file);
      if (!uploadedResumeUrl) {
        throw new Error('No URL returned from Cloudinary');
      }
      setResumeUrl(uploadedResumeUrl);
      setMessage('Resume uploaded successfully!');
      // Save to backend
      await api.put('/users/profile', { resumeUrl: uploadedResumeUrl });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading resume to Cloudinary:', error);
      const errorMessage = error?.message || 'Failed to upload resume. Please check your Cloudinary configuration.';
      setMessage(errorMessage);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSave = async (sectionId = null) => {
    setSaving(true); setMessage('');
    // Prevent scroll on save
    const scrollPosition = window.pageYOffset;
    try {
      const sanitizedForm = { ...form };
      const experienceCandidate = extractExperienceValue(sanitizedForm.workExperience);
      if (experienceCandidate === '' || experienceCandidate === null || experienceCandidate === undefined) {
        delete sanitizedForm.workExperience;
      } else {
        const parsed = Number(experienceCandidate);
        if (Number.isNaN(parsed)) {
          delete sanitizedForm.workExperience;
        } else {
          sanitizedForm.workExperience = parsed;
        }
      }

      const payload = { 
        ...sanitizedForm,
        skills,
        languages,
        experience,
        projects,
        resumeUrl,
      };
      if (sanitizedForm.staffId !== undefined) {
        payload.staffId = sanitizedForm.staffId;
        payload.facultyId = sanitizedForm.staffId;
      }
      const { data } = await api.put('/users/profile', payload);
      setUser && setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setForm(prev => ({
        ...prev,
        name: data.name ?? prev.name,
        email: data.email ?? prev.email,
        phone: data.phone ?? prev.phone,
        role: data.role ?? prev.role,
        department: data.department ?? prev.department,
        staffId: data.staffId ?? data.facultyId ?? payload.staffId ?? prev.staffId,
        workExperience: sanitizeExperienceForState(data.workExperience ?? payload.workExperience ?? prev.workExperience ?? ''),
        bio: data.bio ?? prev.bio,
        location: data.location ?? prev.location,
        gender: data.gender ?? prev.gender,
        headline: data.headline ?? prev.headline,
        degree: data.degree ?? prev.degree,
        college: data.college ?? prev.college,
        graduationYear: data.graduationYear ?? prev.graduationYear,
        cgpa: data.cgpa ?? prev.cgpa,
      }));
      setEditingSection(null);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      // Restore scroll position after save
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
      }, 0);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to update');
    }
    setSaving(false);
  };

  // Helper functions for adding/removing items
  function addSkill() {
    if (!newSkill.trim()) return;
    setSkills(list => [...list, newSkill.trim()]);
    setNewSkill('');
  }
  function removeSkill(idx) { setSkills(list => list.filter((_, i) => i!==idx)); }

  function addLanguage() {
    if (!newLanguage.language.trim()) return;
    setLanguages(list => [...list, { ...newLanguage, language: newLanguage.language.trim() }]);
    setNewLanguage({ language: '', proficiency: '' });
  }
  function removeLanguage(idx) { setLanguages(list => list.filter((_, i) => i!==idx)); }

  function addExperience() {
    if (!newExperience.job_title.trim()) return;
    const exp = {
      job_title: newExperience.job_title.trim(),
      employment_type: newExperience.employment_type,
      company: newExperience.company.trim(),
      is_current: newExperience.is_current,
      start_month: newExperience.start_month,
      start_year: newExperience.start_year,
      end_month: newExperience.is_current ? '' : newExperience.end_month,
      end_year: newExperience.is_current ? '' : newExperience.end_year,
      location: newExperience.location.trim(),
      location_type: newExperience.location_type,
      description: newExperience.description.trim(),
      skills: newExperience.skills.split(',').map(s => s.trim()).filter(Boolean)
    };
    setExperience(list => [...list, exp]);
    setNewExperience({ 
      job_title: '', 
      employment_type: '', 
      company: '', 
      is_current: false,
      start_month: '', 
      start_year: '', 
      end_month: '', 
      end_year: '', 
      location: '', 
      location_type: '', 
      description: '', 
      skills: '' 
    });
  }
  function removeExperience(idx) { setExperience(list => list.filter((_, i) => i!==idx)); }

  function addEducation() {
    if (!newEducation.school.trim() || !newEducation.degree.trim()) return;
    const edu = {
      school: newEducation.school.trim(),
      degree: newEducation.degree.trim(),
      field_of_study: newEducation.field_of_study.trim(),
      start_month: newEducation.start_month,
      start_year: newEducation.start_year,
      end_month: newEducation.end_month,
      end_year: newEducation.end_year,
      grade: newEducation.grade.trim(),
      activities: newEducation.activities.trim(),
      description: newEducation.description.trim(),
      skills: newEducation.skills.split(',').map(s => s.trim()).filter(Boolean)
    };
    // Update main education form or add to education array
    setForm(f => ({ ...f, college: edu.school, degree: edu.degree, cgpa: edu.grade }));
    setNewEducation({
      school: '',
      degree: '',
      field_of_study: '',
      start_month: '',
      start_year: '',
      end_month: '',
      end_year: '',
      grade: '',
      activities: '',
      description: '',
      skills: ''
    });
  }

  function addProject() {
    if (!newProject.project_name.trim()) return;
    const proj = {
      title: newProject.project_name.trim(),
      project_name: newProject.project_name.trim(),
      description: newProject.description.trim(),
      skills: newProject.skills.split(',').map(s => s.trim()).filter(Boolean),
      start_month: newProject.start_month,
      start_year: newProject.start_year,
      end_month: newProject.is_current ? '' : newProject.end_month,
      end_year: newProject.is_current ? '' : newProject.end_year,
      is_current: newProject.is_current,
      contributors: newProject.contributors.split(',').map(s => s.trim()).filter(Boolean),
      media: newProject.media.trim(),
      githubLink: newProject.media.includes('github') ? newProject.media : '',
      projectLink: newProject.media.includes('http') && !newProject.media.includes('github') ? newProject.media : ''
    };
    setProjects(list => [...list, proj]);
    setNewProject({ 
      project_name: '', 
      description: '', 
      skills: '', 
      start_month: '', 
      start_year: '', 
      end_month: '', 
      end_year: '', 
      is_current: false,
      contributors: '', 
      media: '' 
    });
  }
  function removeProject(index) { setProjects(list => list.filter((_, i)=>i!==index)); }


  const SectionCard = ({ id, title, children, onEdit, isEditing }) => (
    <div 
      id={id} 
      className="profile-section-card"
      style={{
        border: `2px solid ${activeSection === id ? '#4CAF50' : '#eee'}`,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        backgroundColor: activeSection === id ? '#f0fdf4' : '#fff',
        transition: 'all 0.3s ease',
        scrollMarginTop: '100px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: activeSection === id ? '#4CAF50' : '#333' }}>
          {title}
        </h4>
        {onEdit && (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => {
              if (isEditing) {
                handleSave(id);
              } else {
                setEditingSection(id);
                onEdit();
              }
            }}
            disabled={saving}
          >
            {isEditing ? (saving ? 'Saving...' : '💾 Save') : '✏️ Edit'}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  const quickLinks = [
    { id: 'about', label: 'About' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Key skills' },
    { id: 'languages', label: 'Languages' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'resume', label: 'Resume' },
  ];

  if (isCoordinator) {
    quickLinks.splice(1, 0, { id: 'coordinator-details', label: 'Coordinator Info' });
  }

  return (
    <div className="d-flex profile-page">
      <Sidebar />
      <div className="sidebar-main-content" style={{ width: '100%', padding: '20px' }}>
        {/* Profile Header Card */}
        <div className="mb-4">
          <ProfileTopCard
            name={form.name}
            degree={form.degree || user?.degree || 'B.E.'}
            college={form.college || user?.college || ''}
            location={form.location || '-'}
            gender={form.gender || '-'}
            birthDate={user?.birthDate || '-'}
            phone={form.phone || '-'}
            email={form.email || user?.email || '-'}
            progress={Math.max(10, Math.min(100, completion))}
            imageUrl={form.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'User')}&size=200&background=1976D2&color=fff`}
            profession={form.currentPosition}
            company={form.company}
            headline={form.headline}
            roleLabel={form.role || user?.role}
            department={form.department || user?.department}
            facultyId={form.staffId}
            workExperience={experienceLabel}
            onEdit={() => { 
              setHeaderForm({ 
                name: form.name, 
                phone: form.phone, 
                profilePicture: form.profilePicture,
                email: form.email || user?.email || '',
                location: form.location,
                gender: form.gender,
                headline: form.headline,
                currentPosition: form.currentPosition,
                company: form.company,
                role: form.role || user?.role || '',
                department: form.department || user?.department || '',
                staffId: form.staffId || user?.staffId || '',
                workExperience: sanitizeExperienceForState(form.workExperience ?? user?.workExperience ?? ''),
              }); 
              setShowHeaderEdit(true); 
            }}
          />
        </div>

        {/* Edit Modal */}
        {showHeaderEdit && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowHeaderEdit(false)}>
            <div className="modal-card p-4" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Edit Profile</h5>
                <button className="btn btn-sm btn-light" onClick={()=>setShowHeaderEdit(false)}>✕</button>
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={headerForm.name} onChange={e=>setHeaderForm(h=>({...h,name:e.target.value}))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Mobile Number</label>
                  <input className="form-control" type="tel" value={headerForm.phone} onChange={e=>setHeaderForm(h=>({...h,phone:e.target.value}))} placeholder="+91 1234567890" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Email *</label>
                  <input className="form-control" type="email" value={headerForm.email} onChange={e=>setHeaderForm(h=>({...h,email:e.target.value}))} placeholder="name@college.edu" />
                  <small className="text-muted">Use an email address you actively monitor</small>
                </div>
                {isCoordinator && (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Role</label>
                      <select className="form-control" value={headerForm.role || ''} onChange={e=>setHeaderForm(h=>({...h,role:e.target.value}))}>
                        <option value="">Select Role</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="admin">Admin</option>
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Faculty ID</label>
                      <input className="form-control" value={headerForm.staffId || ''} onChange={e=>setHeaderForm(h=>({...h,staffId:e.target.value}))} placeholder="e.g., FAC1234" />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Department</label>
                      <input className="form-control" value={headerForm.department || ''} onChange={e=>setHeaderForm(h=>({...h,department:e.target.value}))} placeholder="e.g., Computer Science" />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Total Experience (years)</label>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        step="0.5"
                        value={headerForm.workExperience === undefined || headerForm.workExperience === null ? '' : headerForm.workExperience}
                        onChange={e=>setHeaderForm(h=>({...h,workExperience:e.target.value}))}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </>
                )}
                <div className="col-12 col-md-6">
                  <label className="form-label">Location</label>
                  <input className="form-control" value={headerForm.location} onChange={e=>setHeaderForm(h=>({...h,location:e.target.value}))} placeholder="e.g., Pune, Maharashtra" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={headerForm.gender} onChange={e=>setHeaderForm(h=>({...h,gender:e.target.value}))}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Headline</label>
                  <input className="form-control" value={headerForm.headline} onChange={e=>setHeaderForm(h=>({...h,headline:e.target.value}))} placeholder="e.g., Software Engineer | Full Stack Developer" />
                  <small className="text-muted">A brief headline that appears on your profile card</small>
                </div>
                <div className="col-12">
                  <label className="form-label">Profile Picture</label>
                  <div className="mb-2">
                    <input 
                      type="file" 
                      className="form-control" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <small className="text-muted">
                      {uploadingImage ? 'Uploading...' : 'Upload image to Cloudinary (JPG, PNG, GIF)'}
                    </small>
                  </div>
                  {headerForm.profilePicture && (
                    <div className="mt-2">
                      <img src={headerForm.profilePicture} alt="Profile preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #ddd' }} />
                      <div className="mt-2">
                        <input 
                          className="form-control form-control-sm" 
                          type="url" 
                          value={headerForm.profilePicture} 
                          onChange={e=>setHeaderForm(h=>({...h,profilePicture:e.target.value}))} 
                          placeholder="Or enter image URL directly"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 d-flex">
                <button className="btn btn-secondary" onClick={()=>setShowHeaderEdit(false)} disabled={saving || uploadingImage}>Cancel</button>
                <button className="btn btn-primary ms-auto" onClick={saveHeader} disabled={saving || uploadingImage}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="main-content-profile-full" style={{display: 'flex', gap: '30px', width: '100%'}}>
            {/* Left Sidebar - Quick Links */}
            <div className="sidebar-quick-links" style={{
              flex: '0 0 280px', 
              background: '#fafafa', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '2px solid #eee',
              position: 'sticky',
              top: '100px',
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}>
              <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', color: '#333'}}>Quick Links</h3>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                {quickLinks.map(link => (
                  <li 
                    key={link.id} 
                    style={{
                      padding: '12px 16px', 
                      cursor: 'pointer', 
                      color: activeSection === link.id ? '#4CAF50' : '#444', 
                      fontSize: '14px', 
                      fontWeight: activeSection === link.id ? '600' : '400',
                      backgroundColor: activeSection === link.id ? '#e8f5e9' : 'transparent', 
                      borderRadius: '8px', 
                      marginBottom: '4px',
                      transition: 'all 0.2s ease',
                      borderLeft: activeSection === link.id ? '4px solid #4CAF50' : '4px solid transparent',
                    }} 
                    onClick={() => scrollToSection(link.id, true)}
                    onMouseEnter={(e) => {
                      if (activeSection !== link.id) {
                        e.target.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== link.id) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {link.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Content Area - Full Width */}
            <div className="content-area-profile-full" style={{
              flex: '1', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0',
              width: '100%',
              maxWidth: '100%',
            }}>
              {message && (
                <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} mt-3 mb-3`}>
                  {message}
                </div>
              )}

              {/* About Card */}
              <SectionCard
                id="about"
                title="About 👤"
                isEditing={editingSection === 'about'}
                onEdit={() => setEditingSection('about')}
              >
                {editingSection === 'about' ? (
                  <div>
                    <div className="mb-3">
                      <label className="form-label">Bio</label>
                      <textarea 
                        className="form-control" 
                        rows={6} 
                        value={form.bio} 
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                        placeholder="Write a detailed bio about yourself, your background, interests, and goals..."
                        style={{ resize: 'vertical', minHeight: '120px' }}
                      />
                      <small className="text-muted">Share information about yourself, your achievements, and what you're looking for.</small>
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">LinkedIn URL</label>
                        <input className="form-control" type="url" value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/yourprofile" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">GitHub URL</label>
                        <input className="form-control" type="url" value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/yourusername" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Portfolio URL</label>
                        <input className="form-control" type="url" value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://yourportfolio.com" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Facebook URL</label>
                        <input className="form-control" type="url" value={form.facebookUrl} onChange={e => setForm(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="https://facebook.com/yourprofile" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <p style={{fontSize: '14px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                        {form.bio || 'No bio added yet. Click Edit to add your bio.'}
                      </p>
                    </div>
                    {(form.linkedinUrl || form.githubUrl || form.portfolioUrl || form.facebookUrl) && (
                      <div className="mt-3">
                        <h6 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '10px'}}>Social Links:</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {form.linkedinUrl && (
                            <a href={form.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                              LinkedIn ↗️
                            </a>
                          )}
                          {form.githubUrl && (
                            <a href={form.githubUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark">
                              GitHub ↗️
                            </a>
                          )}
                          {form.portfolioUrl && (
                            <a href={form.portfolioUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info">
                              Portfolio ↗️
                            </a>
                          )}
                          {form.facebookUrl && (
                            <a href={form.facebookUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                              Facebook ↗️
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              {isCoordinator && (
                <SectionCard
                  id="coordinator-details"
                  title="Coordinator Details 🗂️"
                  isEditing={editingSection === 'coordinator-details'}
                  onEdit={() => setEditingSection('coordinator-details')}
                >
                  {editingSection === 'coordinator-details' ? (
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Full Name</label>
                        <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter full name" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Email</label>
                        <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@college.edu" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Mobile Number</label>
                        <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 1234567890" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Role</label>
                        <select className="form-control" value={form.role || ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                          <option value="">Select Role</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="admin">Admin</option>
                          <option value="student">Student</option>
                          <option value="alumni">Alumni</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Faculty ID</label>
                        <input className="form-control" value={form.staffId || ''} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))} placeholder="e.g., FAC1234" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Department</label>
                        <input className="form-control" value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g., Computer Science" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Total Experience (years)</label>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.workExperience === undefined || form.workExperience === null ? '' : form.workExperience}
                          onChange={e => setForm(f => ({ ...f, workExperience: e.target.value }))}
                          placeholder="e.g., 5"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <strong>Name</strong>
                        <p className="text-muted mb-0">{form.name || '-'}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Email</strong>
                        <p className="text-muted mb-0">{form.email || '-'}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Mobile Number</strong>
                        <p className="text-muted mb-0">{form.phone || '-'}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Role</strong>
                        <p className="text-muted mb-0">{(form.role || user?.role || '-').toString().replace(/\b\w/g, (char) => char.toUpperCase())}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Faculty ID</strong>
                        <p className="text-muted mb-0">{form.staffId || '-'}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Department</strong>
                        <p className="text-muted mb-0">{form.department || user?.department || '-'}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Total Experience</strong>
                        <p className="text-muted mb-0">{experienceLabel || '-'}</p>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* Education Card */}
              <SectionCard
                id="education"
                title="Education 🎓"
                isEditing={editingSection === 'education'}
                onEdit={() => setEditingSection('education')}
              >
                {editingSection === 'education' ? (
                  <div>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Degree *</label>
                        <input 
                          className="form-control" 
                          value={form.degree || ''} 
                          onChange={e => setForm(f => ({ ...f, degree: e.target.value }))}
                          placeholder="e.g., B.E., B.Tech, M.Tech" 
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">College/University *</label>
                        <input 
                          className="form-control" 
                          value={form.college || ''} 
                          onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                          placeholder="Enter college/university name" 
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Graduation Year</label>
                        <input 
                          className="form-control" 
                          type="number" 
                          value={form.graduationYear || ''} 
                          onChange={e => setForm(f => ({ ...f, graduationYear: e.target.value }))}
                          placeholder="e.g., 2024" 
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">CGPA</label>
                        <input 
                          className="form-control" 
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={form.cgpa || ''} 
                          onChange={e => setForm(f => ({ ...f, cgpa: e.target.value }))}
                          placeholder="e.g., 8.5" 
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Department</label>
                        <input 
                          className="form-control" 
                          value={form.department || user?.department || ''} 
                          onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                          placeholder="e.g., Computer Science" 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {(form.degree || form.college || form.graduationYear || form.cgpa || form.department || user?.department) ? (
                      <div>
                        <div style={{marginBottom: '20px'}}>
                          {form.degree && (
                            <p style={{fontSize: '14px', color: '#555', marginBottom: '4px'}}>
                              <strong>Degree:</strong> {form.degree}
                            </p>
                          )}
                          {form.college && (
                            <p style={{fontSize: '14px', color: '#555', marginBottom: '4px'}}>
                              <strong>College/University:</strong> {form.college}
                            </p>
                          )}
                          {form.graduationYear && (
                            <p style={{fontSize: '14px', color: '#555', marginBottom: '4px'}}>
                              <strong>Graduation Year:</strong> {form.graduationYear}
                            </p>
                          )}
                          {form.cgpa && (
                            <p style={{fontSize: '14px', color: '#555', marginBottom: '4px'}}>
                              <strong>CGPA:</strong> {form.cgpa}
                            </p>
                          )}
                          {(form.department || user?.department) && (
                            <p style={{fontSize: '14px', color: '#555'}}>
                              <strong>Department:</strong> {form.department || user?.department}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p style={{fontSize: '14px', color: '#555'}}>No education details added yet. Click Edit to add your education information.</p>
                    )}
                  </div>
                )}
              </SectionCard>

              {/* Key Skills Card */}
              <SectionCard
                id="skills"
                title="Key skills 🧠"
                isEditing={editingSection === 'skills'}
                onEdit={() => setEditingSection('skills')}
              >
                {skills.length === 0 ? (
                  <p style={{fontSize: '14px', color: '#555'}}>Add your key skills here...</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {skills.map((s,i)=>(<span key={i} className="badge bg-info text-dark" style={{fontSize: '13px', padding: '6px 12px'}}>
                      {s} 
                      {editingSection === 'skills' && <button className="btn btn-sm py-0 px-1 ms-1 text-danger" style={{fontSize: '12px', border: 'none', background: 'transparent'}} title="Remove" onClick={()=>removeSkill(i)}>&times;</button>}
                    </span>))}
                  </div>
                )}
                {editingSection === 'skills' && (
                  <div className="d-flex gap-2 mt-3">
                    <input className="form-control" placeholder="Add skill" value={newSkill} onChange={e=>setNewSkill(e.target.value)} />
                    <button type="button" className="btn btn-outline-info" onClick={addSkill}>Add</button>
                  </div>
                )}
              </SectionCard>

              {/* Languages Card */}
              <SectionCard
                id="languages"
                title="Languages 🌐"
                isEditing={editingSection === 'languages'}
                onEdit={() => setEditingSection('languages')}
              >
                {languages.length === 0 ? (
                  <p style={{fontSize: '14px', color: '#555'}}>Add languages you speak...</p>
                ) : (
                  <div className="mb-3">
                    {languages.map((lang, i) => (
                      <div key={i} className="mb-2" style={{padding: '8px', background: '#f9f9f9', borderRadius: '6px'}}>
                        <strong>{lang.language}</strong> - {lang.proficiency || 'Proficient'}
                        {editingSection === 'languages' && (
                          <button className="btn btn-sm btn-outline-danger ms-2" onClick={()=>removeLanguage(i)}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {editingSection === 'languages' && (
                  <div className="row g-2 mt-3">
                    <div className="col-md-6">
                      <input className="form-control" placeholder="Language" value={newLanguage.language} onChange={e=>setNewLanguage({...newLanguage, language: e.target.value})} />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Proficiency" value={newLanguage.proficiency} onChange={e=>setNewLanguage({...newLanguage, proficiency: e.target.value})} />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-outline-primary w-100" onClick={addLanguage}>Add</button>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Experience Card */}
              <SectionCard
                id="experience"
                title="Experience 💼"
                isEditing={editingSection === 'experience'}
                onEdit={() => setEditingSection('experience')}
              >
                {experience.length === 0 ? (
                  <p style={{fontSize: '14px', color: '#555'}}>Add your experience...</p>
                ) : (
                  <div className="mb-3">
                  {experience.map((exp, i) => {
                    const jobTitle = exp.job_title || exp.title || formatFlexibleText(exp.title) || 'Role';
                    const company = exp.company || formatFlexibleText(exp.company);
                    const employmentType = exp.employment_type;
                    const location = exp.location;
                    const locationType = exp.location_type;
                    const startDate = exp.start_month && exp.start_year ? `${exp.start_month} ${exp.start_year}` : (exp.start_year || '');
                    const endDate = exp.is_current ? 'Present' : (exp.end_month && exp.end_year ? `${exp.end_month} ${exp.end_year}` : (exp.end_year || ''));
                    const duration = startDate && endDate ? `${startDate} - ${endDate}` : (exp.duration || formatFlexibleText(exp.duration) || '');
                    const description = exp.description || formatFlexibleText(exp.description);
                    const skills = exp.skills || [];
                    return (
                      <div key={i} className="mb-4 p-4 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                        <div className="fw-bold mb-2" style={{ fontSize: '16px' }}>
                          {jobTitle}
                          {company && <span className="text-primary ms-2">at {company}</span>}
                        </div>
                        <div className="mb-2">
                          {employmentType && <span className="badge bg-info me-2">{employmentType}</span>}
                          {locationType && <span className="badge bg-secondary">{locationType}</span>}
                          {exp.is_current && <span className="badge bg-success ms-2">Current</span>}
                        </div>
                        {duration && (
                          <div className="text-muted mb-2" style={{ fontSize: '14px' }}>
                            <i className="bi bi-calendar me-1"></i>{duration}
                            {location && <span className="ms-3"><i className="bi bi-geo-alt me-1"></i>{location}</span>}
                          </div>
                        )}
                        {description && (
                          <div className="mb-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>{description}</div>
                        )}
                        {skills && skills.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mb-2">
                            {skills.map((skill, idx) => (
                              <span key={idx} className="badge bg-primary" style={{ fontSize: '12px' }}>{skill}</span>
                            ))}
                          </div>
                        )}
                        {editingSection === 'experience' && (
                          <button className="btn btn-sm btn-outline-danger mt-2" onClick={()=>removeExperience(i)}>Remove</button>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
                {editingSection === 'experience' && (
                  <div className="card p-4 mt-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="mb-3">Add Work Experience</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Job Title *</label>
                        <input className="form-control" placeholder="e.g., Software Engineer" value={newExperience.job_title} onChange={e=>setNewExperience({...newExperience, job_title: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Employment Type</label>
                        <select className="form-control" value={newExperience.employment_type} onChange={e=>setNewExperience({...newExperience, employment_type: e.target.value})}>
                          <option value="">Select Type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Company / Organization *</label>
                        <input className="form-control" placeholder="e.g., Google" value={newExperience.company} onChange={e=>setNewExperience({...newExperience, company: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Location</label>
                        <input className="form-control" placeholder="e.g., San Francisco, CA" value={newExperience.location} onChange={e=>setNewExperience({...newExperience, location: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Location Type</label>
                        <select className="form-control" value={newExperience.location_type} onChange={e=>setNewExperience({...newExperience, location_type: e.target.value})}>
                          <option value="">Select Type</option>
                          <option value="On-site">On-site</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          <input type="checkbox" className="form-check-input me-2" checked={newExperience.is_current} onChange={e=>setNewExperience({...newExperience, is_current: e.target.checked})} />
                          Currently Working
                        </label>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Start Month</label>
                        <select className="form-control" value={newExperience.start_month} onChange={e=>setNewExperience({...newExperience, start_month: e.target.value})}>
                          <option value="">Month</option>
                          <option value="January">January</option>
                          <option value="February">February</option>
                          <option value="March">March</option>
                          <option value="April">April</option>
                          <option value="May">May</option>
                          <option value="June">June</option>
                          <option value="July">July</option>
                          <option value="August">August</option>
                          <option value="September">September</option>
                          <option value="October">October</option>
                          <option value="November">November</option>
                          <option value="December">December</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Start Year</label>
                        <input type="number" className="form-control" placeholder="YYYY" min="1950" max={new Date().getFullYear()} value={newExperience.start_year} onChange={e=>setNewExperience({...newExperience, start_year: e.target.value})} />
                      </div>
                      {!newExperience.is_current && (
                        <>
                          <div className="col-md-3">
                            <label className="form-label">End Month</label>
                            <select className="form-control" value={newExperience.end_month} onChange={e=>setNewExperience({...newExperience, end_month: e.target.value})}>
                              <option value="">Month</option>
                              <option value="January">January</option>
                              <option value="February">February</option>
                              <option value="March">March</option>
                              <option value="April">April</option>
                              <option value="May">May</option>
                              <option value="June">June</option>
                              <option value="July">July</option>
                              <option value="August">August</option>
                              <option value="September">September</option>
                              <option value="October">October</option>
                              <option value="November">November</option>
                              <option value="December">December</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">End Year</label>
                            <input type="number" className="form-control" placeholder="YYYY" min="1950" max={new Date().getFullYear()} value={newExperience.end_year} onChange={e=>setNewExperience({...newExperience, end_year: e.target.value})} />
                          </div>
                        </>
                      )}
                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4} 
                          placeholder="Describe your role, responsibilities, and achievements..." 
                          value={newExperience.description} 
                          onChange={e => setNewExperience({...newExperience, description: e.target.value})}
                          style={{ resize: 'vertical', minHeight: '100px' }}
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Key Skills (comma separated)</label>
                        <input className="form-control" placeholder="e.g., JavaScript, React, Node.js" value={newExperience.skills} onChange={e=>setNewExperience({...newExperience, skills: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <button type="button" className="btn btn-primary" onClick={addExperience}>+ Add Experience</button>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Projects Card */}
              <SectionCard
                id="projects"
                title="Projects 🚀"
                isEditing={editingSection === 'projects'}
                onEdit={() => setEditingSection('projects')}
              >
                {projects.length === 0 ? (
                  <p style={{fontSize: '14px', color: '#555'}}>No projects added yet.</p>
                ) : (
                  projects.map((p,idx) => {
                    const projectName = p.project_name || p.title || 'Project';
                    const description = p.description || '';
                    const skills = p.skills || [];
                    const startDate = p.start_month && p.start_year ? `${p.start_month} ${p.start_year}` : (p.start_year || '');
                    const endDate = p.is_current ? 'Present' : (p.end_month && p.end_year ? `${p.end_month} ${p.end_year}` : (p.end_year || ''));
                    const duration = startDate && endDate ? `${startDate} - ${endDate}` : '';
                    const contributors = p.contributors || [];
                    const media = p.media || p.githubLink || p.projectLink || '';
                    return (
                      <div key={idx} className="mb-4 p-4 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                        <div className="fw-bold mb-2" style={{ fontSize: '16px' }}>
                          {projectName}
                          {p.is_current && <span className="badge bg-success ms-2">Ongoing</span>}
                        </div>
                        {duration && (
                          <div className="text-muted mb-2" style={{ fontSize: '14px' }}>
                            <i className="bi bi-calendar me-1"></i>{duration}
                          </div>
                        )}
                        {description && (
                          <div className="mb-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>{description}</div>
                        )}
                        {skills && skills.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mb-2">
                            {skills.map((skill, skillIdx) => (
                              <span key={skillIdx} className="badge bg-primary" style={{ fontSize: '12px' }}>{skill}</span>
                            ))}
                          </div>
                        )}
                        {contributors && contributors.length > 0 && (
                          <div className="mb-2" style={{ fontSize: '13px', color: '#666' }}>
                            <strong>Team:</strong> {contributors.join(', ')}
                          </div>
                        )}
                        {media && (
                          <div className="mb-2">
                            <a href={media} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary me-2">
                              <i className="bi bi-link-45deg me-1"></i>View Project
                            </a>
                          </div>
                        )}
                        {editingSection === 'projects' && (
                          <button className="btn btn-sm btn-outline-danger mt-2" onClick={()=>removeProject(idx)}>Remove</button>
                        )}
                      </div>
                    );
                  })
                )}
                {editingSection === 'projects' && (
                  <div className="card p-4 mt-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="mb-3">Add Project</h6>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Project Name *</label>
                        <input className="form-control" placeholder="e.g., E-Commerce Platform" value={newProject.project_name} onChange={e=>setNewProject({...newProject, project_name: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          rows={4} 
                          placeholder="Describe your project, its purpose, and key features..." 
                          value={newProject.description} 
                          onChange={e => setNewProject({...newProject, description: e.target.value})}
                          style={{ resize: 'vertical', minHeight: '100px' }}
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Skills / Technologies Used (comma separated)</label>
                        <input className="form-control" placeholder="e.g., React, Node.js, MongoDB" value={newProject.skills} onChange={e=>setNewProject({...newProject, skills: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          <input type="checkbox" className="form-check-input me-2" checked={newProject.is_current} onChange={e=>setNewProject({...newProject, is_current: e.target.checked})} />
                          Currently Working On
                        </label>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Start Month</label>
                        <select className="form-control" value={newProject.start_month} onChange={e=>setNewProject({...newProject, start_month: e.target.value})}>
                          <option value="">Month</option>
                          <option value="January">January</option>
                          <option value="February">February</option>
                          <option value="March">March</option>
                          <option value="April">April</option>
                          <option value="May">May</option>
                          <option value="June">June</option>
                          <option value="July">July</option>
                          <option value="August">August</option>
                          <option value="September">September</option>
                          <option value="October">October</option>
                          <option value="November">November</option>
                          <option value="December">December</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Start Year</label>
                        <input type="number" className="form-control" placeholder="YYYY" min="1950" max={new Date().getFullYear()} value={newProject.start_year} onChange={e=>setNewProject({...newProject, start_year: e.target.value})} />
                      </div>
                      {!newProject.is_current && (
                        <>
                          <div className="col-md-3">
                            <label className="form-label">End Month</label>
                            <select className="form-control" value={newProject.end_month} onChange={e=>setNewProject({...newProject, end_month: e.target.value})}>
                              <option value="">Month</option>
                              <option value="January">January</option>
                              <option value="February">February</option>
                              <option value="March">March</option>
                              <option value="April">April</option>
                              <option value="May">May</option>
                              <option value="June">June</option>
                              <option value="July">July</option>
                              <option value="August">August</option>
                              <option value="September">September</option>
                              <option value="October">October</option>
                              <option value="November">November</option>
                              <option value="December">December</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">End Year</label>
                            <input type="number" className="form-control" placeholder="YYYY" min="1950" max={new Date().getFullYear()} value={newProject.end_year} onChange={e=>setNewProject({...newProject, end_year: e.target.value})} />
                          </div>
                        </>
                      )}
                      <div className="col-md-6">
                        <label className="form-label">Contributors / Team Members (comma separated)</label>
                        <input className="form-control" placeholder="e.g., John Doe, Jane Smith" value={newProject.contributors} onChange={e=>setNewProject({...newProject, contributors: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Media or Links (GitHub, Live Demo, etc.)</label>
                        <input className="form-control" placeholder="https://github.com/user/project or https://project-demo.com" value={newProject.media} onChange={e=>setNewProject({...newProject, media: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <button type="button" className="btn btn-primary" onClick={addProject}>+ Add Project</button>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Resume Card */}
              <SectionCard
                id="resume"
                title="Resume 📄"
                isEditing={editingSection === 'resume'}
                onEdit={() => setEditingSection('resume')}
              >
                {editingSection === 'resume' ? (
                  <div>
                    <div className="mb-3">
                      <label className="form-label">Upload Resume</label>
                      <input 
                        type="file" 
                        className="form-control" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        disabled={uploadingResume}
                      />
                      <small className="form-text text-muted">
                        {uploadingResume ? 'Uploading to Cloudinary...' : 'Upload PDF, DOC, or DOCX file (Max 10MB)'}
                      </small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Or enter Resume URL</label>
                      <input 
                        className="form-control" 
                        type="url"
                        value={resumeUrl} 
                        onChange={e => setResumeUrl(e.target.value)}
                        placeholder="https://example.com/resume.pdf or Google Drive/Dropbox link"
                      />
                      <small className="form-text text-muted">You can also provide a direct URL to your resume</small>
                    </div>
                    {resumeUrl && (
                      <div className="mt-3">
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                          View Resume ↗️
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {resumeUrl ? (
                      <div>
                        <p style={{fontSize: '14px', color: '#555', marginBottom: '12px'}}>Your resume is available at:</p>
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                          View Resume ↗️
                        </a>
                      </div>
                    ) : (
                      <p style={{fontSize: '14px', color: '#555'}}>No resume uploaded yet. Click Edit to upload your resume.</p>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Profile;
