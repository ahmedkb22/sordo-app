"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import "./Navbar.css";

export default function Navbar() {
  const pathname  = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession]   = useState(null);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(
        user
          ? { name: user.displayName || user.email, email: user.email, photo: user.photoURL }
          : null
      );
    });
    return () => unsubscribe();
  }, []);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "À propos", href: "/about" },
    { label: "Contact",  href: "/contact" },
  ];

  const navClass = [
    "navbar",
    scrolled   ? "scrolled"   : "",
    menuOpen   ? "menu-open"  : "",
  ].filter(Boolean).join(" ");

  return (
    <nav className={navClass}>

      {/* ── Top bar ── */}
      <div className="navbar-inner">

        {/* Logo */}
        <Link href="/" className="navbar-logo">
          SORDO
        </Link>

        {/* Desktop links */}
        <div className="navbar-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          <Link href={session ? "/dashboard" : "/login"} style={{ textDecoration: "none" }}>
            <button className={`navbar-account-btn ${session ? "logged-in" : "logged-out"}`}>
              {session ? (
                <>
                  <span className="navbar-avatar">
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

        {/* Hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`navbar-mobile ${menuOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`navbar-mobile-link ${pathname === link.href ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}

        <Link href={session ? "/dashboard" : "/login"} style={{ textDecoration: "none" }}>
          <button className={`navbar-mobile-account ${session ? "logged-in" : "logged-out"}`}>
            {session ? (
              <>
                <span className="navbar-mobile-avatar">
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

    </nav>
  );
}