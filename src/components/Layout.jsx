import { useEffect, useRef, useState } from 'react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChrome } from '../context/ChromeContext';
import Loading from './Loading';

const ICON_MENU = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ICON_CLOSE = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Sun icon, same shape as the original light/dark toggle before six
// themes replaced the binary - kept as the trigger for the theme picker,
// tinted to the active theme's own accent color (see the button below)
// so it still gives a visual cue about which theme is active, not just
// "click here to change it."
const ICON_SUN = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const { hideHeader, hideFooter } = useChrome();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);
  const activeTheme = themes.find((t) => t.key === theme) || themes[0];

  // Mobile nav - below 640px the primary nav + account menu disappear from
  // the header bar entirely (see the @media rule in index.css) and this
  // hamburger toggle takes their place. Kept as one flat panel (nav links
  // + account actions together) rather than nesting a dropdown inside a
  // dropdown, since that's awkward on a touchscreen.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);

  // The backend serves /sitemap.xml at its own root (not under /api) - derive
  // that from the same VITE_API_URL the api client already uses, rather than
  // hardcoding a second URL that could drift out of sync with it.
  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const sitemapUrl = `${apiBase.replace(/\/api\/?$/, '')}/sitemap.xml`;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Close the account dropdown / mobile panel on outside click, so they
  // behave like real menus rather than staying stuck open. Escape closes
  // both too.
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setThemeMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    function handleKeydown(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setThemeMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="site">
      {!hideHeader && (
      <div className="band header-band">
        <div className="inner">
          <header className="site-header">
            <Link to="/" className="brand" onClick={closeMobileMenu}>Nchukwi</Link>

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
                        {user.role === 'author' && (
                          <Link to="/author/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                        )}
                        {user.role === 'contributor' && (
                          <Link to="/contributor/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                        )}
                        {/* Both Contributor's and Author's dashboards have these as
                            tabs (Overview/My posts/My letters [author-only]/My books/
                            Spotlight requests/Subscribers/Messages), and it turns out
                            admin's dashboard already covers the same ground too, just
                            through different UI: AdminDashboard.jsx's Overview tab links
                            straight to /my-posts ("See all your posts") and
                            /my/contact-messages ("Unread messages"), and its Subscribers
                            tab's "By author" table includes admin's own row with its own
                            Download CSV button - the platform-wide oversight view (Q8)
                            and admin's own personal count aren't actually two separate
                            things in that tab. So these three are dropped from the
                            dropdown for every role now, not just author/contributor.
                            Request a campaign is dropped entirely too: author/contributor
                            reach it via their dashboard's Spotlight requests tab, and
                            admin is blocked from requesting one at all
                            (CampaignController::store()). */}
                        <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
                        {user.role === 'admin' && (
                          <>
                            <div className="dropdown-divider" />
                            <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>Admin dashboard</Link>
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

            {/* Always visible regardless of screen width - unlike the rest
                of .header-actions, this shouldn't disappear into the
                hamburger menu just because it's a small button, since a
                theme picker is the kind of thing people expect to reach
                in one tap. Same dropdown pattern as .account-menu above:
                a trigger button plus an absolutely-positioned panel,
                closed on outside click/Escape. */}
            <div className="theme-menu" ref={themeMenuRef}>
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setThemeMenuOpen((open) => !open)}
                aria-expanded={themeMenuOpen}
                aria-label={`Change theme (current: ${activeTheme.label})`}
                title={`Change theme (current: ${activeTheme.label})`}
                style={{ color: activeTheme.swatch[1] }}
              >
                {ICON_SUN}
              </button>

              {themeMenuOpen && (
                <div className="theme-dropdown" role="menu">
                  <p className="dropdown-label">Theme</p>
                  {themes.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={t.key === theme}
                      className={`theme-option${t.key === theme ? ' theme-option-active' : ''}`}
                      onClick={() => {
                        setTheme(t.key);
                        setThemeMenuOpen(false);
                      }}
                    >
                      <span
                        className="theme-swatch"
                        style={{ background: t.swatch[0], borderColor: t.swatch[1] }}
                        aria-hidden="true"
                      >
                        <span className="theme-swatch-dot" style={{ background: t.swatch[1] }} />
                      </span>
                      {t.label}
                      {t.key === theme && <span className="theme-option-check" aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hamburger toggle - CSS hides this above 640px, so it never
                shows up alongside the desktop nav. */}
            <button
              type="button"
              ref={mobileToggleRef}
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-panel"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? ICON_CLOSE : ICON_MENU}
            </button>
          </header>

          {mobileMenuOpen && (
            <div id="mobile-menu-panel" className="mobile-menu-panel" ref={mobileMenuRef}>
              <nav className="mobile-menu-nav">
                <NavLink to="/" end onClick={closeMobileMenu}>Home</NavLink>
                <NavLink to="/community" onClick={closeMobileMenu}>Community Blogs</NavLink>
                <NavLink to="/letters" onClick={closeMobileMenu}>Letters</NavLink>
                <NavLink to="/books" onClick={closeMobileMenu}>Books</NavLink>
                <NavLink to="/portfolio" onClick={closeMobileMenu}>Portfolio</NavLink>
                <NavLink to="/about" onClick={closeMobileMenu}>About</NavLink>
              </nav>

              <div className="mobile-menu-divider" />

              {user ? (
                <div className="mobile-menu-account">
                  <div className="mobile-menu-user-row">
                    <span className="account-avatar">{user.name.charAt(0).toUpperCase()}</span>
                    <span className="account-name">{user.name}</span>
                  </div>
                  <Link to="/write" onClick={closeMobileMenu}>Write</Link>
                  {user.role === 'author' && (
                    <Link to="/author/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
                  )}
                  {user.role === 'contributor' && (
                    <Link to="/contributor/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
                  )}
                  <Link to="/settings" onClick={closeMobileMenu}>Settings</Link>
                  {user.role === 'admin' && (
                    <>
                      <div className="mobile-menu-divider" />
                      <Link to="/admin/dashboard" onClick={closeMobileMenu}>Admin dashboard</Link>
                    </>
                  )}
                  <div className="mobile-menu-divider" />
                  <button type="button" onClick={handleLogout}>Log out</button>
                </div>
              ) : (
                <div className="mobile-menu-account">
                  <Link to="/login" onClick={closeMobileMenu}>Log in</Link>
                  <Link to="/register" onClick={closeMobileMenu}>Claim your page</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      <div className="band main-band">
        <main className="inner site-main">
          {/* Outlet renders whichever page React Router has matched.
              Wrapped in Suspense since every page is now lazy-loaded
              (see App.jsx) - this shows a loading state in just the
              content area while a route's chunk is being fetched,
              without the header/footer themselves unmounting. */}
          <Suspense fallback={<Loading fullPage />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {!hideFooter && (
        <div className="band footer-band">
          <div className="inner">
            <footer className="site-footer">
              <div className="footer-grid">
                <div className="footer-brand">
                  <Link to="/" className="footer-brand-name">Nchukwi</Link>
                  <p className="footer-tagline">Own your name. Own your work. Own what it earns you.</p>
                </div>

                <div className="footer-col">
                  <p className="footer-col-title">Explore</p>
                  <NavLink to="/" end>Home</NavLink>
                  <NavLink to="/community">Community Blogs</NavLink>
                  <NavLink to="/letters">Letters</NavLink>
                  <NavLink to="/books">Books</NavLink>
                  <NavLink to="/portfolio">Portfolio</NavLink>
                  <NavLink to="/about">About</NavLink>
                  <NavLink to="/join">Join the list</NavLink>
                  <NavLink to="/how-money-moves">How money moves</NavLink>
                </div>

                <div className="footer-col">
                  <p className="footer-col-title">Account</p>
                  {user ? (
                    <>
                      {/* 2.4a - same duplication 2.4 fixed in the dropdown, found
                          here too after that fix shipped. My posts/Request a
                          campaign are dropped the same way (My posts kept for
                          admin only, Request a campaign dropped for everyone -
                          see the dropdown's own comment above for why). Also
                          adding a Dashboard link, which the footer never had at
                          all - without it, an author/contributor logged-in
                          footer would otherwise only offer Write and Settings,
                          no path back to their own dashboard. */}
                      {user.role === 'author' && (
                        <Link to="/author/dashboard">Dashboard</Link>
                      )}
                      {user.role === 'contributor' && (
                        <Link to="/contributor/dashboard">Dashboard</Link>
                      )}
                      <Link to="/write">Write</Link>
                      <Link to="/settings">Settings</Link>
                      {user.role === 'admin' && (
                        <Link to="/admin/dashboard">Admin dashboard</Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link to="/login">Log in</Link>
                      <Link to="/register">Claim your page</Link>
                    </>
                  )}
                </div>
              </div>

              <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Nchukwi</p>
                <div className="footer-bottom-links">
                  <a href={sitemapUrl} target="_blank" rel="noreferrer">Sitemap</a>
                  <button type="button" onClick={scrollToTop} className="back-to-top">Back to top ↑</button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
