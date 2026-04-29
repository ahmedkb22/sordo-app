'use client'

import { useState, useEffect } from 'react'
import { auth } from '../../firebase'
import { updateProfile, updatePassword, sendEmailVerification } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { User, CheckCircle, Mail, Lock, Save, KeyRound } from 'lucide-react'
import './profile.css'

export default function Profile() {
  const [user, setUser]         = useState(null)
  const [name, setName]         = useState('')
  const [photo, setPhoto]       = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

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
  }, [router])

  const handleUpdateProfile = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photo,
      })

      setMessage('Profil mis à jour avec succès')
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
      if (!auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser)
        setMessage('Vérifiez votre email avant de changer le mot de passe')
        return
      }

      await updatePassword(auth.currentUser, password)
      setMessage('Mot de passe mis à jour')
      setPassword('')
    } catch (err) {
      setError('Erreur: reconnectez-vous puis réessayez')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="profile-main">
      <div className="profile-card">

        <h2 className="profile-title">
          <User size={24} />
          Mon Profil
        </h2>

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        {message && (
          <div className="profile-success">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        <div className="profile-avatar-wrap">
          <img
            src={photo || 'https://via.placeholder.com/100'}
            alt="profile"
            className="profile-avatar"
          />
        </div>

        <div className="profile-fields">
          <input
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="profile-input"
          />

          <input
            type="text"
            placeholder="URL de la photo"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            className="profile-input"
          />

          <button
            onClick={handleUpdateProfile}
            className="profile-btn"
            disabled={loading}
          >
            <Save size={18} />
            Mettre à jour le profil
          </button>

          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="profile-input"
          />

          <button
            onClick={handleChangePassword}
            className="profile-btn"
            disabled={loading}
          >
            <KeyRound size={18} />
            Changer mot de passe
          </button>
        </div>

      </div>
    </main>
  )
}