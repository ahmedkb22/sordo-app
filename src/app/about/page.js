export default function About() {
  const team = [
    { name: "Ahmed Kebir", role: "Co-fondateur & CEO", initials: "AK" },
    { name: "Abdessamed Bendella", role: "Co-fondateur & CEO", initials: "AB" },
  
  ];

  const goals = [
    { number: "01", title: "Briser les barrières", desc: "Rendre la communication accessible à toutes les personnes sourdes et malentendantes." },
    { number: "02", title: "Innover continuellement", desc: "Développer des technologies de pointe pour améliorer l'expérience utilisateur." },
    { number: "03", title: "Créer une communauté", desc: "Fédérer une communauté inclusive où chaque voix — sous toutes ses formes — est entendue." },
    { number: "04", title: "Impact social", desc: "Contribuer à une société plus équitable grâce à des outils technologiques accessibles." },
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
      {/* Hero */}
      <section
        style={{
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          maxWidth: "700px",
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
          Notre histoire
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: "800",
            background: "linear-gradient(135deg, #fff 0%, #93c5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "1.25rem",
            lineHeight: 1.15,
          }}
        >
          À propos de SORDO
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.5)",
            lineHeight: "1.85",
          }}
        >
          SORDO est né d'une conviction simple : personne ne devrait se sentir exclu
          d'une conversation. Nous construisons des outils pour que la communication
          soit un droit universel, pas un privilège.
        </p>
      </section>

      {/* Mission */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            gridColumn: "1 / -1",
            background: "rgba(37,99,235,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "20px",
            padding: "2.5rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1rem", color: "#93c5fd" }}>
            Notre mission
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: "1.85", maxWidth: "700px" }}>
            Nous croyons que la technologie doit servir l'humain. SORDO développe des solutions
            de communication innovantes qui permettent aux personnes sourdes, malentendantes et
            entendantes de communiquer naturellement, sans friction et en temps réel.
            Notre ambition est de rendre ces outils disponibles partout dans le monde.
          </p>
        </div>

        {/* Goals */}
        {goals.map((g) => (
          <div
            key={g.number}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "1.75rem",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "2rem",
                fontWeight: "900",
                color: "rgba(59,130,246,0.3)",
                marginBottom: "0.75rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {g.number}
            </span>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "0.5rem", color: "white" }}>
              {g.title}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: "1.7", margin: 0 }}>
              {g.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Team */}
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "2rem 1.5rem 6rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: "800",
            textAlign: "center",
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #fff, #93c5fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Notre équipe
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "3rem",
            fontSize: "0.95rem",
          }}
        >
          Les personnes passionnées derrière SORDO
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {team.map((member) => (
            <div
              key={member.name}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "20px",
                padding: "2rem 1.5rem",
                textAlign: "center",
                transition: "border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
                }}
              >
                {member.initials}
              </div>
              <p style={{ fontWeight: "700", fontSize: "1rem", margin: "0 0 0.25rem", color: "white" }}>
                {member.name}
              </p>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}