import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
              <NavLink to="/" end>Blog</NavLink>
              <NavLink to="/community">Community</NavLink>
              <NavLink to="/letters">Letters</NavLink>
              <NavLink to="/books">Books</NavLink>
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
                        <Link to="/edit-profile" onClick={() => setMenuOpen(false)}>Edit profile</Link>
                        {user.role === 'admin' && (
                          <>
                            <div className="dropdown-divider" />
                            <p className="dropdown-label">Admin</p>
                            <Link to="/admin/comments" onClick={() => setMenuOpen(false)}>Moderate comments</Link>
                            <Link to="/admin/users" onClick={() => setMenuOpen(false)}>Manage authors</Link>
                            <Link to="/admin/portfolio" onClick={() => setMenuOpen(false)}>Manage portfolio</Link>
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
            <p>&copy; {new Date().getFullYear()} Franklin Nchukwi</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
