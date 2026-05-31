'use client'
// ─────────────────────────────────────────────────────────────────────────────
// SORDO — Academic / Enterprise Mode  (src/app/academic/page.js)
//
// This page is the future "Academic Mode" portal for enterprises and
// institutions that want to teach ASL/LSF to their teams using Sordo.
//
// ACCESS: VIP plan only.
//   • If user is not logged in → redirect to /login
//   • If user's plan is not 'vip' → show PaywallModal with type='academic'
//   • Otherwise → show the Academic Mode dashboard (future UI)
//
// CURRENT STATE: UI shell only. All features marked "coming soon".
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  Users,
  BarChart3,
  BookOpen,
  Award,
  Settings,
  Lock,
  Crown,
  Loader2,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import PaywallModal from '../../components/PaywallModal'
import './academic.css'

// ── Feature cards shown to VIP users (all coming soon) ───────
const ACADEMIC_FEATURES = [
  {
    icon: <Building2 size={26} strokeWidth={1.8} />,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    border: 'rgba(251,191,36,0.22)',
    title: 'Espace Entreprise',
    desc: 'Créez un espace dédié à votre organisation avec gestion des accès.',
    soon: true,
  },
  {
    icon: <Users size={26} strokeWidth={1.8} />,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.22)',
    title: 'Gestion des équipes',
    desc: 'Ajoutez vos apprenants, formateurs et superviseurs en quelques clics.',
    soon: true,
  },
  {
    icon: <BookOpen size={26} strokeWidth={1.8} />,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.22)',
    title: 'Modules de formation',
    desc: 'Accédez à des parcours de formation structurés en LSF pour tous les niveaux.',
    soon: true,
  },
  {
    icon: <BarChart3 size={26} strokeWidth={1.8} />,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.22)',
    title: 'Suivi de progression',
    desc: 'Tableau de bord analytique pour suivre les progrès individuels et collectifs.',
    soon: true,
  },
  {
    icon: <Award size={26} strokeWidth={1.8} />,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.22)',
    title: 'Certifications',
    desc: 'Délivrez des certificats de compétences LSF validés par Sordo.',
    soon: true,
  },
  {
    icon: <Settings size={26} strokeWidth={1.8} />,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.22)',
    title: 'Configuration avancée',
    desc: 'Personnalisez les règles de session, les limites d\'utilisation et l\'interface.',
    soon: true,
  },
]

export default function AcademicPage() {
  const [user, setUser]           = useState(null)
  const [planId, setPlanId]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login')
        return
      }
      setUser(u)
      try {
        const snap = await getDoc(doc(db, 'users', u.uid))
        const plan = snap.data()?.subscription?.plan || 'free'
        setPlanId(plan)
        // Non-VIP users see the paywall immediately
        if (plan !== 'vip') setShowPaywall(true)
      } catch (err) {
        console.error('Academic page auth error:', err)
        setPlanId('free')
        setShowPaywall(true)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const isVip = planId === 'vip'

  // ── Loading spinner ───────────────────────────────────────
  if (loading) return (
    <main className="academic-loading">
      <Loader2 className="academic-loading__spin" />
    </main>
  )

  return (
    <main className="academic-page">
      {/* Background */}
      <div aria-hidden className="academic-bg-glow academic-bg-glow--1" />
      <div aria-hidden className="academic-bg-glow academic-bg-glow--2" />

      {/* Paywall for non-VIP */}
      {showPaywall && (
        <PaywallModal
          type="academic"
          minutesUsed={0}
          minutesLimit={null}
          plan={planId || 'free'}
          onClose={() => router.push('/dashboard')}
        />
      )}

      <div className="academic-container">

        {/* Back button */}
        <Link href="/dashboard" className="academic-back-btn">
          <ArrowLeft size={15} />
          Dashboard
        </Link>

        {/* Hero */}
        <div className="academic-hero">
          <div className="academic-hero__icon-wrap">
            <GraduationCap size={40} strokeWidth={1.5} color="#fbbf24" />
          </div>

          <div className="academic-hero__badge">
            <Crown size={12} strokeWidth={2.5} />
            VIP Exclusif
          </div>

          <h1 className="academic-hero__title">
            Mode Académique
          </h1>
          <p className="academic-hero__subtitle">
            Intégrez Sordo dans votre entreprise ou institution pour former
            vos équipes et collaborateurs à la langue des signes française.
          </p>

          {/* Coming soon ribbon */}
          <div className="academic-hero__coming-soon">
            <Sparkles size={14} />
            Cette fonctionnalité est en cours de développement — disponible prochainement
            <Sparkles size={14} />
          </div>
        </div>

        {/* Feature cards grid */}
        <div className="academic-features-grid">
          {ACADEMIC_FEATURES.map((feat, i) => (
            <div
              key={i}
              className="academic-feature-card"
              style={{ borderColor: feat.border }}
            >
              <div
                className="academic-feature-card__icon"
                style={{ background: feat.bg, border: `1px solid ${feat.border}`, color: feat.color }}
              >
                {feat.icon}
                {feat.soon && (
                  <span className="academic-feature-card__soon-dot" />
                )}
              </div>

              <h3 className="academic-feature-card__title" style={{ color: feat.color }}>
                {feat.title}
              </h3>
              <p className="academic-feature-card__desc">{feat.desc}</p>

              <div className="academic-feature-card__tag">
                <Clock size={10} strokeWidth={2} />
                Bientôt disponible
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA — contact for enterprise */}
        <div className="academic-cta-section">
          <h2 className="academic-cta-section__title">
            Intéressé par un déploiement en entreprise ?
          </h2>
          <p className="academic-cta-section__desc">
            Contactez-nous pour discuter de vos besoins spécifiques. Nous proposons
            des solutions sur mesure pour les institutions, entreprises et organisations.
          </p>
          <Link href="/contact" className="academic-cta-section__btn">
            Nous contacter
            <ChevronRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

      </div>
    </main>
  )
}