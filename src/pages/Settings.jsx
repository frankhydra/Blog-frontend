import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import MyPortfolio from './MyPortfolio';

// Icons for the Profile tab's card headers - same minimal line-icon style
// (24x24 viewBox, currentColor stroke) as the TABS icons below, so the new
// cards read as part of the same system rather than a bolted-on look.
const ICON_PHOTO = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8.5" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M21 15l-5.5-5-4 4-2-1.5L3 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_ID = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="9" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6 16.5c.7-1.6 2-2.4 3-2.4s2.3.8 3 2.4M14 9.5h4M14 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ICON_CODE = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_SHARE = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.1 10.8l6.8-3.6M8.1 13.2l6.8 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ICON_UPLOAD = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

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
    id: 'experience',
    label: 'Experience',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" stroke="currentColor" strokeWidth="1.8" />
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

  usePageMeta('Settings', 'Manage your profile, portfolio, experience, and account.');

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
          {activeTab === 'experience' && <ExperienceTab />}
          {activeTab === 'account' && <AccountTab user={user} />}
        </div>
      </div>
    </div>
  );
}

const SOCIAL_PLATFORMS = [
  { key: 'github', label: 'GitHub' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'instagram', label: 'Instagram' },
];

function ProfileTab({ user }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name ?? '');
  const [headline, setHeadline] = useState(user.headline ?? '');
  const [availability, setAvailability] = useState(user.availability ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatar, setAvatar] = useState(user.avatar ?? '');
  const [website, setWebsite] = useState(user.website ?? '');
  const [location, setLocation] = useState(user.location ?? '');
  const [skills, setSkills] = useState(user.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    github: user.social_links?.github ?? '',
    linkedin: user.social_links?.linkedin ?? '',
    twitter: user.social_links?.twitter ?? '',
    instagram: user.social_links?.instagram ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Avatar upload - actual file upload via /api/uploads (same endpoint and
  // pattern BookForm uses for cover images), rather than only accepting a
  // pasted URL. The URL field is kept as a fallback, tucked behind a toggle.
  const avatarFileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [showAvatarUrlField, setShowAvatarUrlField] = useState(false);

  const BIO_LIMIT = 1000;

  function addSkill() {
    const value = skillInput.trim();
    if (value && !skills.includes(value) && skills.length < 20) {
      setSkills([...skills, value]);
    }
    setSkillInput('');
  }

  function removeSkill(skill) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleAvatarFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploadError('');
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      const res = await apiClient.post('/uploads', formData);
      setAvatar(res.data.url);
    } catch {
      setAvatarUploadError('Upload failed - try a JPG, PNG, or WebP under 5MB.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSaved(false);
    try {
      await apiClient.patch('/profile', {
        name,
        headline: headline || null,
        availability: availability || null,
        bio: bio || null,
        avatar: avatar || null,
        website: website || null,
        location: location || null,
        skills,
        social_links: socialLinks,
      });
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.errors?.website?.[0] || 'Something went wrong saving your profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-editor">
      <form onSubmit={handleSubmit} className="profile-editor-form">

        {/* --- Avatar --- */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">{ICON_PHOTO}</span>
            <div>
              <p className="settings-card-eyebrow">Identity</p>
              <h2>Avatar photo</h2>
            </div>
          </div>
          <p className="settings-card-desc">
            Shown on your public author profile, your portfolio, and next to your posts and comments.
          </p>

          <div className="avatar-upload-row">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="avatar-upload-preview"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="avatar-upload-preview avatar-field-fallback">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </span>
            )}

            <div className="avatar-upload-actions">
              <input
                ref={avatarFileInputRef}
                id="avatar-file"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarFileChange}
                hidden
              />
              <div className="avatar-upload-buttons">
                <button
                  type="button"
                  className="avatar-upload-button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  <span className="avatar-upload-button-icon">{ICON_UPLOAD}</span>
                  {avatarUploading ? 'Uploading…' : 'Upload image'}
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowAvatarUrlField((s) => !s)}
                >
                  {showAvatarUrlField ? 'Cancel' : 'Paste a URL instead'}
                </button>
              </div>

              {showAvatarUrlField && (
                <input
                  className="avatar-url-input"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              )}

              {avatarUploadError && <p className="form-error">{avatarUploadError}</p>}
              <p className="settings-card-hint">JPG, PNG, or WebP. Max 5MB.</p>
            </div>
          </div>
        </section>

        {/* --- Core profile details --- */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">{ICON_ID}</span>
            <div>
              <p className="settings-card-eyebrow">About you</p>
              <h2>Profile details</h2>
            </div>
          </div>

          <div className="settings-field-grid">
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Frontend developer & occasional writer"
                maxLength={160}
              />
            </div>
            <div>
              <label htmlFor="location">Location</label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Douala, Cameroon"
              />
            </div>
            <div>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
              />
            </div>
          </div>

          <label htmlFor="availability">Availability status</label>
          <input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Available for freelance work"
            maxLength={120}
          />

          <div className="field-label-row">
            <label htmlFor="bio">Elevator bio pitch</label>
            <span className={`char-counter ${bio.length > BIO_LIMIT ? 'char-counter-over' : ''}`}>
              {bio.length}/{BIO_LIMIT}
            </span>
          </div>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_LIMIT))}
            rows={5}
            placeholder="A couple of sentences about you and what you write about."
          />
        </section>

        {/* --- Skills --- */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">{ICON_CODE}</span>
            <div>
              <p className="settings-card-eyebrow">Skills</p>
              <h2>Core tech stack & skill badges</h2>
            </div>
          </div>

          <div className="skill-input-row">
            <input
              id="skill-input"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill tag and press Enter (e.g. TypeScript, React)…"
            />
            <button type="button" onClick={addSkill} className="skill-add-button">+ Add</button>
          </div>
          {skills.length > 0 && (
            <div className="skill-chip-row">
              {skills.map((skill) => (
                <span key={skill} className="skill-chip skill-chip-removable">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>&times;</button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* --- Social links --- */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">{ICON_SHARE}</span>
            <div>
              <p className="settings-card-eyebrow">Elsewhere</p>
              <h2>Social media handles</h2>
            </div>
          </div>

          <div className="social-links-grid">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key}>
                <label htmlFor={`social-${platform.key}`}>{platform.label}</label>
                <input
                  id={`social-${platform.key}`}
                  type="url"
                  value={socialLinks[platform.key]}
                  onChange={(e) => setSocialLinks({ ...socialLinks, [platform.key]: e.target.value })}
                  placeholder={`https://${platform.key}.com/you`}
                />
              </div>
            ))}
          </div>
        </section>

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">Profile saved.</p>}

        <button type="submit" className="settings-save-button" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <aside className="profile-preview">
        <p className="profile-preview-label">Live preview</p>
        <div className="profile-preview-card">
          {avatar ? (
            <img src={avatar} alt="" className="profile-preview-avatar" />
          ) : (
            <span className="profile-preview-avatar avatar-field-fallback">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </span>
          )}
          <h3>{name || 'Your name'}</h3>
          {headline && <p className="profile-preview-headline">{headline}</p>}
          {availability && (
            <span className="availability-pill availability-pill-sm">
              <span className="availability-dot" />
              {availability}
            </span>
          )}
          {(location || website) && (
            <div className="profile-preview-meta">
              {location && <span>{location}</span>}
              {website && <span>{website.replace(/^https?:\/\//, '')}</span>}
            </div>
          )}
          <p className="profile-preview-bio">
            {bio || 'Your bio will show up here, on your public profile and portfolio page.'}
          </p>
          {skills.length > 0 && (
            <div className="skill-chip-row skill-chip-row-center">
              {skills.slice(0, 6).map((skill) => (
                <span key={skill} className="skill-chip">{skill}</span>
              ))}
            </div>
          )}
        </div>
        <Link to={`/authors/${user.id}`} className="text-link profile-preview-link">
          View your public profile
        </Link>
      </aside>
    </div>
  );
}

const EXPERIENCE_BLANK = { role: '', company: '', period: '', details: '' };

function ExperienceTab() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(EXPERIENCE_BLANK);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setStatus('loading');
    apiClient
      .get('/experience/mine')
      .then((res) => {
        setItems(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      role: item.role,
      company: item.company,
      period: item.period ?? '',
      details: item.details ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EXPERIENCE_BLANK);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, period: form.period || null, details: form.details || null };
      if (editingId) {
        await apiClient.put(`/experience/${editingId}`, payload);
      } else {
        await apiClient.post('/experience', payload);
      }
      cancelEdit();
      load();
    } catch {
      // leave form as-is so the person can retry
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remove "${item.role} @ ${item.company}"?`)) return;
    await apiClient.delete(`/experience/${item.id}`);
    load();
  }

  return (
    <div>
      <h2>Experience</h2>
      <p className="post-meta">Your career timeline, shown on your public profile.</p>

      <form onSubmit={handleSubmit} className="settings-form" style={{ maxWidth: 480 }}>
        <h3>{editingId ? 'Edit role' : 'Add a role'}</h3>

        <label htmlFor="exp-role">Role title</label>
        <input
          id="exp-role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
        />

        <label htmlFor="exp-company">Company / organization</label>
        <input
          id="exp-company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          required
        />

        <label htmlFor="exp-period">Period</label>
        <input
          id="exp-period"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value })}
          placeholder="e.g. 2023 - Present"
        />

        <label htmlFor="exp-details">Details</label>
        <textarea
          id="exp-details"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          rows={3}
        />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={submitting}>
            {editingId ? 'Save changes' : 'Add role'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="link-button">Cancel</button>
          )}
        </div>
      </form>

      <h3>Your timeline</h3>
      {status === 'loading' && <p>Loading…</p>}
      {status === 'ready' && items.length === 0 && <p>Nothing added yet.</p>}

      <ul className="moderation-list">
        {items.map((item) => (
          <li key={item.id} className="moderation-item">
            <strong>{item.role} @ {item.company}</strong>{' '}
            {item.period && <span className="post-meta">({item.period})</span>}
            <div className="moderation-actions">
              <button onClick={() => startEdit(item)}>Edit</button>
              <button onClick={() => handleDelete(item)} className="reject-button">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
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
