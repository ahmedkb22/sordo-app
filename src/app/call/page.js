'use client'
import { useEffect, useRef, useState } from 'react'
import { auth, db } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc, setDoc, getDoc, onSnapshot,
  collection, addDoc, updateDoc
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]
}

function CallComponent() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [callId, setCallId] = useState('')
  const [status, setStatus] = useState('idle')
  const [friendLeft, setFriendLeft] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const router = useRouter()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) router.push('/login')
      else {
        setUser(currentUser)
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid))
        if (docSnap.exists()) setUserData(docSnap.data())
      }
    })
    return () => unsubscribe()
  }, [])

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    return stream
  }

  const createCall = async () => {
    setStatus('calling')
    const stream = await startCamera()
    const pc = new RTCPeerConnection(servers)
    pcRef.current = pc

    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
    }

    const callDoc = doc(collection(db, 'calls'))
    const offerCandidates = collection(callDoc, 'offerCandidates')
    const answerCandidates = collection(callDoc, 'answerCandidates')

    setCallId(callDoc.id)

    pc.onicecandidate = (event) => {
      if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON())
    }

    const offerDescription = await pc.createOffer()
    await pc.setLocalDescription(offerDescription)

    await setDoc(callDoc, {
      offer: { sdp: offerDescription.sdp, type: offerDescription.type },
      status: 'waiting',
      createdBy: userData?.name || 'User'
    })

    // Listen to chat messages
    onSnapshot(collection(callDoc, 'messages'), (snapshot) => {
    const msgs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.createdAt?.localeCompare(b.createdAt))
    setMessages(msgs)
    })

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data()
      if (!pc.currentRemoteDescription && data?.answer) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        setStatus('connected')
        setFriendLeft(false)
      }
      if (data?.status === 'ended') {
        setFriendLeft(true)
        setStatus('ended')
        pc.close()
        localStreamRef.current?.getTracks().forEach(t => t.stop())
      }
    })

    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
        }
      })
    })
  }

  const joinCall = async () => {
    if (!callId.trim()) return
    setStatus('joining')
    const stream = await startCamera()
    const pc = new RTCPeerConnection(servers)
    pcRef.current = pc

    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
    }

    const callDoc = doc(db, 'calls', callId)
    const answerCandidates = collection(callDoc, 'answerCandidates')
    const offerCandidates = collection(callDoc, 'offerCandidates')

    pc.onicecandidate = (event) => {
      if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON())
    }

    const callData = (await getDoc(callDoc)).data()
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer))

    const answerDescription = await pc.createAnswer()
    await pc.setLocalDescription(answerDescription)

    await setDoc(callDoc, {
      ...callData,
      answer: { type: answerDescription.type, sdp: answerDescription.sdp },
      status: 'connected',
      joinedBy: userData?.name || 'User'
    })

    // Listen to chat messages
    onSnapshot(collection(callDoc, 'messages'), (snapshot) => {
    const msgs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.createdAt?.localeCompare(b.createdAt))
    setMessages(msgs)
    })

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data()
      if (data?.status === 'ended') {
        setFriendLeft(true)
        setStatus('ended')
        pc.close()
        localStreamRef.current?.getTracks().forEach(t => t.stop())
      }
    })

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
        }
      })
    })

    setStatus('connected')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !callId) return
    const callDoc = doc(db, 'calls', callId)
    await addDoc(collection(callDoc, 'messages'), {
        text: newMessage,
        sender: userData?.name || 'User',
        createdAt: new Date().toISOString()
    })
    setNewMessage('')
    }

  const endCall = async () => {
    // Notify the other user
    if (callId) {
      try {
        await updateDoc(doc(db, 'calls', callId), { status: 'ended' })
      } catch (e) {}
    }
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 px-8 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">SORDO — Video Call</h1>
        {status !== 'ended' && (
          <button onClick={endCall} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition">
            📵 End Call
          </button>
        )}
      </nav>

      <div className="max-w-4xl mx-auto p-8">

        {/* Friend Left Banner */}
        {friendLeft && (
          <div className="bg-red-900 border border-red-600 p-4 rounded-2xl mb-6 text-center">
            <p className="text-lg font-semibold mb-4">👋 Your friend has left the call</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setFriendLeft(false)
                  setStatus('idle')
                  setCallId('')
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                🔄 Start New Call
              </button>
              <Link href="/dashboard">
                <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition">
                  🏠 Go to Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Videos */}
        {(status === 'connected' || status === 'calling' || status === 'joining') && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-3 left-3 bg-black bg-opacity-60 px-3 py-1 rounded-lg text-sm font-semibold">
                🟢 {userData?.name || 'You'}
              </span>
            </div>
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-3 left-3 bg-black bg-opacity-60 px-3 py-1 rounded-lg text-sm font-semibold">
                {status === 'connected' ? '🟢 Friend' : '⏳ Waiting...'}
              </span>
            </div>
          </div>
        )}

        {/* Idle - Start or Join */}
        {status === 'idle' && !friendLeft && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 p-6 rounded-2xl text-center">
              <h3 className="text-lg font-bold mb-4">📞 Start a Call</h3>
              <button
                onClick={createCall}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
              >
                Create Call
              </button>
            </div>
            <div className="bg-gray-900 p-6 rounded-2xl text-center">
              <h3 className="text-lg font-bold mb-4">🤝 Join a Call</h3>
              <input
                type="text"
                placeholder="Paste Call ID here..."
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                className="w-full bg-gray-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <button
                onClick={joinCall}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition"
              >
                Join Call
              </button>
            </div>
          </div>
        )}

        {/* Waiting for friend */}
        {status === 'calling' && (
          <div className="bg-gray-900 p-6 rounded-2xl text-center">
            <p className="text-gray-400 animate-pulse text-lg mb-4">⏳ Waiting for friend to join...</p>
            <p className="text-gray-400 text-sm mb-2">Share this ID with your friend:</p>
            <div className="bg-gray-800 p-3 rounded-xl mb-3">
              <p className="text-blue-400 font-mono text-sm break-all">{callId}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(callId)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm transition"
            >
              📋 Copy ID
            </button>
          </div>
        )}

        {/* Chat */}
    {status === 'connected' && (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
        <p className="font-semibold">💬 Chat</p>
        </div>
        <div className="h-48 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-4">No messages yet...</p>
        )}
        {messages.map(msg => (
            <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === userData?.name ? 'items-end' : 'items-start'}`}
            >
            <span className="text-xs text-gray-400 mb-1">{msg.sender}</span>
            <div className={`px-4 py-2 rounded-2xl text-sm max-w-xs ${
                msg.sender === userData?.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white'
            }`}>
                {msg.text}
            </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-800 flex gap-3">
        <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-gray-800 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm transition"
        >
            Send
        </button>
        </div>
    </div>
    )}

      </div>
    </main>
  )
}

export default function CallPage() {
  return (
    <Suspense>
      <CallComponent />
    </Suspense>
  )
}