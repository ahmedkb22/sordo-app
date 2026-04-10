'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, query, where, getDocs,
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Friends() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
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
          await loadFriends(currentUser.uid, docSnap.data())
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadFriends = async (uid, data) => {
    const requestsRef = collection(db, 'friendRequests')
    const q = query(requestsRef, where('to', '==', uid), where('status', '==', 'pending'))
    const snapshot = await getDocs(q)
    const reqs = []
    for (const docSnap of snapshot.docs) {
      const reqData = docSnap.data()
      const senderDoc = await getDoc(doc(db, 'users', reqData.from))
      reqs.push({ id: docSnap.id, ...reqData, senderName: senderDoc.data()?.name })
    }
    setRequests(reqs)

    const friendIds = data.friends || []
    const friendsList = []
    for (const fid of friendIds) {
      const fDoc = await getDoc(doc(db, 'users', fid))
      if (fDoc.exists()) friendsList.push({ id: fid, ...fDoc.data() })
    }
    setFriends(friendsList)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    const q = query(collection(db, 'users'), where('name', '>=', searchQuery), where('name', '<=', searchQuery + '\uf8ff'))
    const snapshot = await getDocs(q)
    const results = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.id !== user.uid)
    setSearchResults(results)
    setLoading(false)
  }

  const sendRequest = async (toUser) => {
    const requestId = `${user.uid}_${toUser.id}`
    await setDoc(doc(db, 'friendRequests', requestId), {
      from: user.uid,
      to: toUser.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    showToast(`Demande envoyée à ${toUser.name} !`)
  }

  const acceptRequest = async (request) => {
    await updateDoc(doc(db, 'friendRequests', request.id), { status: 'accepted' })
    await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(request.from) })
    await updateDoc(doc(db, 'users', request.from), { friends: arrayUnion(user.uid) })
    const docSnap = await getDoc(doc(db, 'users', user.uid))
    await loadFriends(user.uid, docSnap.data())
    showToast(`${request.senderName} ajouté comme ami !`)
  }

  const declineRequest = async (request) => {
    await updateDoc(doc(db, 'friendRequests', request.id), { status: 'declined' })
    setRequests(requests.filter(r => r.id !== request.id))
    showToast('Demande refusée.', 'error')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '1.75rem',
    marginBottom: '1.25rem',
  }

  if (!user) return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 50%, #0d1f4a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid rgba(59,130,246,0.3)',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 60%, #0d1f4a 100%)',
      color: 'white',
      paddingTop: '68px',
    }}>
      {/* Background glow */}
      <div aria-hidden style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 100,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          borderRadius: '12px',
          padding: '0.75rem 1.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: toast.type === 'error' ? '#fca5a5' : '#86efac',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.2rem',
              background: 'linear-gradient(135deg, #fff 0%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Mes amis
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {friends.length} ami{friends.length !== 1 ? 's' : ''}
              {requests.length > 0 && ` · ${requests.length} demande${requests.length > 1 ? 's' : ''} en attente`}
            </p>
          </div>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              ← Dashboard
            </button>
          </Link>
        </div>

        {/* Search */}
        <div style={card}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem', color: 'rgba(255,255,255,0.85)' }}>
            🔍 Rechercher des amis
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '0.8rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '0.8rem 1.4rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: 'none',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              Chercher
            </button>
          </div>

          {loading && (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginTop: '1rem' }}>
              Recherche en cours...
            </p>
          )}

          {searchResults.map(result => (
            <div
              key={result.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                padding: '0.9rem 1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: '700', color: 'white', flexShrink: 0,
                }}>
                  {getInitials(result.name)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>{result.name}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                    {result.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => sendRequest(result)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#93c5fd',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Ajouter
              </button>
            </div>
          ))}
        </div>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div style={{
            ...card,
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem', color: 'rgba(255,255,255,0.85)' }}>
              📩 Demandes d'amis
              <span style={{
                marginLeft: '0.5rem',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
              }}>
                {requests.length}
              </span>
            </h2>
            {requests.map(request => (
              <div
                key={request.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '0.9rem 1rem',
                  marginBottom: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: '700', color: 'white', flexShrink: 0,
                  }}>
                    {getInitials(request.senderName)}
                  </div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>{request.senderName}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => acceptRequest(request)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(34,197,94,0.15)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      color: '#86efac',
                      fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    ✓ Accepter
                  </button>
                  <button
                    onClick={() => declineRequest(request)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fca5a5',
                      fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    ✕ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div style={card}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem', color: 'rgba(255,255,255,0.85)' }}>
            👥 Mes amis ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤝</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', margin: 0 }}>
                Pas encore d'amis — cherchez et ajoutez-en !
              </p>
            </div>
          ) : (
            friends.map(friend => (
              <div
                key={friend.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '0.9rem 1rem',
                  marginBottom: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: '700', color: 'white',
                    }}>
                      {getInitials(friend.name)}
                    </div>
                    {/* Online dot — placeholder, wire up real presence later */}
                    <span style={{
                      position: 'absolute', bottom: '1px', right: '1px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#22c55e',
                      border: '2px solid #050a1e',
                    }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>{friend.name}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      {friend.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
                    </p>
                  </div>
                </div>
                <Link href="/call" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#93c5fd',
                    fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    📹 Appeler
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  )
}