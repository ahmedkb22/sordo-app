'use client'
import Link from 'next/link'

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
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #050a1e 0%, #0a1635 60%, #0d1f4a 100%)",
        color: "white",
        paddingTop: "68px",
      }}
    >
      <section
        style={{
          padding: "5rem 1.5rem 2rem",
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "999px",
            padding: "0.35rem 1rem",
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "#93c5fd",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          Rejoignez-nous
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #fff 0%, #93c5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "1rem",
          }}
        >
          Contactez-nous
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.45)",
            lineHeight: "1.8",
            marginBottom: "3rem",
          }}
        >
          Une question ? Une idée ? On adore entendre les gens.
          Suivez-nous sur nos réseaux ou envoyez-nous un email directement.
        </p>
      </section>

      {/* Socials Grid */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "1.25rem 1.5rem",
              textDecoration: "none",
              color: "white",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.08)";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `${s.color}18`,
                border: `1px solid ${s.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: s.color,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: "600", fontSize: "0.95rem" }}>{s.name}</p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                {s.handle}
              </p>
            </div>
            <svg
              style={{ marginLeft: "auto", opacity: 0.3 }}
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
  );
}