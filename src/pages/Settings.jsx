import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import MyPortfolio from './MyPortfolio';

const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'profile';

  usePageMeta('Settings', 'Manage your profile, portfolio, and account.');

  function setTab(id) {
    setSearchParams(id === 'profile' ? {} : { tab: id });
  }

  if (authLoading) return <p>Loading…</p>;
  if (!user) return <p>You need to log in to view settings.</p>;

  return (
    <div className="settings-page">
      <p className="kicker">Settings</p>
      <h1>Manage your account</h1>

      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab-active' : ''}`}
              onClick={() => setTab(tab.id)}
            >
              <span className="settings-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'portfolio' && <MyPortfolio embedded />}
          {activeTab === 'account' && <AccountTab user={user} />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatar, setAvatar] = useState(user.avatar ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSaved(false);
    try {
      await apiClient.patch('/profile', { name, bio: bio || null, avatar: avatar || null });
      await refreshUser();
      setSaved(true);
    } catch {
      setError('Something went wrong saving your profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <h2>Profile</h2>
      <p className="post-meta">This is what shows on your public author profile.</p>

      <label htmlFor="name">Name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="avatar">Avatar image URL</label>
      <input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />

      <label htmlFor="bio">Bio</label>
      <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />

      {error && <p className="form-error">{error}</p>}
      {saved && <p className="form-success">Profile saved.</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}

function AccountTab({ user }) {
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState(user.email ?? '');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailSubmitting(true);
    setEmailError('');
    setEmailSaved(false);
    try {
      await apiClient.patch('/account/email', { email, current_password: emailPassword });
      await refreshUser();
      setEmailPassword('');
      setEmailSaved(true);
    } catch (err) {
      setEmailError(err.response?.data?.errors?.current_password?.[0] || err.response?.data?.errors?.email?.[0] || 'Could not update email.');
    } finally {
      setEmailSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError('');
    setPasswordSaved(false);
    try {
      await apiClient.patch('/account/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      });
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.response?.data?.errors?.current_password?.[0] || err.response?.data?.errors?.password?.[0] || 'Could not update password.');
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <div className="settings-account-tab">
      <form onSubmit={handleEmailSubmit} className="settings-form">
        <h2>Email address</h2>
        <p className="post-meta">You'll use this to log in going forward.</p>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="email-current-password">Current password</label>
        <input
          id="email-current-password"
          type="password"
          value={emailPassword}
          onChange={(e) => setEmailPassword(e.target.value)}
          placeholder="Confirm it's you"
          required
        />

        {emailError && <p className="form-error">{emailError}</p>}
        {emailSaved && <p className="form-success">Email updated.</p>}

        <button type="submit" disabled={emailSubmitting}>
          {emailSubmitting ? 'Saving…' : 'Update email'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="settings-form">
        <h2>Password</h2>
        <p className="post-meta">Use at least 8 characters.</p>

        <label htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />

        <label htmlFor="new-password-confirmation">Confirm new password</label>
        <input
          id="new-password-confirmation"
          type="password"
          value={newPasswordConfirmation}
          onChange={(e) => setNewPasswordConfirmation(e.target.value)}
          minLength={8}
          required
        />

        {passwordError && <p className="form-error">{passwordError}</p>}
        {passwordSaved && <p className="form-success">Password updated.</p>}

        <button type="submit" disabled={passwordSubmitting}>
          {passwordSubmitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
