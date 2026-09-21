import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

// TODO(R.1): 10% platform fee and $15/week Spotlight price are PLACEHOLDERS
// from NCHUKWI-REBRAND-GUIDE.md Section 7. Swap both for real, confirmed
// numbers before this page is considered final - see R.1 in
// NCHUKWI-REBRAND-AND-PAYMENTS-CHECKLIST.md. Also see that checklist's
// T.4: don't add Mobile Money / PAYG / subscription-tier language here
// until Phase 6 (payments) actually ships - this page should only ever
// describe what's actually live today.
const PLATFORM_FEE_PERCENT = '10%'; // TODO: confirm real number (R.1)
const SPOTLIGHT_PRICE = '$15/week'; // TODO: confirm real number (R.1)

// Q2 (Issues Log 2.14) - restricted to logged-in users, confirmed Sep 20.
// This is a deliberate reversal of the original design: NCHUKWI-REBRAND-
// GUIDE.md Section 7 built this page to be "shown to logged-in users and
// visitors alike," on the theory that public transparency about money IS
// part of the persuasion for a visitor deciding whether to sign up. That
// reasoning still exists in the doc - flagging it here in case it matters
// again later - but Kali's explicit call overrides it, so the page now
// gates the same way every other member-only page in this app does
// (MyLetters.jsx, MyPosts.jsx, etc.): plain empty-state check, not a
// router-level guard, to stay consistent with the rest of the codebase.
export default function HowMoneyMoves() {
  const { user, loading: authLoading } = useAuth();

  usePageMeta(
    'How money moves on Nchukwi',
    'How Nchukwi makes money, and how you do too - no fine print, no hidden cuts.'
  );

  if (authLoading) return <Loading fullPage />;

  if (!user) {
    return (
      <div className="about-page">
        <p className="kicker">Transparency</p>
        <h1>How money moves on Nchukwi</h1>
        <p className="empty-state">
          This page is for members only. <Link to="/login">Log in</Link> or{' '}
          <Link to="/register">claim your page</Link> to see it.
        </p>
      </div>
    );
  }

  return (
    <div className="about-page">
      <p className="kicker">Transparency</p>
      <h1>How money moves on Nchukwi</h1>

      <p>
        We think a platform should be honest about how it makes money — and
        how you do too. No fine print, no hidden cuts.
      </p>

      <h2>For creators</h2>
      <p>
        Sell your book directly from your page. Nchukwi takes a{' '}
        <strong>{PLATFORM_FEE_PERCENT} platform fee</strong> on sales made
        through Nchukwi — the rest is yours.
      </p>
      <p>
        Building your list is free. Sending real confirmation/unsubscribe
        emails is coming soon (currently instant-confirm, no email required).
      </p>
      <p>
        Want to be featured? <strong>Spotlight placement is {SPOTLIGHT_PRICE}</strong>{' '}
        and puts your launch on the homepage, where people are already
        looking.
      </p>

      <h2>For Nchukwi</h2>
      <p>
        We earn from Spotlight placements and a share of book sales made
        through the platform. That's it — no ads, no selling your data, no
        hidden fees.
      </p>

      <h2>For readers and visitors</h2>
      <p>
        Reading, subscribing, and following creators is always free. If you
        ever buy a book or support a creator, you'll always know exactly
        where the money goes.
      </p>
    </div>
  );
}
