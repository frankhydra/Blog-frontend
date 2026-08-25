import { useEffect, useState } from 'react';

function getTimeParts(targetDate) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// A small set of ticking boxes counting down to a campaign's launch date.
// `compact` renders a single inline chip instead (used on card previews);
// the full box layout is for the detail page and the all-campaigns grid.
export default function CountdownTimer({ launchDate, compact = false }) {
  // launch_date comes back from Laravel as a full ISO datetime string (e.g.
  // "2026-08-24T00:00:00.000000Z"), not a plain "2026-08-24". Grabbing just
  // the first 10 characters keeps this working whether the API sends that
  // full timestamp or a plain date string.
  const target = launchDate ? new Date(`${launchDate.slice(0, 10)}T00:00:00`) : null;
  const [parts, setParts] = useState(() => (target ? getTimeParts(target) : null));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setParts(getTimeParts(target)), 1000);
    return () => clearInterval(id);
  }, [launchDate]);

  if (!target) {
    return <span className="countdown-chip countdown-chip-muted">Date to be announced</span>;
  }

  if (!parts) {
    return <span className="countdown-chip countdown-chip-live">It's here</span>;
  }

  if (compact) {
    return (
      <span className="countdown-chip">
        {parts.days > 0 ? `${parts.days}d ${parts.hours}h left` : `${parts.hours}h ${parts.minutes}m left`}
      </span>
    );
  }

  return (
    <div className="countdown-boxes">
      <div className="countdown-box"><span className="countdown-num">{parts.days}</span><span className="countdown-label">Days</span></div>
      <div className="countdown-box"><span className="countdown-num">{parts.hours}</span><span className="countdown-label">Hours</span></div>
      <div className="countdown-box"><span className="countdown-num">{parts.minutes}</span><span className="countdown-label">Min</span></div>
      <div className="countdown-box"><span className="countdown-num">{parts.seconds}</span><span className="countdown-label">Sec</span></div>
    </div>
  );
}
