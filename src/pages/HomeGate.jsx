import { useState } from 'react';
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
// form (in "asGate" mode) to a visitor until they actually subscribe -
// unlike an ordinary "seen once" splash, refreshing or reopening the
// domain WITHOUT submitting still shows the gate again, since nothing is
// written to localStorage until a real subscribe succeeds. Only a
// successful submit ever marks this device as done, which is also the
// only thing that can get a visitor past it - there's no skip link. A
// logged-in visitor always skips straight to Home regardless: asking
// someone who already has an account to join a mailing list on their way
// to a page they already use doesn't make sense.
export default function HomeGate() {
  const { user, loading: authLoading } = useAuth();

  // Read once, via a lazy useState initializer, NOT inside a useEffect -
  // this only matters for reading now (nothing here writes on mount
  // anymore), but there's no reason to move it into an effect just
  // because the original reason for the lazy-initializer trick (avoiding
  // a StrictMode double-invoke reading back its own write) doesn't apply
  // to a read-only check.
  const [wasAlreadySeen] = useState(readSeenFlag);
  // Separate, in-memory-only flag so a successful subscribe can flip
  // straight to Home in the same render, without waiting on a reload to
  // notice the localStorage write below.
  const [dismissed, setDismissed] = useState(false);

  function handleSubscribed() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Storage unavailable - this device will see the gate again next
      // time despite having just subscribed. Not ideal, but the
      // subscription itself still succeeded and was recorded server-side
      // regardless, so nothing is actually lost.
    }
    setDismissed(true);
  }

  if (authLoading) return <Loading fullPage />;
  if (user || wasAlreadySeen || dismissed) return <Home />;

  return <Join asGate onContinue={handleSubscribed} />;
}
