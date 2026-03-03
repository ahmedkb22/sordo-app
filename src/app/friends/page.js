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

  const loadFriends = async (uid, data) => {
    // Load friend requests
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

    // Load friends
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
    alert(`Friend request sent to ${toUser.name}!`)
  }

  const acceptRequest = async (request) => {
    // Update request status
    await updateDoc(doc(db, 'friendRequests', request.id), { status: 'accepted' })
    // Add each other as friends
    await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(request.from) })
    await updateDoc(doc(db, 'users', request.from), { friends: arrayUnion(user.uid) })
    // Reload
    const docSnap = await getDoc(doc(db, 'users', user.uid))
    await loadFriends(user.uid, docSnap.data())
  }

  const declineRequest = async (request) => {
    await updateDoc(doc(db, 'friendRequests', request.id), { status: 'declined' })
    setRequests(requests.filter(r => r.id !== request.id))
  }

  if (!user) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 px-8 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">SORDO</h1>
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto p-8">

        {/* Search */}
        <div className="bg-gray-900 p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-bold mb-4">🔍 Find Friends</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
            >
              Search
            </button>
          </div>

          {/* Search Results */}
          {loading && <p className="text-gray-400 mt-4">Searching...</p>}
          {searchResults.map(result => (
            <div key={result.id} className="flex justify-between items-center mt-4 bg-gray-800 p-4 rounded-xl">
              <div>
                <p className="font-semibold">{result.name}</p>
                <p className="text-gray-400 text-sm">
                  {result.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
                </p>
              </div>
              <button
                onClick={() => sendRequest(result)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm transition"
              >
                Add Friend
              </button>
            </div>
          ))}
        </div>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <div className="bg-gray-900 p-6 rounded-2xl mb-6">
            <h2 className="text-xl font-bold mb-4">📩 Friend Requests</h2>
            {requests.map(request => (
              <div key={request.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl mb-3">
                <p className="font-semibold">{request.senderName}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(request)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(request)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div className="bg-gray-900 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">👥 My Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No friends yet — search and add some!</p>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-xl mb-3">
                <div>
                  <p className="font-semibold">{friend.name}</p>
                  <p className="text-gray-400 text-sm">
                    {friend.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
                  </p>
                </div>
                <Link href="/call">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm transition">
                    📹 Call
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