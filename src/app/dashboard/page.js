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

        // Count pending friend requests
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

  if (!user || !userData) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 px-8 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">SORDO</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{userData.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-2xl mb-6 flex justify-between items-center">
          <div>
            <p className="text-blue-200 text-sm mb-1">Welcome back 👋</p>
            <h2 className="text-3xl font-bold">{userData.name}</h2>
            <span className="mt-2 inline-block px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-semibold">
              {userData.role === 'parlant' ? '🗣️ Parlant' : '🤟 Non-Parlant'}
            </span>
          </div>
          <div className="text-6xl">
            {userData.role === 'parlant' ? '🗣️' : '🤟'}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-2xl text-center">
            <p className="text-3xl font-bold text-blue-400">{friendsCount}</p>
            <p className="text-gray-400 text-sm mt-1">Friends</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl text-center">
            <p className="text-3xl font-bold text-green-400">0</p>
            <p className="text-gray-400 text-sm mt-1">Online</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl text-center">
            <p className="text-3xl font-bold text-purple-400">0</p>
            <p className="text-gray-400 text-sm mt-1">Calls</p>
          </div>
        </div>

        {/* Video Chat Card */}
        <div className="bg-gray-900 p-8 rounded-2xl text-center border border-gray-800">
          <div className="text-5xl mb-4">🎥</div>
          <h3 className="text-xl font-bold mb-2">Video Chat</h3>
          <p className="text-gray-400 mb-6">Start a video call with sign language detection</p>
         <div className="flex gap-4 justify-center">
        <Link href="/friends">
        <button className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition relative">
            👥 Friends
            {notifications > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications}
            </span>
            )}
        </button>
        </Link>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition opacity-50 cursor-not-allowed">
            🎥 Coming Soon
        </button>
        </div>
        </div>

      </div>
    </main>
  )
}