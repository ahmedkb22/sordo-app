import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #050a1e 0%, #0a1635 50%, #0d1f4a 100%)",
        color: "white",
        overflowX: "hidden",
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6rem 1.5rem 4rem",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "999px",
            padding: "0.4rem 1rem",
            fontSize: "0.8rem",
            fontWeight: "600",
            color: "#93c5fd",
            letterSpacing: "0.08em",
            marginBottom: "2rem",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#3b82f6",
              display: "inline-block",
            }}
          />
          Nouvelle technologie de communication
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(3.5rem, 10vw, 7rem)",
            fontWeight: "900",
            letterSpacing: "0.12em",
            margin: "0 0 1rem",
            lineHeight: 1,
            background: "linear-gradient(135deg, #ffffff 0%, #93c5fd 60%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SORDO
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
            color: "rgba(255,255,255,0.55)",
            marginBottom: "1rem",
            letterSpacing: "0.05em",
          }}
        >
          Communication sans barrières
        </p>

        <p
          style={{
            maxWidth: "560px",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.45)",
            lineHeight: "1.8",
            marginBottom: "3rem",
          }}
        >
          SORDO est une plateforme innovante qui brise les barrières de communication
          entre les personnes sourdes, malentendantes et entendantes, grâce à des outils
          intelligents en temps réel.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "0.85rem 2.2rem",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none",
                color: "white",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(37,99,235,0.35)",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              Commencer gratuitement
            </button>
          </Link>
          <Link href="/about" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "0.85rem 2.2rem",
                borderRadius: "14px",
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.85)",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              En savoir plus
            </button>
          </Link>
        </div>

        {/* Media placeholder */}
        <div
          style={{
            marginTop: "4rem",
            width: "100%",
            maxWidth: "800px",
            aspectRatio: "16/9",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(59,130,246,0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            color: "rgba(255,255,255,0.25)",
            fontSize: "0.9rem",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
          >
            ▶
          </div>
          Votre vidéo / photo de démo ici
        </div>
      </section>

      {/* Features strip */}
      <section
        style={{
          padding: "4rem 1.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {[
          { icon: "🤝", title: "Accessibilité totale", desc: "Une interface pensée pour tous, adaptée aux besoins de chaque utilisateur." },
          { icon: "⚡", title: "Temps réel", desc: "Traduction et communication instantanées sans délai perceptible." },
          { icon: "🔒", title: "Privé & sécurisé", desc: "Vos conversations restent confidentielles et chiffrées de bout en bout." },
          { icon: "🌍", title: "Multilingue", desc: "Fonctionne en plusieurs langues et langages des signes." },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "1.75rem 1.5rem",
              transition: "all 0.25s ease",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>{f.icon}</div>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "white", marginBottom: "0.5rem" }}>
              {f.title}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: "1.7", margin: 0 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}