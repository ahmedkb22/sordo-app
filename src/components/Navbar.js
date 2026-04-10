"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(null);

  // ✅ REAL Firebase session listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession({
          name: user.displayName || user.email,
          email: user.email,
          photo: user.photoURL,
        });
      } else {
        setSession(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scroll effect
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
                borderBottom:
                  pathname === link.href
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Account */}
          <Link href={session ? "/dashboard" : "/login"}>
            <button
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "999px",
                background: session
                  ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                  : "transparent",
                border: session
                  ? "none"
                  : "1.5px solid rgba(255,255,255,0.4)",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
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

        {/* Mobile button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
          }}
        >
          ☰
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  );
}