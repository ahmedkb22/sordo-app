'use client'
import { useState } from 'react'
import Link from 'next/link'
import { auth, db } from '../../firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import './signup.css'

export default function Signup() {
  const [role, setRole]         = useState('')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    if (!role)                      return setError('Please select Parlant or Non-Parlant')
    if (!name || !email || !password) return setError('Please fill all fields')
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await updateProfile(user, { displayName: name })
      await setDoc(doc(db, 'users', user.uid), {
        name, email, role, createdAt: new Date().toISOString(),
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
              { value: 'parlant',     label: '🗣️ Parlant' },
              { value: 'non-parlant', label: '🤟 Non-Parlant' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`signup-role-btn ${role === r.value ? 'selected' : ''}`}
              >
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
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="signup-input"
            />
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