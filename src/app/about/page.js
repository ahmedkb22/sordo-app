import "./about.css";

export default function About() {
  const team = [
    { name: "Ahmed Kebir",       role: "Co-fondateur & CEO", initials: "AK" },
    { name: "Abdessamed Bendella", role: "Co-fondateur & CEO", initials: "AB" },
  ];

  const goals = [
    { number: "01", title: "Briser les barrières",      desc: "Rendre la communication accessible à toutes les personnes sourdes et malentendantes." },
    { number: "02", title: "Innover continuellement",   desc: "Développer des technologies de pointe pour améliorer l'expérience utilisateur." },
    { number: "03", title: "Créer une communauté",      desc: "Fédérer une communauté inclusive où chaque voix — sous toutes ses formes — est entendue." },
    { number: "04", title: "Impact social",             desc: "Contribuer à une société plus équitable grâce à des outils technologiques accessibles." },
  ];

  return (
    <main className="about-main">

      {/* ── Hero ── */}
      <section className="about-hero">
        <span className="about-badge">Notre histoire</span>
        <h1 className="about-title">À propos de SORDO</h1>
        <p className="about-intro">
          SORDO est né d'une conviction simple : personne ne devrait se sentir exclu
          d'une conversation. Nous construisons des outils pour que la communication
          soit un droit universel, pas un privilège.
        </p>
      </section>

      {/* ── Mission ── */}
      <section className="mission-section">

        <div className="mission-card">
          <h2>Notre mission</h2>
          <p>
            Nous croyons que la technologie doit servir l'humain. SORDO développe des solutions
            de communication innovantes qui permettent aux personnes sourdes, malentendantes et
            entendantes de communiquer naturellement, sans friction et en temps réel.
            Notre ambition est de rendre ces outils disponibles partout dans le monde.
          </p>
        </div>

        {/* Goals */}
        {goals.map((g) => (
          <div key={g.number} className="goal-card">
            <span className="goal-number">{g.number}</span>
            <h3 className="goal-title">{g.title}</h3>
            <p className="goal-desc">{g.desc}</p>
          </div>
        ))}

      </section>

      {/* ── Team ── */}
      <section className="team-section">
        <h2 className="team-title">Notre équipe</h2>
        <p className="team-subtitle">Les personnes passionnées derrière SORDO</p>

        <div className="team-grid">
          {team.map((member) => (
            <div key={member.name} className="team-card">
              <div className="team-avatar">{member.initials}</div>
              <p className="team-name">{member.name}</p>
              <p className="team-role">{member.role}</p>
            </div>
          ))}
        </div>

      </section>

    </main>
  );
}