// src/components/PaywallModal.js
// ─────────────────────────────────────────────────────────────
// Shown when a user hits their plan limit.
// Displays current usage + upgrade plan cards.
// VIP plan now includes Academic Mode perk.
// ─────────────────────────────────────────────────────────────
'use client'
import Link from 'next/link'
import { X, Clock, Zap, Crown, Star, GraduationCap } from 'lucide-react'
import { PLAN_LIMITS } from './usePlanLimits'
import './PaywallModal.css'

// ── Plan cards shown in the modal ────────────────────────────
const PLANS = [
  {
    key: 'plus',
    name: 'Sordo Plus',
    price: '500 DA/mois',
    color: '#a78bfa',
    icon: <Zap size={18} />,
    perks: [
      '6h appel/jour',
      '6h entraînement/jour',
      'Priorité support',
    ],
  },
  {
    key: 'pro',
    name: 'Sordo Pro',
    price: '1200 DA/mois',
    color: '#4ade80',
    icon: <Crown size={18} />,
    perks: [
      'Illimité appel',
      'Illimité entraînement',
      'Support prioritaire',
      'Accès anticipé',
    ],
    recommended: true,
  },
  {
    key: 'vip',
    name: 'Sordo VIP',
    price: 'Sur devis',
    color: '#fbbf24',
    icon: <Star size={18} />,
    perks: [
      'Tout Pro inclus',
      'Mode Académique',           // ← NEW
      'Déploiement institution',
      'Support dédié',
    ],
    academicBadge: true,           // ← shows gold badge on perk
  },
]

export default function PaywallModal({ type, minutesUsed, minutesLimit, plan, onClose }) {
  // type can be 'call' | 'entrainement' | 'academic'
  const isAcademicBlock = type === 'academic'
  const typeLabel = type === 'call' ? 'appel' : type === 'entrainement' ? 'entraînement' : 'Mode Académique'

  return (
    <div className="paywall-overlay">
      <div className="paywall-modal">

        {/* Close */}
        <button className="paywall-close" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Header */}
        <div className="paywall-header">
          <div className="paywall-icon">
            {isAcademicBlock
              ? <GraduationCap size={28} color="#fbbf24" />
              : <Clock size={28} color="#f87171" />
            }
          </div>

          {isAcademicBlock ? (
            <>
              <h2 className="paywall-title">Mode Académique réservé VIP</h2>
              <p className="paywall-desc">
                Le <strong>Mode Académique</strong> vous permet d'intégrer Sordo
                dans votre entreprise ou institution pour former vos équipes à la LSF.
                <br />
                Cette fonctionnalité est exclusivement disponible avec le plan{' '}
                <span style={{ color: '#fbbf24' }}>Sordo VIP</span>.
              </p>
            </>
          ) : (
            <>
              <h2 className="paywall-title">Limite atteinte</h2>
              <p className="paywall-desc">
                Vous avez utilisé <strong>{minutesUsed} min</strong> sur{' '}
                <strong>{minutesLimit} min</strong> de {typeLabel} aujourd'hui avec le plan{' '}
                <span style={{ color: PLAN_LIMITS[plan]?.color }}>{PLAN_LIMITS[plan]?.label}</span>.
              </p>
              <div className="paywall-progress-wrap">
                <div className="paywall-progress-bar">
                  <div
                    className="paywall-progress-fill"
                    style={{ width: `${Math.min((minutesUsed / minutesLimit) * 100, 100)}%` }}
                  />
                </div>
                <span className="paywall-progress-label">{minutesUsed}/{minutesLimit} min</span>
              </div>
            </>
          )}
        </div>

        {/* Plans */}
        <div className="paywall-plans">
          {PLANS.map(p => (
            <div
              key={p.key}
              className={`paywall-plan ${p.recommended ? 'paywall-plan--recommended' : ''}`}
              style={{ borderColor: p.recommended ? p.color : undefined }}
            >
              {p.recommended && (
                <div className="paywall-plan-badge" style={{ background: p.color }}>
                  Recommandé
                </div>
              )}
              <div className="paywall-plan-icon" style={{ color: p.color }}>
                {p.icon}
              </div>
              <h3 className="paywall-plan-name" style={{ color: p.color }}>{p.name}</h3>
              <p className="paywall-plan-price">{p.price}</p>
              <ul className="paywall-plan-perks">
                {p.perks.map((perk, i) => (
                  <li key={i} style={
                    // Highlight Academic Mode perk in VIP card
                    p.academicBadge && perk === 'Mode Académique'
                      ? { color: '#fbbf24', fontWeight: 600 }
                      : {}
                  }>
                    {p.academicBadge && perk === 'Mode Académique'
                      ? <><GraduationCap size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />✓ {perk}</>
                      : `✓ ${perk}`
                    }
                  </li>
                ))}
              </ul>
              <Link
                href={`/pricing?plan=${p.key}`}
                className="paywall-plan-btn"
                style={{ background: p.color }}
              >
                Choisir
              </Link>
            </div>
          ))}
        </div>

        <p className="paywall-footer">
          {isAcademicBlock
            ? 'Contactez-nous pour un déploiement académique sur mesure.'
            : 'Revenez demain pour continuer gratuitement, ou passez à un plan supérieur.'
          }
        </p>

      </div>
    </div>
  )
}