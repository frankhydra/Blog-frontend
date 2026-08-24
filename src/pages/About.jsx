import { Link } from 'react-router-dom';
import usePageMeta from '../hooks/usePageMeta';

// This page is intentionally static - it explains what the site is and why
// it exists, not any one person's profile. Individual profiles and
// portfolios live on the Portfolio tab instead. If this copy needs to
// become editable from the admin panel later, this is the file to wire up
// to a site-content endpoint.
export default function About() {
  usePageMeta('About', 'What this site is, who it is for, and why it exists.');

  return (
    <div className="about-page">
      <p className="kicker">About this site</p>
      <h1>A place to write, in public</h1>

      <p>
        This started as one person's personal blog — a spot to write about
        code, craft, and the occasional letter. It has since grown into
        something a little bigger: a small platform where other writers
        can publish their own posts and letters too, alongside their own
        portfolio of work.
      </p>

      <p>
        The idea is simple. Long-form writing shouldn't need a big
        audience to be worth doing, and the internet is better with more
        people publishing their own thinking instead of just reacting to
        everyone else's. So this site keeps a few things intentionally
        old-fashioned: posts are dated like postmarks, letters read like
        letters, and every writer here has a real profile behind their
        name, not just a byline.
      </p>

      <h2>Who writes here</h2>
      <p>
        Anyone can create an account. <strong>Authors</strong> can publish
        both blog posts and letters and appear in the public directory.{' '}
        <strong>Contributors</strong> can publish blog posts, and can be
        promoted to author once they're ready to publish more widely. The
        site admin reviews and manages both.
      </p>

      <p className="post-meta">
        Curious who's actually behind the writing?{' '}
        <Link to="/portfolio">See the Portfolio directory &rarr;</Link>
      </p>
    </div>
  );
}
