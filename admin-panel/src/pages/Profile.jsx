import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Sidebar from '../components/Sidebar';
import { uploadImageToBackend, uploadResumeToBackend } from '../utils/upload';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/sidebar.css';

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    bio: '',
    profilePicture: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success'); // 'success' or 'danger'
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        role: user.role || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || ''
      });
      setImagePreview(user.profilePicture || '');
      setResumeUrl(user.resumeUrl || '');
      setLoading(false);
    }
  }, [user]);

  // Fetch departments list
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setMsg(''); // Clear message on change
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMsg('Please select a valid image file (JPG, PNG, GIF)');
      setMsgType('danger');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg('Image size should be less than 5MB');
      setMsgType('danger');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setMsg('');

    // Upload image immediately to Cloudinary
    setUploadingImage(true);
    try {
      const imageUrl = await uploadImageToBackend(file);
      if (!imageUrl) {
        throw new Error('No URL returned from Cloudinary');
      }
      
      // Update form state
      setForm(f => ({ ...f, profilePicture: imageUrl }));
      setImagePreview(imageUrl);
      
      // Save to backend immediately
      try {
        const { data } = await api.put('/users/profile', { profilePicture: imageUrl });
        // Update user context and localStorage immediately
        if (setUser && data) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
        setMsg('Profile picture uploaded and saved successfully!');
        setMsgType('success');
      } catch (saveError) {
        console.error('Error saving profile picture:', saveError);
        // Still show success for upload, but warn about save
        setMsg('Picture uploaded but failed to save. Please click "Save Changes" to save it.');
        setMsgType('danger');
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      const errorMessage = error?.message || 'Failed to upload image. Please check your Cloudinary configuration.';
      setMsg(errorMessage);
      setMsgType('danger');
      setSelectedImage(null);
      setImagePreview(user?.profilePicture || '');
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
      setMsg('Please select a valid resume file (PDF, DOC, or DOCX)');
      setMsgType('danger');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMsg('Resume size should be less than 10MB');
      setMsgType('danger');
      return;
    }

    setUploadingResume(true);
    setMsg('');
    try {
      const uploadedResumeUrl = await uploadResumeToBackend(file);
      if (!uploadedResumeUrl) {
        throw new Error('No URL returned from Cloudinary');
      }
      setResumeUrl(uploadedResumeUrl);
      setMsg('Resume uploaded successfully!');
      setMsgType('success');
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      console.error('Error uploading resume to Cloudinary:', error);
      const errorMessage = error?.message || 'Failed to upload resume. Please check your Cloudinary configuration.';
      setMsg(errorMessage);
      setMsgType('danger');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    // Validation
    if (!form.name || !form.email) {
      setMsg('Name and Email are required');
      setMsgType('danger');
      setSaving(false);
      return;
    }

    try {
      const payload = { ...form, resumeUrl };
      const { data } = await api.put('/users/profile', payload);
      // Update user context and localStorage
      setUser && setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Update form state with the response data
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.department || '',
        role: data.role || '',
        bio: data.bio || '',
        profilePicture: data.profilePicture || ''
      });
      
      // Update image preview if profile picture was saved
      if (data.profilePicture) {
        setImagePreview(data.profilePicture);
      }
      
      // Update resume URL if saved
      if (data.resumeUrl) {
        setResumeUrl(data.resumeUrl);
      }
      
      // Clear selected image after successful save
      setSelectedImage(null);
      
      // Show success message
      setMsg('Profile updated successfully!');
      setMsgType('success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMsg('');
      }, 3000);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to update profile');
      setMsgType('danger');
    } finally {
      setSaving(false);
    }
  };

  const getProfilePictureUrl = () => {
    if (imagePreview) return imagePreview;
    if (user?.profilePicture) return user.profilePicture;
    // Generate avatar from name
    const name = user?.name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=007bff&color=fff&bold=true`;
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="sidebar-main-content flex-grow-1 p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="sidebar-main-content flex-grow-1 p-4">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="fw-bold mb-0">
              <i className="bi bi-person-circle me-2"></i>My Profile
            </h2>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i>Back
            </button>
          </div>

          {msg && (
            <div className={`alert alert-${msgType} alert-dismissible fade show`} role="alert">
              <i className={`bi bi-${msgType === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2`}></i>
              {msg}
              <button type="button" className="btn-close" onClick={() => setMsg('')}></button>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="row">
              {/* Left Column - Profile Picture */}
              <div className="col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-image me-2"></i>Profile Picture
                    </h5>
                  </div>
                  <div className="card-body text-center p-4">
                    <div className="mb-4">
                      <img
                        src={getProfilePictureUrl()}
                        alt="Profile"
                        className="rounded-circle border border-4 border-primary"
                        style={{
                          width: '200px',
                          height: '200px',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => document.getElementById('profileImageInput').click()}
                        title="Click to upload new image"
                      />
                    </div>
                    <input
                      type="file"
                      id="profileImageInput"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                    <div className="mb-3">
                      <label htmlFor="profileImageInput" className="btn btn-primary btn-sm">
                        {uploadingImage ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-arrow-up me-2"></i>
                            {form.profilePicture ? 'Change Picture' : 'Upload Picture'}
                          </>
                        )}
                      </label>
                    </div>
                    {form.profilePicture && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          setForm(f => ({ ...f, profilePicture: '' }));
                          setImagePreview('');
                          setSelectedImage(null);
                        }}
                      >
                        <i className="bi bi-trash me-2"></i>Remove Picture
                      </button>
                    )}
                    <p className="text-muted small mt-3 mb-0">
                      <i className="bi bi-info-circle me-1"></i>
                      Recommended: Square image, max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Profile Information */}
              <div className="col-lg-8 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-badge me-2"></i>Profile Information
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      {/* Name */}
                      <div className="col-md-6">
                        <label htmlFor="name" className="form-label">
                          <i className="bi bi-person me-2"></i>Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">
                          <i className="bi bi-envelope me-2"></i>Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="Enter your email"
                        />
                      </div>

                      {/* Phone */}
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">
                          <i className="bi bi-telephone me-2"></i>Phone Number
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                        />
                      </div>

                      {/* Department */}
                      <div className="col-md-6">
                        <label htmlFor="department" className="form-label">
                          <i className="bi bi-building me-2"></i>Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="department"
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      {/* Role */}
                      <div className="col-md-6">
                        <label htmlFor="role" className="form-label">
                          <i className="bi bi-shield-check me-2"></i>Role <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="role"
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="admin">Admin</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="student">Student</option>
                          <option value="alumni">Alumni</option>
                        </select>
                      </div>

                      {/* Bio */}
                      <div className="col-12">
                        <label htmlFor="bio" className="form-label">
                          <i className="bi bi-file-text me-2"></i>Bio / About Me
                        </label>
                        <textarea
                          className="form-control"
                          id="bio"
                          name="bio"
                          rows="5"
                          value={form.bio}
                          onChange={handleChange}
                          placeholder="Tell us about yourself..."
                          style={{ resize: 'vertical' }}
                        />
                        <div className="form-text">
                          <i className="bi bi-info-circle me-1"></i>
                          Write a brief description about yourself (optional)
                        </div>
                      </div>

                      {/* Resume Section */}
                      <div className="col-12">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">
                              <i className="bi bi-file-earmark-pdf me-2"></i>Resume
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <label htmlFor="resumeInput" className="form-label">
                                Upload Resume
                              </label>
                              <input
                                type="file"
                                id="resumeInput"
                                className="form-control"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                disabled={uploadingResume}
                              />
                              <small className="form-text text-muted">
                                {uploadingResume ? (
                                  <span className="text-primary">
                                    <i className="bi bi-arrow-repeat spin me-1"></i>
                                    Uploading to Cloudinary...
                                  </span>
                                ) : (
                                  'Upload PDF, DOC, or DOCX file (Max 10MB)'
                                )}
                              </small>
                            </div>
                            <div className="mb-3">
                              <label htmlFor="resumeUrl" className="form-label">
                                Or enter Resume URL
                              </label>
                              <input
                                type="url"
                                id="resumeUrl"
                                className="form-control"
                                value={resumeUrl}
                                onChange={(e) => setResumeUrl(e.target.value)}
                                placeholder="https://example.com/resume.pdf or Google Drive/Dropbox link"
                              />
                              <small className="form-text text-muted">
                                You can also provide a direct URL to your resume
                              </small>
                            </div>
                            {resumeUrl && (
                              <div className="mt-3">
                                <a
                                  href={resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline-primary"
                                >
                                  <i className="bi bi-eye me-2"></i>View Resume
                                </a>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm ms-2"
                                  onClick={() => {
                                    setResumeUrl('');
                                    setMsg('Resume URL cleared');
                                    setMsgType('info');
                                    setTimeout(() => setMsg(''), 2000);
                                  }}
                                >
                                  <i className="bi bi-trash me-1"></i>Clear
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card shadow-sm mt-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">Last Updated</h6>
                    <small className="text-muted">
                      {user?.updatedAt 
                        ? new Date(user.updatedAt).toLocaleString()
                        : 'Never'}
                    </small>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary me-2"
                      onClick={() => {
                        setForm({
                          name: user?.name || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          department: user?.department || '',
                          role: user?.role || '',
                          bio: user?.bio || '',
                          profilePicture: user?.profilePicture || ''
                        });
                        setImagePreview(user?.profilePicture || '');
                        setResumeUrl(user?.resumeUrl || '');
                        setSelectedImage(null);
                        setMsg('');
                      }}
                      disabled={saving}
                    >
                      <i className="bi bi-arrow-counterclockwise me-2"></i>Reset
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving || uploadingImage || uploadingResume}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
