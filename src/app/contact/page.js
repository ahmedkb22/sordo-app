'use client'
import Link from 'next/link'
import './contact.css'

export default function Contact() {
  const socials = [
    {
      name: "Instagram",
      handle: "@sordo.app",
      href: "https://instagram.com/sordo.app",
      color: "#e1306c",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      handle: "SORDO",
      href: "https://facebook.com/sordo",
      color: "#1877f2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      name: "Twitter / X",
      handle: "@sordo_app",
      href: "https://x.com/sordo_app",
      color: "#1da1f2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      handle: "SORDO",
      href: "https://linkedin.com/company/sordo",
      color: "#0a66c2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M7 10V17M7 7V7.01M12 17V13C12 11.9 12.9 11 14 11C15.1 11 16 11.9 16 13V17M12 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      name: "Email",
      handle: "contact@sordo.app",
      href: "mailto:contact@sordo.app",
      color: "#3b82f6",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M2 8L12 13L22 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <main className="contact-main">

      {/* ── Hero ── */}
      <section className="contact-hero">
        <span className="contact-badge">Rejoignez-nous</span>
        <h1 className="contact-title">Contactez-nous</h1>
        <p className="contact-desc">
          Une question ? Une idée ? On adore entendre les gens.
          Suivez-nous sur nos réseaux ou envoyez-nous un email directement.
        </p>
      </section>

      {/* ── Socials Grid ── */}
      <section className="socials-section">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card"
          >
            <div
              className="social-icon-wrap"
              style={{
                background: `${s.color}18`,
                border: `1px solid ${s.color}40`,
                color: s.color,
              }}
            >
              {s.icon}
            </div>

            <div className="social-info">
              <p className="social-name">{s.name}</p>
              <p className="social-handle">{s.handle}</p>
            </div>

            <svg
              className="social-arrow"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path d="M3 8H13M9 4L13 8L9 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ))}
      </section>

    </main>
  )
}