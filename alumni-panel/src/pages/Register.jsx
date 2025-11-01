import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import AuthLayout from '../components/AuthLayout';
import PasswordToggle from '../components/PasswordToggle';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    enrollmentNumber: '',
    graduationYear: '',
    phone: ''
  });
  const [step, setStep] = useState('role');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await register(formData);

    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Redirect to dashboard immediately - popup will show there
      if (user.role === 'student') {
        navigate('/student/dashboard');
      } else if (user.role === 'alumni') {
        navigate('/alumni/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <Header />
      <AuthLayout
        title="Create a new account"
        subtitle="Join and find your opportunities"
        leftTitle="Create a new account"
        leftSubtitle="Compete, learn, and grow"
        footer={<span>Already have an account? <Link to="/login">Login</Link></span>}
        withHeader
      >
        {error && (<div className="alert alert-danger" role="alert">{error}</div>)}

        {step === 'role' ? (
          <>
            <div className="role-options">
              <div
                className={`role-card ${formData.role === 'student' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'student' })}
              >
                {formData.role === 'student' && <span className="checkmark">✓</span>}
                <div className="role-title">Sign up as a Student</div>
                <div className="role-desc">Compete, learn, and apply for opportunities</div>
              </div>
              <div
                className={`role-card secondary ${formData.role === 'alumni' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'alumni' })}
              >
                {formData.role === 'alumni' && <span className="checkmark">✓</span>}
                <div className="role-title">Sign up as an Alumni</div>
                <div className="role-desc">Mentor, network, and explore jobs</div>
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
            <div className="form-grid">
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
          <div className="form-grid">
            <div className="auth-field">
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label htmlFor="enrollmentNumber">Enrollment Number</label>
              <input type="text" id="enrollmentNumber" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} />
            </div>
          </div>
            <div className="auth-field">
              <label htmlFor="graduationYear">Graduation Year</label>
              <select id="graduationYear" name="graduationYear" value={formData.graduationYear} onChange={handleChange} required>
                <option value="">Select year</option>
                {(() => {
                  const start = 2012;
                  const end = new Date().getFullYear() + 4;
                  const opts = [];
                  for (let y = start; y <= end; y++) {
                    opts.push(<option key={y} value={y}>{y}</option>);
                  }
                  return opts;
                })()}
              </select>
            </div>
            <div className="auth-action">
              <button type="submit" className="btn-primary-auth">Register</button>
            </div>
          </form>
        )}
      </AuthLayout>
    </>
  );
};

export default Register;

