// Small inline icon set for the auth forms - kept as plain SVG rather than
// pulling in an icon library dependency for five glyphs. currentColor lets
// them inherit color from CSS (muted by default, ink on focus) like the
// rest of the site's UI chrome does.
export function MailIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
      <path d="M3 5.5l7 5.5 7-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="4" y="9" width="12" height="8" rx="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3.5 17c0-3.3 3-5.5 6.5-5.5s6.5 2.2 6.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}

export function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M2.5 2.5l15 15" strokeLinecap="round" />
      <path
        d="M8.3 4.3A8.8 8.8 0 0 1 10 4c5.5 0 8.5 6 8.5 6a13.5 13.5 0 0 1-2.9 3.7M5.4 5.6C3 7.2 1.5 10 1.5 10s3 6 8.5 6c1 0 1.9-.15 2.75-.42M11.6 11.6a2.25 2.25 0 0 1-3.2-3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
