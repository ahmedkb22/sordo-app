'use client'
import { useState } from 'react'
import Link from 'next/link'
import { auth } from '../../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 50%, #0d1f4a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        paddingTop: '88px',
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                letterSpacing: '0.15em',
                background: 'linear-gradient(135deg, #fff 30%, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SORDO
            </span>
          </Link>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: '700',
              color: 'white',
              margin: '1rem 0 0.25rem',
            }}
          >
            Bon retour 👋
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Connectez-vous à votre compte SORDO
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#fca5a5',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.4rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.4rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.9rem',
              borderRadius: '14px',
              background: loading
                ? 'rgba(37,99,235,0.5)'
                : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(37,99,235,0.3)',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.75rem 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Pas encore de compte ?{' '}
          <Link
            href="/signup"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  )
}