import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand-mark">
            <span className="dot" />
            <span className="footer-brand-name">SafeSync</span>
          </div>
          <p className="footer-tagline">
            One record for every flat, resident, and role in your society.
          </p>
        </div>

        <div className="footer-col">
          <h4>Product</h4>
          <Link to="/#features">Features</Link>
          <a href="#">Pricing</a>
          <a href="#">Docs</a>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <a href="#">Contact</a>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>

      <div className="footer-bottom container">
        © {new Date().getFullYear()} SafeSync. All rights reserved.
      </div>
    </footer>
  );
}
