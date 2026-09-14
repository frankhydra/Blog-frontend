import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import Home from './Home';
import Join from './Join';

const SEEN_KEY = 'has_seen_welcome_gate';

function readSeenFlag() {
  try {
    // Any stored value at all means this device is done with the gate -
    // '1' is the old value written by subscribing before "skip" existed,
    // 'subscribed'/'skipped' are the current ones. Treating any of them
    // as "seen" means visitors who already got past the gate under the
    // old subscribe-only version never see it pop back up after this
    // update ships.
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true; // storage unavailable - default to not gating
  }
}

// Sits at the root route ("/") in place of Home directly. Shows the Join
// form (in "asGate" mode) to a first-time visitor. Either subscribing or
// tapping "not right now" (join-skip-link, see Join.jsx) marks this
// device as done via SEEN_KEY, so - like an ordinary "seen once" splash -
// it only ever shows once per device, not on every visit. The two
// outcomes are stored as different values purely so that's visible later
// if it's ever worth knowing (e.g. in analytics) how many people
// subscribed vs skipped; both are treated identically as "seen" by
// readSeenFlag below. A logged-in visitor always skips straight to Home
// regardless: asking someone who already has an account to join a
// mailing list on their way to a page they already use doesn't make
// sense.
export default function HomeGate() {
  const { user, loading: authLoading } = useAuth();

  // Read once, via a lazy useState initializer, NOT inside a useEffect -
  // this only matters for reading now (nothing here writes on mount
  // anymore), but there's no reason to move it into an effect just
  // because the original reason for the lazy-initializer trick (avoiding
  // a StrictMode double-invoke reading back its own write) doesn't apply
  // to a read-only check.
  const [wasAlreadySeen] = useState(readSeenFlag);
  // Separate, in-memory-only flag so a successful subscribe/skip can flip
  // straight to Home in the same render, without waiting on a reload to
  // notice the localStorage write below.
  const [dismissed, setDismissed] = useState(false);

  function markSeen(value) {
    try {
      localStorage.setItem(SEEN_KEY, value);
    } catch {
      // Storage unavailable - this device will see the gate again next
      // time regardless of which path they took. Not ideal, but a real
      // subscribe still succeeded and was recorded server-side either
      // way, so nothing about the subscription itself is lost - only the
      // "don't show this again" memory.
    }
    setDismissed(true);
  }

  function handleSubscribed() {
    markSeen('subscribed');
  }

  function handleSkip() {
    markSeen('skipped');
  }

  if (authLoading) return <Loading fullPage />;
  if (user || wasAlreadySeen || dismissed) return <Home />;

  return <Join asGate onContinue={handleSubscribed} onSkip={handleSkip} />;
}
