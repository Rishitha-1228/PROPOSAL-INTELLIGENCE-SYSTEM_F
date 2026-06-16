import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signupUser } from '../services/api';
import './Authpage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [selectedRole, setSelectedRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'editor'
  });

  // ── LOGIN ────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setMessage('Please enter email and password');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await loginUser(loginData.email, loginData.password);

      // Save token and user to localStorage
      localStorage.setItem('pis_token', data.token);
      localStorage.setItem('pis_user', JSON.stringify(data.user));

      setMessage('Login successful!');
      setMessageType('success');

      // Route based on role
      if (data.user.role === 'viewer') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
      setMessageType('error');
    }
    setLoading(false);
  };

  // ── SIGNUP ───────────────────────────────────────
  const handleSignup = async () => {
    if (!signupData.firstName || !signupData.lastName) {
      setMessage('Please enter your full name');
      setMessageType('error');
      return;
    }
    if (!signupData.email || !signupData.password) {
      setMessage('Please enter email and password');
      setMessageType('error');
      return;
    }
    if (signupData.password.length < 8) {
      setMessage('Password must be at least 8 characters');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const data = await signupUser({
        first_name: signupData.firstName,
        last_name: signupData.lastName,
        email: signupData.email,
        password: signupData.password,
        role: signupData.role
      });

      localStorage.setItem('pis_token', data.token);
      localStorage.setItem('pis_user', JSON.stringify(data.user));

      setMessage('Account created!');
      setMessageType('success');

      if (data.user.role === 'viewer') {
        navigate('/faculty-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Signup failed');
      setMessageType('error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div>
          <div className="logo">🚀</div>
          <h1>Proposal Intelligence Platform</h1>
          <p>AI-powered proposal and competency intelligence platform for enterprise teams.</p>
        </div>
        <div className="roles-box">
          <div
            className={selectedRole === 'editor' ? 'role-card active-role' : 'role-card'}
            onClick={() => { setSelectedRole('editor'); setSignupData({ ...signupData, role: 'editor' }); }}
          >
            <h3>💼 BD Manager</h3>
            <p>Manage opportunities, proposals and AI workflows.</p>
          </div>
          <div
            className={selectedRole === 'admin' ? 'role-card active-role' : 'role-card'}
            onClick={() => { setSelectedRole('admin'); setSignupData({ ...signupData, role: 'admin' }); }}
          >
            <h3>👑 Director</h3>
            <p>Full access — manage team, data, and analytics.</p>
          </div>
          <div
            className={selectedRole === 'viewer' ? 'role-card active-role' : 'role-card'}
            onClick={() => { setSelectedRole('viewer'); setSignupData({ ...signupData, role: 'viewer' }); }}
          >
            <h3>🎓 Faculty</h3>
            <p>Review proposals and approve approach notes.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setMessage(''); }}>
            Sign In
          </button>
          <button className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setMessage(''); }}>
            Create Account
          </button>
        </div>

        {message && (
          <div className="message" style={{ color: messageType === 'success' ? 'green' : 'red' }}>
            {message}
          </div>
        )}

        {tab === 'login' ? (
          <div className="form-box">
            <h2>Welcome Back</h2>
            <p>Signing in as <strong>
              {selectedRole === 'viewer' ? 'Faculty' : selectedRole === 'admin' ? 'Director' : 'BD Manager'}
            </strong></p>
            <input
              type="email" placeholder="Email Address"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              type="password" placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        ) : (
          <div className="form-box">
            <h2>Create Account</h2>
            <input
              type="text"
              placeholder="First Name"
              value={signupData.firstName}
              onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={signupData.lastName}
              onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
            />
            <button onClick={handleSignup} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}