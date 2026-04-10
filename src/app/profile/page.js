'use client'

import { useState, useEffect } from 'react'
import { auth } from '../../firebase'
import {
  updateProfile,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUser(currentUser)
    setName(currentUser.displayName || '')
    setPhoto(currentUser.photoURL || '')
  }, [])

  const handleUpdateProfile = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photo,
      })

      setMessage('Profil mis à jour avec succès ✅')
    } catch (err) {
      setError('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // 🔥 send email verification before allowing password change
      if (!auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser)
        setMessage('Vérifiez votre email avant de changer le mot de passe 📧')
        return
      }

      await updatePassword(auth.currentUser, password)
      setMessage('Mot de passe mis à jour 🔐')
    } catch (err) {
      setError('Erreur: reconnectez-vous puis réessayez')
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
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            color: 'white',
            marginBottom: '1.5rem',
          }}
        >
          Mon Profil 👤
        </h2>

        {/* Messages */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '0.75rem',
            color: '#fca5a5',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '12px',
            padding: '0.75rem',
            color: '#86efac',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {/* Profile Picture */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src={photo || 'https://via.placeholder.com/100'}
            alt="profile"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #3b82f6'
            }}
          />
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="URL de la photo"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleUpdateProfile}
            style={buttonStyle(loading)}
            disabled={loading}
          >
            Mettre à jour le profil
          </button>

          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleChangePassword}
            style={buttonStyle(loading)}
            disabled={loading}
          >
            Changer mot de passe
          </button>
        </div>
      </div>
    </main>
  )
}

/* Styles (same UX as login) */
const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
}

const buttonStyle = (loading) => ({
  padding: '0.9rem',
  borderRadius: '14px',
  background: loading
    ? 'rgba(37,99,235,0.5)'
    : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  border: 'none',
  color: 'white',
  fontWeight: '700',
  cursor: loading ? 'not-allowed' : 'pointer',
})