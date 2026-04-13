import Link from "next/link";
import "./page.css";

export default function Home() {
  return (
    <main className="home-main">

      {/* ── Hero Section ── */}
      <section className="hero-section">

        {/* Background glow */}
        <div aria-hidden className="hero-glow" />

        {/* Badge */}
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Nouvelle technologie de communication
        </div>

        {/* Title */}
        <h1 className="hero-title">SORDO</h1>

        <p className="hero-subtitle">Communication sans barrières</p>

        <p className="hero-description">
          SORDO est une plateforme innovante qui brise les barrières de communication
          entre les personnes sourdes, malentendantes et entendantes, grâce à des outils
          intelligents en temps réel.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta">
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button className="btn-primary">Commencer gratuitement</button>
          </Link>
          <Link href="/about" style={{ textDecoration: "none" }}>
            <button className="btn-secondary">En savoir plus</button>
          </Link>
        </div>

        {/* Media placeholder */}
        <div className="hero-media">
          <div className="hero-media-icon">▶</div>
          Votre vidéo / photo de démo ici
        </div>

      </section>

      {/* ── Features strip ── */}
      <section className="features-section">
        {[
          { icon: "🤝", title: "Accessibilité totale",  desc: "Une interface pensée pour tous, adaptée aux besoins de chaque utilisateur." },
          { icon: "⚡", title: "Temps réel",            desc: "Traduction et communication instantanées sans délai perceptible." },
          { icon: "🔒", title: "Privé & sécurisé",      desc: "Vos conversations restent confidentielles et chiffrées de bout en bout." },
          { icon: "🌍", title: "Multilingue",           desc: "Fonctionne en plusieurs langues et langages des signes." },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

    </main>
  );
}