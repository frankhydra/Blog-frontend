import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import Home from './Home';
import Join from './Join';

const SEEN_KEY = 'has_seen_welcome_gate';

function readSeenFlag() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // storage unavailable - default to not gating
  }
}

// Sits at the root route ("/") in place of Home directly. Shows the Join
// form (in "asGate" mode) to a visitor's very first look at the domain,
// then Home from then on regardless of whether they actually subscribed -
// this is a one-time welcome, not a hard paywall-style gate someone could
// get stuck behind. A logged-in visitor always skips straight to Home:
// asking someone who already has an account to join a mailing list on
// their way to a page they already use doesn't make sense.
export default function HomeGate() {
  const { user, loading: authLoading } = useAuth();

  // Read once, via a lazy useState initializer, NOT inside a useEffect.
  // React 18 StrictMode (dev only) deliberately invokes effects twice to
  // surface exactly this kind of bug: an effect that both reads AND
  // writes the same key would see its own first write on the second
  // invocation and flip straight back to "already seen" before the
  // visitor ever saw the gate. A lazy initializer runs before any effect
  // does, so it always sees the pre-write value, however many times
  // React happens to invoke it.
  const [wasAlreadySeen] = useState(readSeenFlag);
  // Separate, in-memory-only flag for "finished the gate this load" -
  // deliberately not tied to localStorage at all, so it can't be caught
  // in the same race.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (wasAlreadySeen) return;
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Worst case this visitor sees the gate again next time - a minor
      // inconvenience, not a bug.
    }
  }, [wasAlreadySeen]);

  if (authLoading) return <Loading fullPage />;
  if (user || wasAlreadySeen || dismissed) return <Home />;

  return <Join asGate onContinue={() => setDismissed(true)} />;
}
