import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import AuthLayout from '../components/AuthLayout';
import PasswordToggle from '../components/PasswordToggle';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'coordinator',
    department: '',
    phone: '',
    staffId: ''
  });
  const [step, setStep] = useState('role');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { confirmPassword, ...payload } = formData;
      const response = await api.post('/auth/register', payload);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess('Registration successful! Redirecting...');
      
      setTimeout(() => {
        if (user.role === 'coordinator') {
          navigate('/coordinator/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        }
      }, 1500);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <AuthLayout
      title="Create a new account"
      subtitle="Join and manage the portal"
      leftTitle="Jobs"
      leftSubtitle="of various employment types"
      footer={
        <span>
          Already have an account? <Link to="/login">Login</Link>
        </span>
      }
    >
      {error && (<div className="alert alert-danger" role="alert">{error}</div>)}
      {success && (<div className="alert alert-success" role="alert">{success}</div>)}

      {step === 'role' ? (
        <>
          <div className="role-options">
            <div
              className={`role-card ${formData.role === 'coordinator' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'coordinator' })}
            >
              {formData.role === 'coordinator' && <span className="checkmark">✓</span>}
              <div className="role-title">Sign up as a Coordinator</div>
              <div className="role-desc">Manage departments, activities, and users</div>
            </div>
            <div
              className={`role-card secondary ${formData.role === 'admin' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, role: 'admin' })}
            >
              {formData.role === 'admin' && <span className="checkmark">✓</span>}
              <div className="role-title">Sign up as an Admin</div>
              <div className="role-desc">Full platform access and controls</div>
            </div>
          </div>
          <div className="auth-action">
            <button type="button" className="btn-primary-auth" onClick={() => setStep('form')}>Next</button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div style={{display:'flex', gap:8}}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                style={{flex:1}}
              />
              <PasswordToggle isVisible={showPassword} onClick={() => setShowPassword(!showPassword)} />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{display:'flex', gap:8}}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                style={{flex:1}}
              />
              <PasswordToggle isVisible={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="department">Department</label>
            <select id="department" name="department" value={formData.department} onChange={handleChange} required>
              <option value="">Select department</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
              <option value="Electronics and Telecommunication">Electronics and Telecommunication</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="phone">Phone</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="auth-field">
            <label htmlFor="staffId">Staff ID/Number</label>
            <input type="text" id="staffId" name="staffId" value={formData.staffId} onChange={handleChange} required />
          </div>
          <div className="auth-action">
            <button type="submit" className="btn-primary-auth">Register</button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default Register;

