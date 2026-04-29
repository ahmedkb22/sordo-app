'use client'
import { useState } from 'react'
import Link from 'next/link'
import { auth } from '../../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, HandMetal } from 'lucide-react'
import './login.css'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill all fields')
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-main">

      {/* Background glow */}
      <div aria-hidden className="login-glow" />

      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <Link href="/" className="login-logo">SORDO</Link>
          <h2 className="login-title">
            Bon retour <HandMetal size={22} strokeWidth={1.5} className="login-title-icon" />
          </h2>
          <p className="login-subtitle">Connectez-vous à votre compte SORDO</p>
        </div>

        {/* Error */}
        {error && <div className="login-error">{error}</div>}

        {/* Fields */}
        <div className="login-fields">
          <div>
            <label className="login-field-label">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
            />
          </div>

          <div>
            <label className="login-field-label">Mot de passe</label>
            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword
                  ? <EyeOff size={18} strokeWidth={1.8} />
                  : <Eye    size={18} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line" />
          <span className="login-divider-text">ou</span>
          <div className="login-divider-line" />
        </div>

        {/* Footer */}
        <p className="login-footer">
          Pas encore de compte ?{' '}
          <Link href="/signup">S'inscrire</Link>
        </p>

      </div>
    </main>
  )
}