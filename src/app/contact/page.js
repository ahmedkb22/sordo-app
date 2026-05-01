'use client'
import { useState } from 'react'
import './contact.css'
import Footer from '../../components/footer'
import { db } from '../../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function Contact() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    description: '',
  })
  const [status, setStatus] = useState(null)

  const socials = [
    {
      name: "Instagram",
      handle: "@sordo.app",
      href: "https://www.instagram.com/ahmed_kebirr/",
      color: "#e1306c",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      handle: "SORDO",
      href: "https://www.facebook.com/ahmd.kbyr.744592",
      color: "#1877f2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 4L20 20M4 20L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      handle: "SORDO",
      href: "https://www.linkedin.com/in/ahmed-kebir-8b7552226/",
      color: "#0a66c2",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M7 10V17M7 7V7.01M12 17V13C12 11.9 12.9 11 14 11C15.1 11 16 11.9 16 13V17M12 10V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      name: "Email",
      handle: "ahmedkbd2004@gmail.com",
      href: "mailto:ahmedkbd2004@gmail.com",
      color: "#3b82f6",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M2 8L12 13L22 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await addDoc(collection(db, 'contact_submissions'), {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        description: form.description,
        createdAt: serverTimestamp(),
        status: 'unread',
      })
      setStatus('success')
      setForm({ fullName: '', email: '', phone: '', description: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <main className="contact-main">

      <section className="contact-hero">
        <span className="contact-badge">Rejoignez-nous</span>
        <h1 className="contact-title">Contactez-nous</h1>
        <p className="contact-desc">
          Une question ? Une idée ? On adore entendre les gens.
          Suivez-nous sur nos réseaux ou envoyez-nous un email directement.
        </p>
      </section>

      <section className="contact-form-section">
        <div className="contact-form-header">
          <h2 className="contact-form-title">Send us a message</h2>
          <p className="contact-form-subtitle">We'll get back to you as soon as possible.</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span className="form-required">*</span></label>
              <input
                className="form-input"
                type="text"
                name="fullName"
                placeholder="Ahmed Kebir"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="form-required">*</span></label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone Number <span className="form-optional">optional</span>
            </label>
            <input
              className="form-input"
              type="tel"
              name="phone"
              placeholder="+213 XXX XXX XXX"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message <span className="form-required">*</span></label>
            <textarea
              className="form-input form-textarea"
              name="description"
              placeholder="Tell us what's on your mind..."
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
            />
          </div>

          {status === 'success' && (
            <div className="form-alert form-alert-success">
              ✅ Message sent! We'll get back to you soon.
            </div>
          )}
          {status === 'error' && (
            <div className="form-alert form-alert-error">
              ❌ Something went wrong. Please try again.
            </div>
          )}

          <button type="submit" className="form-submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Send Message →'}
          </button>
        </form>
      </section>

      <section className="socials-section">
        {socials.map((s) => (
          <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="social-card">
            <div className="social-icon-wrap" style={{ background: `${s.color}18`, border: `1px solid ${s.color}40`, color: s.color }}>
              {s.icon}
            </div>
            <div className="social-info">
              <p className="social-name">{s.name}</p>
              <p className="social-handle">{s.handle}</p>
            </div>
            <svg className="social-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M9 4L13 8L9 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ))}
      </section>

      <Footer />
    </main>
  )
}