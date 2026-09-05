export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a className="navbar-logo" href="/">
          <span className="navbar-logo-mark">S</span>
          SafeSync
        </a>

        <nav className="navbar-links">
          <a className="navbar-link" href="#features">
            Features
          </a>
          <a className="navbar-link" href="#">
            Pricing
          </a>
          <a className="navbar-link" href="#">
            Docs
          </a>
        </nav>

        <div className="navbar-icon-circle" aria-label="Account">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="5.5"
              r="2.5"
              stroke="#191a1b"
              strokeWidth="1.3"
            />
            <path
              d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4"
              stroke="#191a1b"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}
