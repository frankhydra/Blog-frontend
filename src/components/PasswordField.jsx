import { useState } from 'react';
import { LockIcon, EyeIcon, EyeOffIcon } from './AuthIcons';

// Password input with a leading lock icon and a show/hide toggle - shared
// by Login.jsx and Register.jsx so both stay visually identical.
export default function PasswordField({ id, label, value, onChange, autoComplete, minLength, required }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <LockIcon className="auth-input-icon" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className="auth-input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
