import { useState } from 'react';

// The "living" visual on the welcome gate (see Join.jsx's asGate mode) -
// two slowly counter-rotating rings around a pulsing core, in the site's
// existing wax/ochre/accent palette rather than new colors borrowed from
// the reference design. Pure CSS/SVG, no animation library - nothing
// else in this app needed one, so this stays consistent with that rather
// than pulling in something like Three.js for a single component.
export default function WelcomeEmblem() {
  const [rippling, setRippling] = useState(false);

  function handleClick() {
    setRippling(true);
    setTimeout(() => setRippling(false), 700);
  }

  return (
    <div className="gate-emblem-wrap" onClick={handleClick} role="presentation">
      <div className="gate-emblem-glow" />
      {rippling && <span className="gate-ripple gate-ripple-active" />}
      <svg viewBox="0 0 120 120" className="gate-emblem-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="gate-ring-outer"
          cx="60"
          cy="60"
          r="46"
          strokeWidth="3"
          strokeDasharray="130 40"
          strokeLinecap="round"
        />
        <circle
          className="gate-ring-inner"
          cx="60"
          cy="60"
          r="34"
          strokeWidth="1.5"
          strokeDasharray="40 30"
          opacity="0.6"
        />
        <circle className="gate-emblem-core" cx="60" cy="60" r="20" />
      </svg>
    </div>
  );
}
