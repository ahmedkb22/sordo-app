'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '../../firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [friendsCount, setFriendsCount] = useState(0)
  const [notifications, setNotifications] = useState(0)
  const [onlineCount, setOnlineCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
        const docRef = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserData(docSnap.data())
          setFriendsCount(docSnap.data().friends?.length || 0)
          const { getDocs, collection, query, where } = await import('firebase/firestore')
          const q = query(
            collection(db, 'friendRequests'),
            where('to', '==', currentUser.uid),
            where('status', '==', 'pending')
          )
          const snap = await getDocs(q)
          setNotifications(snap.size)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!user || !userData) return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 50%, #0d1f4a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(59,130,246,0.3)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 60%, #0d1f4a 100%)',
        color: 'white',
        paddingTop: '68px',
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Welcome Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(29,78,216,0.1) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '24px',
            padding: '2rem 2.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Avatar */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: '800',
                color: 'white',
                boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
                flexShrink: 0,
                border: '2px solid rgba(59,130,246,0.4)',
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(userData.name)
              )}
            </div>

            <div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.2rem', letterSpacing: '0.05em' }}>
                Bon retour 👋
              </p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.4rem', color: 'white' }}>
                {userData.name}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  color: '#93c5fd',
                }}
              >
                {userData.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
              </span>
            </div>
          </div>

          {/* Right side actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                👤 Mon profil
              </button>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Friends stat */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '18px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: 'rgba(59,130,246,0.08)',
                borderRadius: '50%',
              }}
            />
            <p style={{ fontSize: '2.2rem', fontWeight: '900', color: '#60a5fa', margin: '0 0 0.25rem' }}>
              {friendsCount}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.05em' }}>
              Amis
            </p>
          </div>

          {/* Online stat */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '18px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: 'rgba(34,197,94,0.08)',
                borderRadius: '50%',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                  boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                }}
              />
              <p style={{ fontSize: '2.2rem', fontWeight: '900', color: '#4ade80', margin: 0 }}>
                {onlineCount}
              </p>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.05em' }}>
              En ligne
            </p>
          </div>

          {/* Notifications stat */}
          <div
            style={{
              background: notifications > 0 ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)',
              border: notifications > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: '18px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: '50%',
              }}
            />
            <p style={{ fontSize: '2.2rem', fontWeight: '900', color: notifications > 0 ? '#f87171' : 'rgba(255,255,255,0.3)', margin: '0 0 0.25rem' }}>
              {notifications}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.05em' }}>
              Demandes
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Friends Card */}
          <Link href="/friends" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.08)'
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {notifications > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {notifications}
                </div>
              )}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                👥
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.4rem', color: 'white' }}>
                Mes amis
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: '1.6' }}>
                Gérez vos amis et répondez aux demandes en attente.
              </p>
            </div>
          </Link>

          {/* Video Call Card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '20px',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
              opacity: 0.6,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.65rem',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Bientôt
            </div>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem',
              }}
            >
              🎥
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.4rem', color: 'rgba(255,255,255,0.5)' }}>
              Appel vidéo
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: '1.6' }}>
              Appels avec détection de langue des signes en temps réel.
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}