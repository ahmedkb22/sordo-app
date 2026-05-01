'use client'
import { useState } from 'react'
import Link from 'next/link'
import { auth, db } from '../../firebase'
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Mic, HandMetal, Eye, EyeOff, Check, X } from 'lucide-react'
import './signup.css'

const passwordRules = [
  { label: 'Au moins 8 caractères',        test: (p) => p.length >= 8 },
  { label: 'Une lettre majuscule',          test: (p) => /[A-Z]/.test(p) },
  { label: 'Un chiffre',                   test: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial (!@#…)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function Signup() {
  const [role, setRole]               = useState('')
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [emailSent, setEmailSent]     = useState(false)
  const router = useRouter()

  const passwordStrength = passwordRules.filter((r) => r.test(password)).length
  const passwordValid    = passwordStrength === passwordRules.length

  const handleSignup = async () => {
    if (!role)                        return setError('Veuillez sélectionner Parlant ou Non-Parlant')
    if (!name || !email || !password) return setError('Veuillez remplir tous les champs')
    if (!passwordValid)               return setError('Le mot de passe ne respecte pas les critères de sécurité')
    try {
      setLoading(true)
      setError('')
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await updateProfile(user, { displayName: name })
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        createdAt: serverTimestamp(),
        subscription: {
          plan: 'free',
          startDate: serverTimestamp(),
          expiresAt: null,
        },
        usage: {
          totalMinutes: 0,
          callMinutes: 0,
          entrainementMinutes: 0,
          usageByDay: {},
        }
      })
      await sendEmailVerification(user)
      setEmailSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Email sent screen ── */
  if (emailSent) {
    return (
      <main className="signup-main">
        <div aria-hidden className="signup-glow" />
        <div className="signup-card">
          <div className="signup-verify-screen">
            <div className="signup-verify-icon">
              <Check size={32} strokeWidth={2} />
            </div>
            <h2 className="signup-title">Vérifiez votre email</h2>
            <p className="signup-verify-text">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
            <p className="signup-verify-hint">
              Pensez à vérifier vos spams si vous ne le voyez pas.
            </p>
            <Link href="/login" className="signup-btn signup-btn-link">
              Aller à la connexion
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="signup-main">

      {/* Background glow */}
      <div aria-hidden className="signup-glow" />

      <div className="signup-card">

        {/* Header */}
        <div className="signup-header">
          <Link href="/" className="signup-logo">SORDO</Link>
          <h2 className="signup-title">Créer un compte</h2>
          <p className="signup-subtitle">Rejoignez la communauté SORDO</p>
        </div>

        {/* Role selector */}
        <div className="signup-role-wrap">
          <p className="signup-role-label">Je suis :</p>
          <div className="signup-role-btns">
            {[
              { value: 'parlant',     label: 'Parlant',     icon: <Mic      size={18} strokeWidth={1.8} /> },
              { value: 'non-parlant', label: 'Non-Parlant', icon: <HandMetal size={18} strokeWidth={1.8} /> },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`signup-role-btn ${role === r.value ? 'selected' : ''}`}
              >
                <span className="signup-role-icon">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div className="signup-error">{error}</div>}

        {/* Fields */}
        <div className="signup-fields">
          <div>
            <label className="signup-field-label">Nom complet</label>
            <input
              type="text"
              placeholder="Ahmed Kebir"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="signup-input"
            />
          </div>

          <div>
            <label className="signup-field-label">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="signup-input"
            />
          </div>

          <div>
            <label className="signup-field-label">Mot de passe</label>
            <div className="signup-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className="signup-input"
              />
              <button
                type="button"
                className="signup-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword
                  ? <EyeOff size={18} strokeWidth={1.8} />
                  : <Eye    size={18} strokeWidth={1.8} />}
              </button>
            </div>

            {/* Strength bar */}
            {(passwordFocused || password.length > 0) && (
              <div className="signup-strength">
                <div className="signup-strength-bar">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`signup-strength-seg ${i < passwordStrength ? `strength-${passwordStrength}` : ''}`}
                    />
                  ))}
                </div>
                <ul className="signup-rules">
                  {passwordRules.map((r) => {
                    const ok = r.test(password)
                    return (
                      <li key={r.label} className={`signup-rule ${ok ? 'ok' : ''}`}>
                        {ok
                          ? <Check size={12} strokeWidth={2.5} />
                          : <X     size={12} strokeWidth={2.5} />}
                        {r.label}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="signup-btn"
          >
            {loading ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </div>

        {/* Divider */}
        <div className="signup-divider">
          <div className="signup-divider-line" />
          <span className="signup-divider-text">ou</span>
          <div className="signup-divider-line" />
        </div>

        {/* Footer */}
        <p className="signup-footer">
          Déjà un compte ?{' '}
          <Link href="/login">Se connecter</Link>
        </p>

      </div>
    </main>
  )
}