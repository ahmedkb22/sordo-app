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
  Crown,
  Zap,
  Star,
  Clock,
  ChevronRight,
  Infinity,
  GraduationCap,
  Lock,
  Building2,
} from 'lucide-react'
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal'
import './dashboard.css'

// ─────────────────────────────────────────────
// PLAN META — single source of truth for the UI
// ─────────────────────────────────────────────
const PLAN_META = {
  free: {
    name: 'Gratuit',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.2)',
    hoverBg: 'rgba(148,163,184,0.07)',
    hoverBorder: 'rgba(148,163,184,0.2)',
    icon: <Clock size={22} />,
    limitMin: 60,
  },
  plus: {
    name: 'Plus',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.22)',
    hoverBg: 'rgba(96,165,250,0.08)',
    hoverBorder: 'rgba(96,165,250,0.3)',
    icon: <Zap size={22} />,
    limitMin: 360,
  },
  pro: {
    name: 'Pro',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.22)',
    hoverBg: 'rgba(167,139,250,0.08)',
    hoverBorder: 'rgba(167,139,250,0.3)',
    icon: <Star size={22} />,
    limitMin: null,
  },
  vip: {
    name: 'VIP',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.22)',
    hoverBg: 'rgba(251,191,36,0.07)',
    hoverBorder: 'rgba(251,191,36,0.3)',
    icon: <Crown size={22} />,
    limitMin: null,
  },
}

export default function Dashboard() {
  const [user, setUser]                   = useState(null)
  const [userData, setUserData]           = useState(null)
  const [friendsCount, setFriendsCount]   = useState(0)
  const [notifications, setNotifications] = useState(0)
  const [onlineCount, setOnlineCount]     = useState(0)
  const [usageToday, setUsageToday]       = useState(0)
  const [showCancel, setShowCancel]       = useState(false)
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
          const data = docSnap.data()
          setUserData(data)
          setFriendsCount(data.friends?.length || 0)

          const today = new Date().toISOString().slice(0, 10)
          const todayUsage = data.usage?.usageByDay?.[today] || {}
          const totalTodayMin = (todayUsage.callMinutes || 0) + (todayUsage.entrainementMinutes || 0)
          setUsageToday(totalTodayMin)

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

  const planId   = userData?.subscription?.plan || 'free'
  const planMeta = PLAN_META[planId] || PLAN_META.free
  const isVip    = planId === 'vip'

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

          {/* Academic Mode Card */}
          <AcademicModeCard isVip={isVip} />

          {/* Subscription Card */}
          <SubscriptionCard
            planId={planId}
            planMeta={planMeta}
            usageToday={usageToday}
            uid={user.uid}
            showCancel={showCancel}
            setShowCancel={setShowCancel}
            onCancelled={() => {
              setUserData(prev => ({
                ...prev,
                subscription: { ...prev.subscription, plan: 'free' }
              }))
            }}
          />

        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────
// ACADEMIC MODE CARD
// ─────────────────────────────────────────────────────────────────
function AcademicModeCard({ isVip }) {
  const href   = isVip ? '/academic' : '/pricing?plan=vip'
  const color  = '#fbbf24'
  const border = isVip ? 'rgba(251,191,36,0.30)' : 'rgba(251,191,36,0.15)'
  const bg     = isVip ? 'rgba(251,191,36,0.07)' : 'rgba(251,191,36,0.04)'

  return (
    <Link
      href={href}
      className={`dash-action-card dash-academic-card ${!isVip ? 'dash-academic-card--locked' : ''}`}
      style={{ borderColor: border, background: bg }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background  = isVip ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.07)'
        e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background  = bg
        e.currentTarget.style.borderColor = border
      }}
    >
      {/* VIP badge or lock */}
      <div
        className="dash-action-card__pill"
        style={{
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.3)',
          color: color,
        }}
      >
        {isVip
          ? <><Crown size={11} strokeWidth={2.5} /> VIP Exclusif</>
          : <><Lock size={11} strokeWidth={2.5} /> VIP uniquement</>
        }
      </div>

      {/* Icon */}
      <div
        className="dash-action-card__icon"
        style={{
          background: 'rgba(251,191,36,0.12)',
          border: `1px solid rgba(251,191,36,0.25)`,
          color: color,
          position: 'relative',
        }}
      >
        <GraduationCap size={24} strokeWidth={2} />
        {!isVip && (
          <span className="dash-academic-card__lock-overlay">
            <Lock size={12} strokeWidth={2.5} />
          </span>
        )}
      </div>

      <h3 className="dash-action-card__title" style={{ color: isVip ? color : 'rgba(251,191,36,0.55)' }}>
        Mode Académique
      </h3>

      <p className="dash-action-card__desc">
        {isVip
          ? 'Intégrez Sordo dans votre institution. Enseignez la LSF à vos équipes avec un tableau de bord dédié.'
          : 'Intégrez Sordo dans votre entreprise ou institution pour former vos équipes à la LSF. Disponible en plan VIP.'
        }
      </p>

      {/* Feature chips */}
      <div className="dash-academic-card__features">
        <span className="dash-academic-card__feature-chip">
          <Building2 size={10} strokeWidth={2} /> Multi-utilisateurs
        </span>
        <span className="dash-academic-card__feature-chip">
          <GraduationCap size={10} strokeWidth={2} /> Suivi progression
        </span>
        <span className="dash-academic-card__feature-chip">
          <CheckCircle2 size={10} strokeWidth={2} /> Certifications
        </span>
        <span className="dash-academic-card__feature-chip dash-academic-card__feature-chip--soon">
          🚀 Bientôt disponible
        </span>
      </div>

      {!isVip && (
        <p className="dash-academic-card__upgrade-cta" style={{ color }}>
          Passer au plan VIP <ChevronRight size={13} strokeWidth={2.5} />
        </p>
      )}
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────
// SUBSCRIPTION CARD
// ─────────────────────────────────────────────────────────────────
function SubscriptionCard({ planId, planMeta, usageToday, uid, showCancel, setShowCancel, onCancelled }) {
  const isUnlimited   = planMeta.limitMin === null
  const combinedLimit = isUnlimited ? null : planMeta.limitMin * 2
  const pct      = isUnlimited ? 100 : Math.min(100, Math.round((usageToday / combinedLimit) * 100))
  const used     = Math.round(usageToday)
  const limit    = planMeta.limitMin
  const barColor = pct >= 80 ? '#f87171' : planMeta.color

  return (
    <>
      <div
        className="dash-action-card dash-sub-card"
        style={{ '--sub-color': planMeta.color, '--sub-border': planMeta.border, borderColor: planMeta.border }}
      >
        {/* Plan pill */}
        <div
          className="dash-action-card__pill"
          style={{ background: planMeta.bg, border: `1px solid ${planMeta.border}`, color: planMeta.color }}
        >
          {planMeta.icon && <span style={{ display: 'flex' }}>{planMeta.icon}</span>}
          {planMeta.name}
        </div>

        {/* Icon */}
        <div
          className="dash-action-card__icon"
          style={{ background: planMeta.bg, border: `1px solid ${planMeta.border}`, color: planMeta.color }}
        >
          <Crown size={24} strokeWidth={2} />
        </div>

        <h3 className="dash-action-card__title">Mon Abonnement</h3>

        {/* Usage bar */}
        <div className="dash-sub-card__usage">
          <div className="dash-sub-card__usage-row">
            <span className="dash-sub-card__usage-label">
              {isUnlimited
                ? "Utilisation aujourd'hui (illimitée)"
                : `${used} min utilisées / ${limit} min par mode`}
            </span>
            <span className="dash-sub-card__usage-pct" style={{ color: barColor }}>
              {isUnlimited ? <Infinity size={14} /> : `${pct}%`}
            </span>
          </div>
          <div className="dash-sub-card__bar-track">
            <div
              className="dash-sub-card__bar-fill"
              style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 8px ${barColor}88` }}
            />
          </div>
        </div>

        {/* Actions row */}
        <div className="dash-sub-card__actions">
          <Link href="/pricing" className="dash-sub-card__cta-link" style={{ color: planMeta.color }}>
            {planId === 'free' || planId === 'plus' ? 'Mettre à niveau' : 'Voir les plans'}
            <ChevronRight size={13} strokeWidth={2.5} />
          </Link>

          {planId !== 'free' && (
            <button
              className="dash-sub-card__cancel-btn"
              onClick={() => setShowCancel(true)}
            >
              Annuler l'abonnement
            </button>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelSubscriptionModal
          uid={uid}
          currentPlan={planId}
          onClose={() => setShowCancel(false)}
          onCancelled={() => {
            onCancelled?.()
            setShowCancel(false)
          }}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// ACTION CARD
// ─────────────────────────────────────────────────────────────────
function ActionCard({
  href, icon, iconBg, iconBorder, iconColor,
  title, description, badge,
  hoverBg, hoverBorder,
  activePill, pillColor, pillBg, pillBorder,
}) {
  return (
    <Link
      href={href}
      className="dash-action-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.background  = hoverBg
        e.currentTarget.style.borderColor = hoverBorder
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
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