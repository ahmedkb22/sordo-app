'use client'
import Link from 'next/link'
import './footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" />

      <div className="footer-inner">
        {/* ── Top grid ── */}
        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">SORDO</div>
            <p className="footer-tagline">
              Real-time ASL sign language detection, making communication accessible for everyone.
            </p>
            <div className="footer-status">
              <span className="footer-status-dot" />
              All systems operational
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="footer-col-title">Navigation</p>
            <ul className="footer-links">
              <li>
                <Link href="/about">
                  <span>About Us</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span>Contact Us</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <span>FAQ</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <span>Dashboard</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="footer-col-title">Resources</p>
            <ul className="footer-links">
              <li>
                <Link href="/entrainement">
                  <span>Training</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
              <li>
                <Link href="/friends">
                  <span>Community</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
              <li>
                <Link href="/signup">
                  <span>Get Started</span>
                  <span className="footer-link-arrow">→</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 <span>SORDO</span>. All rights reserved.
          </p>

          <div className="footer-powered">
            <span className="footer-powered-label">Powered by</span>
            <div className="footer-authors">
              <span className="footer-author-chip">Kebir Ahmed</span>
              <span className="footer-authors-sep">&</span>
              <span className="footer-author-chip">Bendella Abdessamed</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}