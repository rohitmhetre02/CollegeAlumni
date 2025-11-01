import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import ProfileTopCard from '../components/ProfileTopCard';
import { uploadImageToCloudinary, uploadResumeToCloudinary } from '../utils/cloudinary';

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
    enrollmentNumber: user?.enrollmentNumber || '',
    linkedinUrl: user?.linkedinUrl || '',
    facebookUrl: user?.facebookUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
    githubUrl: user?.githubUrl || '',
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
  const [newExperience, setNewExperience] = useState({ title: '', company: '', duration: '', description: '' });
  const [newProject, setNewProject] = useState({ title: '', githubLink: '', projectLink: '', description: '', skills: '' });

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
  });

  const role = user?.role;
  const isStudent = role === 'student';
  const isAlumni = role === 'alumni';
  const isAcademia = role === 'coordinator' || role === 'admin';

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

  // Scroll to active section
  useEffect(() => {
    const el = document.getElementById(activeSection);
    if (el) {
      const offset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, [activeSection]);

  // Handle editable fields only for main info
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  async function saveHeader() {
    setSaving(true); setMessage('');
    try {
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
      };
      const { data } = await api.put('/users/profile', payload);
      setUser && setUser(data);
      setForm(f => ({ ...f, ...payload }));
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
    
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setHeaderForm(h => ({ ...h, profilePicture: imageUrl }));
      setMessage('Image uploaded successfully!');
    } catch (error) {
      setMessage('Failed to upload image. Please try again.');
    }
    setUploadingImage(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size should be less than 10MB');
      return;
    }

    setUploadingResume(true);
    try {
      const resumeUrl = await uploadResumeToCloudinary(file);
      setResumeUrl(resumeUrl);
      setMessage('Resume uploaded successfully!');
      // Save to backend
      await api.put('/users/profile', { resumeUrl });
    } catch (error) {
      setMessage('Failed to upload resume. Please try again.');
    }
    setUploadingResume(false);
  };

  const handleSave = async (sectionId = null) => {
    setSaving(true); setMessage('');
    try {
      const payload = { 
        ...form,
        skills,
        languages,
        experience,
        projects,
        resumeUrl,
        location: form.location,
        gender: form.gender,
        headline: form.headline,
        degree: form.degree,
        college: form.college,
      };
      const { data } = await api.put('/users/profile', payload);
      setUser && setUser(data);
      setEditingSection(null);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
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
    if (!newExperience.title.trim()) return;
    setExperience(list => [...list, { ...newExperience, title: newExperience.title.trim() }]);
    setNewExperience({ title: '', company: '', duration: '', description: '' });
  }
  function removeExperience(idx) { setExperience(list => list.filter((_, i) => i!==idx)); }

  function addProject() {
    if (!newProject.title.trim()) return;
    const proj = {
      title: newProject.title.trim(),
      githubLink: newProject.githubLink.trim(),
      projectLink: newProject.projectLink.trim(),
      description: newProject.description.trim(),
      skills: newProject.skills.split(',').map(s=>s.trim()).filter(Boolean)
    };
    setProjects(list => [...list, proj]);
    setNewProject({ title: '', githubLink: '', projectLink: '', description: '', skills: '' });
  }
  function removeProject(index) { setProjects(list => list.filter((_, i)=>i!==index)); }

  const scrollToSection = (id) => {
    setActiveSection(id);
  };

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
                  <input className="form-control" type="email" value={headerForm.email} onChange={e=>setHeaderForm(h=>({...h,email:e.target.value}))} disabled />
                  <small className="text-muted">Email cannot be changed</small>
                </div>
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
                {[
                  { id: 'about', label: 'About' },
                  { id: 'education', label: 'Education' },
                  { id: 'skills', label: 'Key skills' },
                  { id: 'languages', label: 'Languages' },
                  { id: 'experience', label: 'Experience' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'resume', label: 'Resume' },
                ].map(link => (
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
                    onClick={() => scrollToSection(link.id)}
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

              {/* Education Card */}
              <SectionCard
                id="education"
                title="Education 🎓"
                isEditing={editingSection === 'education'}
                onEdit={() => setEditingSection('education')}
              >
                {editingSection === 'education' ? (
                  <div>
                    <div className="mb-3">
                      <label className="form-label">Degree</label>
                      <input className="form-control" value={form.degree || ''} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} placeholder="e.g., B.E., B.Tech, M.Tech" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">College/University</label>
                      <input className="form-control" value={form.college || ''} onChange={e => setForm(f => ({ ...f, college: e.target.value }))} placeholder="Enter college/university name" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Graduation Year</label>
                      <input className="form-control" type="number" value={form.graduationYear || ''} onChange={e => setForm(f => ({ ...f, graduationYear: e.target.value }))} placeholder="e.g., 2024" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <input className="form-control" value={user?.department || form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g., Computer Science" />
                    </div>
                  </div>
                ) : (
                  <div>
                    {(form.degree || form.college || form.graduationYear || user?.department) ? (
                      <div>
                        {(form.degree || form.college) && (
                          <div style={{marginBottom: '20px'}}>
                            <p style={{fontSize: '14px', color: '#555', marginBottom: '4px'}}>
                              <strong>{form.degree || 'B.E.'}</strong> {form.college && `from ${form.college}`}
                            </p>
                            {form.graduationYear && (
                              <p style={{fontSize: '14px', color: '#555'}}>
                                Graduation Year: {form.graduationYear}
                              </p>
                            )}
                            {user?.department && (
                              <p style={{fontSize: '14px', color: '#555'}}>
                                Department: {user.department}
                              </p>
                            )}
                          </div>
                        )}
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
                    {experience.map((exp, i) => (
                      <div key={i} className="mb-3 p-3 rounded bg-light">
                        <div className="fw-semibold">{exp.title} at {exp.company}</div>
                        <div className="small text-muted mb-1">{exp.duration}</div>
                        <div className="small">{exp.description}</div>
                        {editingSection === 'experience' && (
                          <button className="btn btn-sm btn-outline-danger mt-2" onClick={()=>removeExperience(i)}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {editingSection === 'experience' && (
                  <div className="card p-3 mt-3">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Title" value={newExperience.title} onChange={e=>setNewExperience({...newExperience, title: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Company" value={newExperience.company} onChange={e=>setNewExperience({...newExperience, company: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Duration" value={newExperience.duration} onChange={e=>setNewExperience({...newExperience, duration: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <textarea className="form-control" rows={2} placeholder="Description" value={newExperience.description} onChange={e=>setNewExperience({...newExperience, description: e.target.value})}></textarea>
                      </div>
                      <div className="col-12">
                        <button type="button" className="btn btn-outline-primary" onClick={addExperience}>+ Add Experience</button>
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
                  projects.map((p,idx) => (
                    <div key={idx} className="mb-3 p-3 rounded bg-light">
                      <div className="fw-semibold">{p.title} {p.year && <span className="text-muted ms-1 small">({p.year})</span>}</div>
                      {(p.githubLink || p.projectLink) && (
                        <div className="small mb-1">
                          {p.githubLink && <a href={p.githubLink} target="_blank" rel="noreferrer" className="me-2">GitHub</a>}
                          {p.projectLink && <a href={p.projectLink} target="_blank" rel="noreferrer">Live</a>}
                        </div>
                      )}
                      <div className="small text-muted mb-1">{p.description}</div>
                      {!!(p.skills||[]).length && <div className="d-flex flex-wrap gap-1 mb-2">{p.skills.map((s,i)=>(<span key={i} className="badge bg-secondary">{s}</span>))}</div>}
                      {editingSection === 'projects' && <button className="btn btn-sm btn-outline-danger mt-2" onClick={()=>removeProject(idx)}>Remove</button>}
                    </div>
                  ))
                )}
                {editingSection === 'projects' && (
                  <div className="card p-3 mt-3">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Title" value={newProject.title} onChange={e=>setNewProject({...newProject,title:e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <input className="form-control" placeholder="GitHub Link" value={newProject.githubLink} onChange={e=>setNewProject({...newProject,githubLink:e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Project Link" value={newProject.projectLink} onChange={e=>setNewProject({...newProject,projectLink:e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <input className="form-control" placeholder="Skills (comma separated)" value={newProject.skills} onChange={e=>setNewProject({...newProject,skills:e.target.value})} />
                      </div>
                      <div className="col-12">
                        <textarea className="form-control" rows={2} placeholder="Description" value={newProject.description} onChange={e=>setNewProject({...newProject,description:e.target.value})}></textarea>
                      </div>
                      <div className="col-12">
                        <button type="button" className="btn btn-outline-primary" onClick={addProject}>+ Add Project</button>
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
