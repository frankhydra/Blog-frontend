import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MailIcon } from '../components/AuthIcons';
import PasswordField from '../components/PasswordField';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      // Send each role to their own dashboard instead of always the
      // public homepage - the whole point of building those dashboards
      // was to give each role a real landing page with what needs their
      // attention, so login should actually take them there.
      const dashboardByRole = {
        admin: '/admin/dashboard',
        author: '/author/dashboard',
        contributor: '/contributor/dashboard',
      };
      navigate(dashboardByRole[user.role] ?? '/');
    } catch {
      setError('Those credentials do not match our records.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <p className="kicker">Account</p>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in to write, comment, and pick up where you left off.</p>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <div className="auth-input-wrap">
            <MailIcon className="auth-input-icon" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
