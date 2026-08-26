import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // The backend serves /sitemap.xml at its own root (not under /api) - derive
  // that from the same VITE_API_URL the api client already uses, rather than
  // hardcoding a second URL that could drift out of sync with it.
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const sitemapUrl = `${apiBase.replace(/\/api\/?$/, '')}/sitemap.xml`;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Close the account dropdown on outside click, so it behaves like a
  // real menu rather than staying stuck open.
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  return (
    <div className="site">
      <div className="band header-band">
        <div className="inner">
          <header className="site-header">
            <Link to="/" className="brand">Franklin Nchukwi</Link>

            <nav className="primary-nav">
              <NavLink to="/" end>Home</NavLink>
              <NavLink to="/community">Community Blogs</NavLink>
              <NavLink to="/letters">Letters</NavLink>
              <NavLink to="/books">Books</NavLink>
              <NavLink to="/portfolio">Portfolio</NavLink>
              <NavLink to="/about">About</NavLink>
            </nav>

            <div className="header-actions">
              {user ? (
                <>
                  <Link to="/write" className="nav-cta">Write</Link>
                  <div className="account-menu" ref={menuRef}>
                    <button
                      className="account-trigger"
                      onClick={() => setMenuOpen((open) => !open)}
                      aria-expanded={menuOpen}
                    >
                      <span className="account-avatar">{user.name.charAt(0).toUpperCase()}</span>
                      <span className="account-name">{user.name}</span>
                      <span className="account-chevron">{menuOpen ? '▴' : '▾'}</span>
                    </button>

                    {menuOpen && (
                      <div className="account-dropdown">
                        <Link to="/my-posts" onClick={() => setMenuOpen(false)}>My posts</Link>
                        <Link to="/request-campaign" onClick={() => setMenuOpen(false)}>Request a campaign</Link>
                        <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
                        {['admin', 'author'].includes(user.role) && (
                          <Link to="/write/letter" onClick={() => setMenuOpen(false)}>Write a letter</Link>
                        )}
                        {user.role === 'admin' && (
                          <>
                            <div className="dropdown-divider" />
                            <p className="dropdown-label">Admin</p>
                            <Link to="/admin/comments" onClick={() => setMenuOpen(false)}>Moderate comments</Link>
                            <Link to="/admin/campaigns" onClick={() => setMenuOpen(false)}>Moderate campaigns</Link>
                            <Link to="/admin/users" onClick={() => setMenuOpen(false)}>Manage authors</Link>
                          </>
                        )}
                        <div className="dropdown-divider" />
                        <button onClick={handleLogout}>Log out</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/login" className="nav-cta">Log in</Link>
              )}
            </div>
          </header>
        </div>
      </div>

      <div className="band main-band">
        <main className="inner site-main">
          {/* Outlet renders whichever page React Router has matched */}
          <Outlet />
        </main>
      </div>

      <div className="band footer-band">
        <div className="inner">
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-brand">
                <Link to="/" className="footer-brand-name">Franklin Nchukwi</Link>
                <p className="footer-tagline">Writing on code, craft, and the occasional letter.</p>
              </div>

              <div className="footer-col">
                <p className="footer-col-title">Explore</p>
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/community">Community Blogs</NavLink>
                <NavLink to="/letters">Letters</NavLink>
                <NavLink to="/books">Books</NavLink>
                <NavLink to="/portfolio">Portfolio</NavLink>
                <NavLink to="/about">About</NavLink>
              </div>

              <div className="footer-col">
                <p className="footer-col-title">Account</p>
                {user ? (
                  <>
                    <Link to="/write">Write a post</Link>
                    {['admin', 'author'].includes(user.role) && <Link to="/write/letter">Write a letter</Link>}
                    <Link to="/my-posts">My posts</Link>
                    <Link to="/request-campaign">Request a campaign</Link>
                    <Link to="/settings">Settings</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login">Log in</Link>
                    <Link to="/register">Create an account</Link>
                  </>
                )}
              </div>
            </div>

            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} Franklin Nchukwi</p>
              <div className="footer-bottom-links">
                <a href={sitemapUrl} target="_blank" rel="noreferrer">Sitemap</a>
                <button type="button" onClick={scrollToTop} className="back-to-top">Back to top ↑</button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
