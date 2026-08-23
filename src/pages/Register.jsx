import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MailIcon, UserIcon } from '../components/AuthIcons';
import PasswordField from '../components/PasswordField';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, passwordConfirmation);
      navigate('/');
    } catch (err) {
      // Laravel validation errors (e.g. "email already taken") come back
      // as a structured object - grab the first message if present.
      const firstError = Object.values(err.response?.data?.errors ?? {})[0]?.[0];
      setError(firstError || 'Something went wrong creating your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card">
        <p className="kicker">Account</p>
        <h1>Create an account</h1>
        <p className="auth-subtitle">
          New accounts start as a contributor. The site admin can promote you
          to author once you're ready to publish publicly.
        </p>

        <div className="auth-field">
          <label htmlFor="name">Name</label>
          <div className="auth-input-wrap">
            <UserIcon className="auth-input-icon" />
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        </div>

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
          autoComplete="new-password"
          minLength={8}
          required
        />

        <PasswordField
          id="password_confirmation"
          label="Confirm password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
