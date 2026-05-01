'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import {
  ArrowLeft,
  Lock,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  Star,
  Crown,
  Clock,
} from 'lucide-react'
import './payment.css'

const PLAN_META = {
  plus: {
    name: 'Plus',
    price: '590',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.2)',
    icon: <Zap size={18} />,
    limit: '6h / jour',
  },
  pro: {
    name: 'Pro',
    price: '1 490',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.2)',
    icon: <Star size={18} />,
    limit: 'Illimité',
  },
  vip: {
    name: 'VIP',
    price: '3 900',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.2)',
    icon: <Crown size={18} />,
    limit: 'Illimité',
  },
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function PaymentComponent() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'plus'
  const plan = PLAN_META[planId] || PLAN_META.plus

  const router = useRouter()
  const [user, setUser] = useState(null)

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState({})

  const [step, setStep] = useState('form') // 'form' | 'processing' | 'success'
  const cardRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login')
      else setUser(u)
    })
    return () => unsub()
  }, [])

  const validate = () => {
    const e = {}
    if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Numéro invalide'
    if (!cardName.trim()) e.cardName = 'Nom requis'
    const [m, y] = expiry.split('/')
    if (!m || !y || +m < 1 || +m > 12 || y.length < 2) e.expiry = 'Date invalide'
    if (cvv.length < 3) e.cvv = 'CVV invalide'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep('processing')

    // Simulate network delay
    await new Promise(r => setTimeout(r, 2200))

    try {
      const now = new Date()
      const expires = new Date(now)
      expires.setMonth(expires.getMonth() + 1)

      await updateDoc(doc(db, 'users', user.uid), {
        'subscription.plan': planId,
        'subscription.startDate': now.toISOString(),
        'subscription.expiresAt': expires.toISOString(),
        'subscription.paymentRef': `SATIM-${Date.now()}`,
      })

      setStep('success')
    } catch (err) {
      console.error(err)
      setStep('form')
      setErrors({ global: 'Erreur lors de la mise à jour. Réessayez.' })
    }
  }

  // Flip card on CVV focus
  const [cardFlipped, setCardFlipped] = useState(false)

  return (
    <main className="pay-page">
      <div aria-hidden className="pay-bg-glow pay-bg-glow--1" style={{ background: plan.glow }} />
      <div aria-hidden className="pay-bg-glow pay-bg-glow--2" />

      <div className="pay-container">

        {/* Back */}
        {step === 'form' && (
          <Link href="/pricing" className="pay-back-btn">
            <ArrowLeft size={15} />
            Retour aux plans
          </Link>
        )}

        {/* ── Success screen ── */}
        {step === 'success' && (
          <div className="pay-success">
            <div className="pay-success__ring" style={{ '--plan-color': plan.color, '--plan-glow': plan.glow }}>
              <CheckCircle2 size={48} color={plan.color} />
            </div>
            <h2 className="pay-success__title">Paiement réussi !</h2>
            <p className="pay-success__sub">
              Votre plan <span style={{ color: plan.color, fontWeight: 700 }}>{plan.name}</span> est maintenant actif.
            </p>
            <div className="pay-success__detail">
              <span>{plan.icon}</span>
              <span>{plan.limit} · renouvelé dans 30 jours</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="pay-success__btn"
              style={{ background: plan.color }}
            >
              Aller au Dashboard
            </button>
          </div>
        )}

        {/* ── Processing screen ── */}
        {step === 'processing' && (
          <div className="pay-processing">
            <div className="pay-processing__spinner" style={{ '--plan-color': plan.color }}>
              <Loader2 size={36} />
            </div>
            <p className="pay-processing__label">Traitement en cours…</p>
            <p className="pay-processing__sub">Ne fermez pas cette page.</p>
          </div>
        )}

        {/* ── Form ── */}
        {step === 'form' && (
          <div className="pay-layout">

            {/* Left — Order summary */}
            <div className="pay-summary">
              <div className="pay-summary__header">
                <div className="pay-summary__plan-icon" style={{ color: plan.color, background: `${plan.color}15` }}>
                  {plan.icon}
                </div>
                <div>
                  <p className="pay-summary__label">Plan sélectionné</p>
                  <p className="pay-summary__plan-name" style={{ color: plan.color }}>{plan.name}</p>
                </div>
              </div>

              <div className="pay-summary__divider" />

              <div className="pay-summary__row">
                <span>Abonnement mensuel</span>
                <span>{plan.price} DA</span>
              </div>
              <div className="pay-summary__row">
                <span>Taxes</span>
                <span>Incluses</span>
              </div>
              <div className="pay-summary__divider" />
              <div className="pay-summary__row pay-summary__row--total">
                <span>Total</span>
                <span style={{ color: plan.color }}>{plan.price} DA</span>
              </div>

              <div className="pay-summary__limit">
                <Clock size={13} />
                {plan.limit} · renouvelé automatiquement
              </div>

              <div className="pay-summary__security">
                <ShieldCheck size={13} />
                Paiement sécurisé · SATIM
              </div>
            </div>

            {/* Right — Card form */}
            <div className="pay-form-col">

              {/* Visual card */}
              <div className={`pay-card-visual ${cardFlipped ? 'pay-card-visual--flipped' : ''}`} ref={cardRef}>
                <div className="pay-card-visual__front" style={{ '--plan-color': plan.color, '--plan-glow': plan.glow }}>
                  <div className="pay-card-visual__top">
                    <div className="pay-card-visual__chip" />
                    <div className="pay-card-visual__brand">SATIM</div>
                  </div>
                  <p className="pay-card-visual__number">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </p>
                  <div className="pay-card-visual__bottom">
                    <div>
                      <p className="pay-card-visual__field-label">Titulaire</p>
                      <p className="pay-card-visual__field-val">{cardName || 'VOTRE NOM'}</p>
                    </div>
                    <div>
                      <p className="pay-card-visual__field-label">Expire</p>
                      <p className="pay-card-visual__field-val">{expiry || 'MM/AA'}</p>
                    </div>
                  </div>
                </div>
                <div className="pay-card-visual__back">
                  <div className="pay-card-visual__stripe" />
                  <div className="pay-card-visual__cvv-row">
                    <span className="pay-card-visual__cvv-label">CVV</span>
                    <span className="pay-card-visual__cvv-val">{cvv ? '•'.repeat(cvv.length) : '•••'}</span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="pay-form">
                {errors.global && (
                  <p className="pay-form__global-error">{errors.global}</p>
                )}

                <div className="pay-form__field">
                  <label className="pay-form__label">Numéro de carte</label>
                  <div className={`pay-form__input-wrap ${errors.cardNumber ? 'pay-form__input-wrap--error' : ''}`}>
                    <CreditCard size={15} className="pay-form__input-icon" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      className="pay-form__input"
                      maxLength={19}
                    />
                  </div>
                  {errors.cardNumber && <p className="pay-form__error">{errors.cardNumber}</p>}
                </div>

                <div className="pay-form__field">
                  <label className="pay-form__label">Nom sur la carte</label>
                  <div className={`pay-form__input-wrap ${errors.cardName ? 'pay-form__input-wrap--error' : ''}`}>
                    <input
                      type="text"
                      placeholder="AHMED BENALI"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      className="pay-form__input"
                    />
                  </div>
                  {errors.cardName && <p className="pay-form__error">{errors.cardName}</p>}
                </div>

                <div className="pay-form__row">
                  <div className="pay-form__field">
                    <label className="pay-form__label">Date d'expiration</label>
                    <div className={`pay-form__input-wrap ${errors.expiry ? 'pay-form__input-wrap--error' : ''}`}>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                        className="pay-form__input"
                        maxLength={5}
                      />
                    </div>
                    {errors.expiry && <p className="pay-form__error">{errors.expiry}</p>}
                  </div>

                  <div className="pay-form__field">
                    <label className="pay-form__label">CVV</label>
                    <div className={`pay-form__input-wrap ${errors.cvv ? 'pay-form__input-wrap--error' : ''}`}>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="•••"
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onFocus={() => setCardFlipped(true)}
                        onBlur={() => setCardFlipped(false)}
                        className="pay-form__input"
                        maxLength={4}
                      />
                    </div>
                    {errors.cvv && <p className="pay-form__error">{errors.cvv}</p>}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="pay-form__submit"
                  style={{ '--plan-color': plan.color, '--plan-glow': plan.glow }}
                >
                  <Lock size={15} strokeWidth={2.5} />
                  Payer {plan.price} DA
                </button>

                <p className="pay-form__disclaimer">
                  <ShieldCheck size={12} />
                  Simulation uniquement — aucun vrai paiement effectué
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function PaymentPage() {
  return <Suspense><PaymentComponent /></Suspense>
}