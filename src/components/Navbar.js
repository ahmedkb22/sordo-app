"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // session: replace with your real auth logic (e.g. next-auth useSession)
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Simulate checking session from localStorage
    const user = localStorage.getItem("sordo_user");
    if (user) setSession(JSON.parse(user));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        background: scrolled
          ? "rgba(5, 10, 30, 0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(59,130,246,0.15)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: "1.6rem",
              fontWeight: "800",
              letterSpacing: "0.15em",
              background: "linear-gradient(135deg, #fff 30%, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SORDO
          </span>
        </Link>

        {/* Desktop Links */}
        <div
          className="desktop-nav"
          style={{ display: "flex", alignItems: "center", gap: "2rem" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: "500",
                color: pathname === link.href ? "#3b82f6" : "rgba(255,255,255,0.75)",
                transition: "color 0.2s ease",
                paddingBottom: "2px",
                borderBottom: pathname === link.href ? "2px solid #3b82f6" : "2px solid transparent",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Account / Login */}
          <Link href={session ? "/dashboard" : "/login"} style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "999px",
                background: session ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
                border: session ? "none" : "1.5px solid rgba(255,255,255,0.4)",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.2s ease",
              }}
            >
              {session ? (
                <>
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#60a5fa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      color: "#1e3a8a",
                    }}
                  >
                    {session.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  {session.name}
                </>
              ) : (
                "Mon compte"
              )}
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            flexDirection: "column",
            gap: "5px",
          }}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: "24px",
                height: "2px",
                background: "white",
                borderRadius: "2px",
                transition: "all 0.3s ease",
                transform:
                  menuOpen && i === 0
                    ? "rotate(45deg) translate(5px, 5px)"
                    : menuOpen && i === 1
                    ? "opacity(0)"
                    : menuOpen && i === 2
                    ? "rotate(-45deg) translate(5px, -5px)"
                    : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            background: "rgba(5, 10, 30, 0.97)",
            borderTop: "1px solid rgba(59,130,246,0.2)",
            padding: "1rem 1.5rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: "500",
                color: pathname === link.href ? "#3b82f6" : "rgba(255,255,255,0.8)",
                padding: "0.5rem 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link href={session ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)}>
            <button
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                color: "white",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {session ? `Mon compte (${session.name})` : "Mon compte"}
            </button>
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}