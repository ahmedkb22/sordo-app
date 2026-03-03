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

      // Save user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString()
      })

      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-xl">

        <h2 className="text-3xl font-bold mb-2 text-center">Create Account</h2>
        <p className="text-gray-400 text-center mb-6">Join Sordo today</p>

        <p className="text-sm text-gray-400 mb-3">I am a:</p>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRole('parlant')}
            className={`flex-1 py-3 rounded-xl font-semibold border transition ${
              role === 'parlant' ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-blue-500'
            }`}
          >
            🗣️ Parlant
          </button>
          <button
            onClick={() => setRole('non-parlant')}
            className={`flex-1 py-3 rounded-xl font-semibold border transition ${
              role === 'non-parlant' ? 'bg-blue-600 border-blue-600' : 'border-gray-600 hover:border-blue-500'
            }`}
          >
            🤟 Non-Parlant
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition mt-2 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>

      </div>
    </main>
  )
}