'use client'
import { useState } from 'react'
import Link from 'next/link'
import { auth, db } from '../../firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    if (!role) return setError('Please select Parlant or Non-Parlant')
    if (!name || !email || !password) return setError('Please fill all fields')
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await updateProfile(user, { displayName: name })
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
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
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '0.4rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
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
          maxWidth: '440px',
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
            Créer un compte
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Rejoignez la communauté SORDO
          </p>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>Je suis :</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { value: 'parlant', label: '🗣️ Parlant' },
              { value: 'non-parlant', label: '🤟 Non-Parlant' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                style={{
                  flex: 1,
                  padding: '0.85rem 0.5rem',
                  borderRadius: '14px',
                  border: role === r.value
                    ? '1.5px solid #3b82f6'
                    : '1.5px solid rgba(255,255,255,0.1)',
                  background: role === r.value
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  color: role === r.value ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: role === r.value ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
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
            <label style={labelStyle}>Nom complet</label>
            <input
              type="text"
              placeholder="Ahmed Kebir"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button
            onClick={handleSignup}
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
            {loading ? 'Création du compte...' : 'Créer mon compte'}
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
          Déjà un compte ?{' '}
          <Link
            href="/login"
            style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}
          >
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}