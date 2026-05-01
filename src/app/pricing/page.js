'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import {
  ArrowLeft,
  Check,
  Zap,
  Crown,
  Star,
  Sparkles,
  Clock,
  Video,
  HandMetal,
  Infinity,
  ChevronRight,
} from 'lucide-react'
import './pricing.css'

const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    period: null,
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.15)',
    border: 'rgba(148,163,184,0.25)',
    icon: <Clock size={22} />,
    badge: null,
    limit: '60 min / jour',
    features: [
      'Détection de signes LSF',
      'Appels vidéo (60 min/jour)',
      'Entraînement (60 min/jour)',
      'Chat intégré',
    ],
    cta: 'Plan actuel',
    disabled: true,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 590,
    period: 'mois',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.18)',
    border: 'rgba(96,165,250,0.35)',
    icon: <Zap size={22} />,
    badge: null,
    limit: '6h / jour',
    features: [
      'Tout du plan Gratuit',
      'Appels vidéo (6h/jour)',
      'Entraînement (6h/jour)',
      'Priorité de traitement',
      'Support par email',
    ],
    cta: 'Choisir Plus',
    disabled: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1490,
    period: 'mois',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.2)',
    border: 'rgba(167,139,250,0.4)',
    icon: <Star size={22} />,
    badge: 'Populaire',
    limit: 'Illimité',
    features: [
      'Tout du plan Plus',
      'Appels & entraînement illimités',
      'Détection haute précision',
      'Export des sessions',
      'Support prioritaire',
    ],
    cta: 'Choisir Pro',
    disabled: false,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 3900,
    period: 'mois',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.18)',
    border: 'rgba(251,191,36,0.35)',
    icon: <Crown size={22} />,
    badge: 'Premium',
    limit: 'Illimité',
    features: [
      'Tout du plan Pro',
      'Accès anticipé aux nouveautés',
      'Session onboarding personnalisée',
      'Support dédié 24/7',
      'Badge VIP sur le profil',
    ],
    cta: 'Choisir VIP',
    disabled: false,
  },
]

export default function PricingPage() {
  const [user, setUser] = useState(null)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          setCurrentPlan(snap.data()?.subscription?.plan || 'free')
        }
      }
      setReady(true)
    })
    return () => unsub()
  }, [])

  const handleChoose = (planId) => {
    if (planId === 'free' || planId === currentPlan) return
    router.push(`/payment?plan=${planId}`)
  }

  return (
    <main className="pricing-page">
      <div aria-hidden className="pricing-bg-glow pricing-bg-glow--1" />
      <div aria-hidden className="pricing-bg-glow pricing-bg-glow--2" />
      <div aria-hidden className="pricing-bg-glow pricing-bg-glow--3" />

      <div className="pricing-container">

        {/* Header */}
        <div className="pricing-header">
          <Link href="/dashboard" className="pricing-back-btn">
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <div className="pricing-header__copy">
            <div className="pricing-header__eyebrow">
              <Sparkles size={14} />
              Abonnements
            </div>
            <h1 className="pricing-header__title">
              Choisissez votre plan
            </h1>
            <p className="pricing-header__subtitle">
              Débloquez tout le potentiel de la communication en langue des signes.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-grid">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan
            const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan)

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.id === 'pro' ? 'pricing-card--featured' : ''} ${isCurrentPlan ? 'pricing-card--current' : ''}`}
                style={{
                  '--plan-color': plan.color,
                  '--plan-glow': plan.glow,
                  '--plan-border': plan.border,
                }}
              >
                {plan.badge && (
                  <div className="pricing-card__badge" style={{ color: plan.color, background: `${plan.color}18`, border: `1px solid ${plan.color}40` }}>
                    {plan.badge}
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="pricing-card__current-badge">
                    Plan actuel
                  </div>
                )}

                <div className="pricing-card__icon" style={{ color: plan.color, background: `${plan.color}15` }}>
                  {plan.icon}
                </div>

                <h2 className="pricing-card__name" style={{ color: plan.color }}>
                  {plan.name}
                </h2>

                <div className="pricing-card__price">
                  {plan.price === 0 ? (
                    <span className="pricing-card__price-free">Gratuit</span>
                  ) : (
                    <>
                      <span className="pricing-card__price-amount">{plan.price.toLocaleString('fr-DZ')}</span>
                      <span className="pricing-card__price-currency"> DA</span>
                      <span className="pricing-card__price-period"> / {plan.period}</span>
                    </>
                  )}
                </div>

                <div className="pricing-card__limit">
                  <Clock size={13} />
                  {plan.limit}
                </div>

                <ul className="pricing-card__features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="pricing-card__feature">
                      <span className="pricing-card__feature-check" style={{ color: plan.color }}>
                        <Check size={13} strokeWidth={2.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoose(plan.id)}
                  disabled={isCurrentPlan || plan.id === 'free'}
                  className={`pricing-card__cta ${isCurrentPlan ? 'pricing-card__cta--current' : isUpgrade ? 'pricing-card__cta--upgrade' : 'pricing-card__cta--default'}`}
                  style={isUpgrade ? { '--btn-color': plan.color, '--btn-glow': plan.glow } : {}}
                >
                  {isCurrentPlan ? (
                    'Plan actuel'
                  ) : (
                    <>
                      {plan.cta}
                      <ChevronRight size={15} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="pricing-footer">
          Paiement sécurisé via SATIM · Annulation à tout moment · Tarifs en Dinar Algérien (DA)
        </p>

      </div>
    </main>
  )
}