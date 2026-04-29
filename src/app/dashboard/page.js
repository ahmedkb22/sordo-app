'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '../../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  LogOut,
  Users,
  Wifi,
  Bell,
  Video,
  Dumbbell,
  Mic,
  HandMetal,
  Loader2,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react'
import './dashboard.css'

export default function Dashboard() {
  const [user, setUser]                   = useState(null)
  const [userData, setUserData]           = useState(null)
  const [friendsCount, setFriendsCount]   = useState(0)
  const [notifications, setNotifications] = useState(0)
  const [onlineCount, setOnlineCount]     = useState(0)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
        const docRef  = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserData(docSnap.data())
          setFriendsCount(docSnap.data().friends?.length || 0)
          const { getDocs, collection, query, where } = await import('firebase/firestore')
          const q = query(
            collection(db, 'friendRequests'),
            where('to', '==', currentUser.uid),
            where('status', '==', 'pending')
          )
          const snap = await getDocs(q)
          setNotifications(snap.size)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!user || !userData) return (
    <main className="dash-loading-screen">
      <div className="dash-loading-screen__inner">
        <Loader2 className="dash-spinner-icon" />
        <p className="dash-loading-screen__text">Chargement...</p>
      </div>
    </main>
  )

  return (
    <main className="dash-page">

      {/* Background glow */}
      <div aria-hidden className="dash-bg-glow" />

      <div className="dash-container">

        {/* Welcome Hero */}
        <div className="dash-hero">
          <div className="dash-hero__left">
            <div className="dash-hero__avatar">
              {user.photoURL
                ? <img src={user.photoURL} alt="avatar" />
                : getInitials(userData.name)
              }
            </div>
            <div>
              <p className="dash-hero__greeting">Bon retour</p>
              <h2 className="dash-hero__name">{userData.name}</h2>
              <span className="dash-hero__role-pill">
                {userData.role === 'parlant'
                  ? <><Mic size={13} strokeWidth={2.5} /> Parlant</>
                  : <><HandMetal size={13} strokeWidth={2.5} /> Non-Parlant</>
                }
              </span>
            </div>
          </div>

          <div className="dash-hero__actions">
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <button className="dash-hero__btn dash-hero__btn--profile">
                <User size={15} strokeWidth={2.2} /> Mon profil
              </button>
            </Link>
            <button onClick={handleLogout} className="dash-hero__btn dash-hero__btn--logout">
              <LogOut size={15} strokeWidth={2.2} /> Déconnexion
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="dash-stats">
          <StatCard
            value={friendsCount}
            label="Amis"
            color="#60a5fa"
            glowColor="rgba(59,130,246,0.08)"
            icon={<Users size={16} color="#60a5fa" strokeWidth={2.2} />}
          />
          <StatCard
            value={onlineCount}
            label="En ligne"
            color="#4ade80"
            glowColor="rgba(34,197,94,0.08)"
            dot="#22c55e"
            icon={<Wifi size={16} color="#4ade80" strokeWidth={2.2} />}
          />
          <StatCard
            value={notifications}
            label="Demandes"
            color={notifications > 0 ? '#f87171' : 'rgba(255,255,255,0.3)'}
            glowColor="rgba(239,68,68,0.08)"
            highlight={notifications > 0}
            icon={<Bell size={16} color={notifications > 0 ? '#f87171' : 'rgba(255,255,255,0.3)'} strokeWidth={2.2} />}
          />
        </div>

        {/* Action Cards */}
        <div className="dash-actions">

          <ActionCard
            href="/friends"
            icon={<Users size={24} strokeWidth={2} />}
            iconBg="rgba(59,130,246,0.15)"
            iconBorder="rgba(59,130,246,0.25)"
            iconColor="#60a5fa"
            title="Mes amis"
            description="Gérez vos amis et répondez aux demandes en attente."
            badge={notifications > 0 ? notifications : null}
            hoverBg="rgba(59,130,246,0.08)"
            hoverBorder="rgba(59,130,246,0.25)"
          />

          <ActionCard
            href="/call"
            icon={<Video size={24} strokeWidth={2} />}
            iconBg="rgba(34,197,94,0.12)"
            iconBorder="rgba(34,197,94,0.2)"
            iconColor="#4ade80"
            title="Appel vidéo"
            description="Créez ou rejoignez un appel avec détection de langue des signes."
            hoverBg="rgba(34,197,94,0.07)"
            hoverBorder="rgba(34,197,94,0.2)"
            activePill={<><CheckCircle2 size={11} strokeWidth={2.5} /> Actif</>}
            pillColor="#4ade80"
            pillBg="rgba(34,197,94,0.12)"
            pillBorder="rgba(34,197,94,0.25)"
          />

          <ActionCard
            href="/entrainement"
            icon={<Dumbbell size={24} strokeWidth={2} />}
            iconBg="rgba(124,58,237,0.15)"
            iconBorder="rgba(124,58,237,0.25)"
            iconColor="#c4b5fd"
            title="Mode Entraînement"
            description="Testez la détection de signes, les sous-titres et l'expansion de phrases sans appel."
            hoverBg="rgba(124,58,237,0.08)"
            hoverBorder="rgba(124,58,237,0.25)"
            activePill={<><FlaskConical size={11} strokeWidth={2.5} /> Test</>}
            pillColor="#c4b5fd"
            pillBg="rgba(124,58,237,0.12)"
            pillBorder="rgba(124,58,237,0.25)"
          />

        </div>
      </div>
    </main>
  )
}

/* ── Reusable stat card ──────────────────────────────────────── */
function StatCard({ value, label, color, glowColor, dot, highlight, icon }) {
  return (
    <div className={`dash-stat-card ${highlight ? 'dash-stat-card--highlight' : 'dash-stat-card--default'}`}>
      <div className="dash-stat-card__glow" style={{ background: glowColor }} aria-hidden />

      {icon && <div className="dash-stat-card__icon-top">{icon}</div>}

      {dot ? (
        <div className="dash-stat-card__value-row">
          <span
            className="dash-stat-card__dot"
            style={{ background: dot, boxShadow: `0 0 8px ${dot}99` }}
          />
          <p className="dash-stat-card__value dash-stat-card__value--inline" style={{ color }}>
            {value}
          </p>
        </div>
      ) : (
        <p className="dash-stat-card__value" style={{ color }}>{value}</p>
      )}

      <p className="dash-stat-card__label">{label}</p>
    </div>
  )
}

/* ── Reusable action card ──────────────────────────────────────── */
function ActionCard({
  href, icon, iconBg, iconBorder, iconColor,
  title, description, badge,
  hoverBg, hoverBorder,
  activePill, pillColor, pillBg, pillBorder,
}) {
  return (
    <Link href={href} className="dash-action-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.background   = hoverBg
        e.currentTarget.style.borderColor  = hoverBorder
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background   = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.07)'
      }}
    >
      {badge && (
        <div className="dash-action-card__badge">{badge}</div>
      )}

      {activePill && !badge && (
        <div
          className="dash-action-card__pill"
          style={{ background: pillBg, border: `1px solid ${pillBorder}`, color: pillColor }}
        >
          {activePill}
        </div>
      )}

      <div
        className="dash-action-card__icon"
        style={{ background: iconBg, border: `1px solid ${iconBorder}`, color: iconColor }}
      >
        {icon}
      </div>

      <h3 className="dash-action-card__title">{title}</h3>
      <p className="dash-action-card__desc">{description}</p>
    </Link>
  )
}