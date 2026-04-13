'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, query, where, getDocs,
  doc, setDoc, getDoc, updateDoc, arrayUnion
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './friends.css'

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
    const q = query(
      collection(db, 'users'),
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff')
    )
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

  if (!user) return (
    <main className="friends-loading-screen">
      <div className="friends-loading-screen__inner">
        <div className="friends-spinner" />
        <p className="friends-loading-screen__text">Chargement...</p>
      </div>
    </main>
  )

  return (
    <main className="friends-page">

      {/* Background glow */}
      <div aria-hidden className="friends-bg-glow" />

      {/* Toast */}
      {toast && (
        <div className={`friends-toast friends-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="friends-container">

        {/* Header */}
        <div className="friends-header">
          <div>
            <h1 className="friends-header__title">Mes amis</h1>
            <p className="friends-header__subtitle">
              {friends.length} ami{friends.length !== 1 ? 's' : ''}
              {requests.length > 0 && ` · ${requests.length} demande${requests.length > 1 ? 's' : ''} en attente`}
            </p>
          </div>
          <Link href="/dashboard" className="friends-back-btn">
            ← Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="friends-card">
          <h2 className="friends-card__title">🔍 Rechercher des amis</h2>
          <div className="friends-search-row">
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="friends-search-input"
            />
            <button onClick={handleSearch} className="friends-search-btn">
              Chercher
            </button>
          </div>

          {loading && (
            <p className="friends-search-loading">Recherche en cours...</p>
          )}

          {searchResults.map(result => (
            <div key={result.id} className="friends-user-row">
              <div className="friends-user-row__left">
                <div className="friends-avatar friends-avatar--blue friends-avatar--sm">
                  {getInitials(result.name)}
                </div>
                <div className="friends-user-row__info">
                  <p className="friends-user-row__name">{result.name}</p>
                  <p className="friends-user-row__role">
                    {result.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
                  </p>
                </div>
              </div>
              <button onClick={() => sendRequest(result)} className="friends-btn friends-btn--add">
                + Ajouter
              </button>
            </div>
          ))}
        </div>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div className="friends-card friends-card--requests">
            <h2 className="friends-card__title">
              📩 Demandes d'amis
              <span className="friends-badge">{requests.length}</span>
            </h2>
            {requests.map(request => (
              <div key={request.id} className="friends-user-row friends-user-row--list">
                <div className="friends-user-row__left">
                  <div className="friends-avatar friends-avatar--purple friends-avatar--sm">
                    {getInitials(request.senderName)}
                  </div>
                  <div className="friends-user-row__info">
                    <p className="friends-user-row__name">{request.senderName}</p>
                  </div>
                </div>
                <div className="friends-user-row__actions">
                  <button onClick={() => acceptRequest(request)} className="friends-btn friends-btn--accept">
                    ✓ Accepter
                  </button>
                  <button onClick={() => declineRequest(request)} className="friends-btn friends-btn--decline">
                    ✕ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div className="friends-card">
          <h2 className="friends-card__title">👥 Mes amis ({friends.length})</h2>
          {friends.length === 0 ? (
            <div className="friends-empty">
              <div className="friends-empty__icon">🤝</div>
              <p className="friends-empty__text">
                Pas encore d'amis — cherchez et ajoutez-en !
              </p>
            </div>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="friends-user-row friends-user-row--list">
                <div className="friends-user-row__left">
                  <div className="friends-avatar friends-avatar--blue">
                    {getInitials(friend.name)}
                    <span className="friends-avatar__online-dot" />
                  </div>
                  <div className="friends-user-row__info">
                    <p className="friends-user-row__name">{friend.name}</p>
                    <p className="friends-user-row__role">
                      {friend.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
                    </p>
                  </div>
                </div>
                <Link href="/call" className="friends-btn friends-btn--call">
                  📹 Appeler
                </Link>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  )
}