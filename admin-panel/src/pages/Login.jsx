import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (result.success) {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'coordinator') {
        navigate('/coordinator/dashboard');
      } else {
        setError('You are not authorized to access this panel. Only Admin and Coordinator can login here.');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Or login with email"
      leftTitle="Practice"
      leftSubtitle="easy to complex problems"
      footer={
        <span>
          Don't have an account? <Link to="/register">Sign up</Link>
        </span>
      }
    >
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="auth-social">
        <button type="button" className="btn-social">Login with LinkedIn</button>
        <button type="button" className="btn-social">Continue with Google</button>
      </div>

      <div className="auth-sep">Or login with email</div>

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="email">Email Id</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Enter Your Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="auth-action">
          <button type="submit" className="btn-primary-auth">Login</button>
        </div>
      </form>

      <div className="auth-footer" style={{marginTop:12}}>
        Access for Admin & Coordinator only
      </div>
    </AuthLayout>
  );
};

export default Login;

