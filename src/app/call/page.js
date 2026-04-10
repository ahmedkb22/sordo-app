'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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

const SEQUENCE_LENGTH = 30
const API_URL = 'http://127.0.0.1:8000/api/predict/'

function CallComponent() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [callId, setCallId] = useState('')
  const [status, setStatus] = useState('idle')
  const [friendLeft, setFriendLeft] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [signWord, setSignWord] = useState(null)
  const [signConfidence, setSignConfidence] = useState(0)
  const [copied, setCopied] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const messagesEndRef = useRef(null)
  const router = useRouter()

  const handsRef = useRef(null)
  const sequenceRef = useRef([])
  const frameCounterRef = useRef(0)
  const detectingRef = useRef(false)
  const animFrameRef = useRef(null)
  const canvasRef = useRef(null)
  const lastSignRef = useRef(null)
  const callIdRef = useRef('')
  const userDataRef = useRef(null)

  useEffect(() => { callIdRef.current = callId }, [callId])
  useEffect(() => { userDataRef.current = userData }, [userData])

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

  const sendSignMessage = useCallback(async (word) => {
    const currentCallId = callIdRef.current
    const currentUserData = userDataRef.current
    if (!currentCallId || !word) return
    if (lastSignRef.current === word) return
    lastSignRef.current = word
    try {
      const callDoc = doc(db, 'calls', currentCallId)
      await addDoc(collection(callDoc, 'messages'), {
        text: `🤟 ${word.toUpperCase()}`,
        sender: currentUserData?.name || 'You',
        createdAt: new Date().toISOString(),
        isSign: true
      })
    } catch (e) { console.log('Send sign error:', e) }
    setTimeout(() => { lastSignRef.current = null }, 2000)
  }, [])

  const setupMediaPipe = useCallback(async () => {
    const { Hands } = await import('@mediapipe/hands')
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 })
    hands.onResults((results) => {
      const landmarks = new Array(126).fill(0.0)
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        results.multiHandLandmarks.slice(0, 2).forEach((hand, i) => {
          hand.forEach((lm, j) => {
            landmarks[i * 63 + j * 3]     = lm.x
            landmarks[i * 63 + j * 3 + 1] = lm.y
            landmarks[i * 63 + j * 3 + 2] = lm.z
          })
        })
        sequenceRef.current.push(landmarks)
        if (sequenceRef.current.length > SEQUENCE_LENGTH) sequenceRef.current.shift()
        frameCounterRef.current += 1
        if (sequenceRef.current.length === SEQUENCE_LENGTH && frameCounterRef.current % 5 === 0) {
          predictSign(sequenceRef.current)
        }
      } else {
        sequenceRef.current = []
        frameCounterRef.current = 0
        setSignWord(null)
        setSignConfidence(0)
      }
    })
    handsRef.current = hands
  }, [])

  const predictSign = async (sequence) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence })
      })
      const data = await response.json()
      if (data.detected) {
        setSignWord(data.word)
        setSignConfidence(data.confidence)
        if (data.confidence > 75) sendSignMessage(data.word)
      } else {
        setSignWord(null)
        setSignConfidence(data.confidence || 0)
      }
    } catch (e) { console.log('Prediction error:', e) }
  }

  const runDetectionLoop = useCallback(() => {
    if (!detectingRef.current) return
    const video = localVideoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !handsRef.current) {
      animFrameRef.current = requestAnimationFrame(runDetectionLoop)
      return
    }
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    handsRef.current.send({ image: canvas })
      .then(() => { animFrameRef.current = requestAnimationFrame(runDetectionLoop) })
      .catch(() => { animFrameRef.current = requestAnimationFrame(runDetectionLoop) })
  }, [])

  const startDetection = async () => {
    if (detecting) {
      detectingRef.current = false
      setDetecting(false)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      sequenceRef.current = []
      setSignWord(null)
      setSignConfidence(0)
      return
    }
    await setupMediaPipe()
    detectingRef.current = true
    setDetecting(true)
    runDetectionLoop()
  }

  useEffect(() => {
    return () => {
      detectingRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
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
    pc.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0] }
    const callDoc = doc(collection(db, 'calls'))
    const offerCandidates = collection(callDoc, 'offerCandidates')
    const answerCandidates = collection(callDoc, 'answerCandidates')
    setCallId(callDoc.id)
    pc.onicecandidate = (event) => { if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON()) }
    const offerDescription = await pc.createOffer()
    await pc.setLocalDescription(offerDescription)
    await setDoc(callDoc, { offer: { sdp: offerDescription.sdp, type: offerDescription.type }, status: 'waiting', createdBy: userData?.name || 'User' })
    onSnapshot(collection(callDoc, 'messages'), (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt?.localeCompare(b.createdAt))
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
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
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
    pc.ontrack = (event) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0] }
    const callDoc = doc(db, 'calls', callId)
    const answerCandidates = collection(callDoc, 'answerCandidates')
    const offerCandidates = collection(callDoc, 'offerCandidates')
    pc.onicecandidate = (event) => { if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON()) }
    const callData = (await getDoc(callDoc)).data()
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer))
    const answerDescription = await pc.createAnswer()
    await pc.setLocalDescription(answerDescription)
    await setDoc(callDoc, { ...callData, answer: { type: answerDescription.type, sdp: answerDescription.sdp }, status: 'connected', joinedBy: userData?.name || 'User' })
    onSnapshot(collection(callDoc, 'messages'), (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt?.localeCompare(b.createdAt))
      setMessages(msgs)
    })
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data()
      if (data?.status === 'ended') { setFriendLeft(true); setStatus('ended'); pc.close(); localStreamRef.current?.getTracks().forEach(t => t.stop()) }
    })
    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
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

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = !track.enabled })
    setMicOn(prev => !prev)
  }

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(track => { track.enabled = !track.enabled })
    setCameraOn(prev => !prev)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true) }
    else { document.exitFullscreen(); setIsFullscreen(false) }
  }

  const shareScreen = async () => {
    if (sharing) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      const videoTrack = stream.getVideoTracks()[0]
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video')
      sender?.replaceTrack(videoTrack)
      setSharing(false)
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
      const screenTrack = screenStream.getVideoTracks()[0]
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video')
      sender?.replaceTrack(screenTrack)
      screenTrack.onended = () => shareScreen()
      setSharing(true)
    }
  }

  const endCall = async () => {
    detectingRef.current = false
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (callId) { try { await updateDoc(doc(db, 'calls', callId), { status: 'ended' }) } catch (e) {} }
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    router.push('/dashboard')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(callId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Control button helper ───────────────────────────────────────
  const CtrlBtn = ({ onClick, active, danger, icon, label }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        padding: '0.75rem 1rem',
        borderRadius: '16px',
        background: danger
          ? 'rgba(239,68,68,0.15)'
          : active
            ? 'rgba(59,130,246,0.2)'
            : 'rgba(255,255,255,0.06)',
        border: danger
          ? '1px solid rgba(239,68,68,0.3)'
          : active
            ? '1px solid rgba(59,130,246,0.35)'
            : '1px solid rgba(255,255,255,0.08)',
        color: danger ? '#fca5a5' : active ? '#93c5fd' : 'rgba(255,255,255,0.75)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '72px',
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.03em' }}>{label}</span>
    </button>
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 60%, #0d1f4a 100%)',
      color: 'white',
      paddingTop: '68px',
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Background glow */}
      <div aria-hidden style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.15rem',
              background: 'linear-gradient(135deg, #fff 0%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Appel vidéo
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              {status === 'idle' && 'Créez ou rejoignez un appel'}
              {status === 'calling' && '⏳ En attente d\'un ami...'}
              {status === 'joining' && '🔗 Connexion en cours...'}
              {status === 'connected' && '🟢 Connecté'}
              {status === 'ended' && 'Appel terminé'}
            </p>
          </div>
          {status !== 'idle' && status !== 'ended' && (
            <button onClick={endCall} style={{
              padding: '0.6rem 1.25rem', borderRadius: '12px',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              📵 Terminer
            </button>
          )}
        </div>

        {/* Friend Left Banner */}
        {friendLeft && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center',
          }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
              👋 Votre ami a quitté l'appel
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setFriendLeft(false); setStatus('idle'); setCallId('') }} style={{
                padding: '0.65rem 1.5rem', borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                color: 'white', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
              }}>
                🔄 Nouvel appel
              </button>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '0.65rem 1.5rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                }}>
                  🏠 Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Videos */}
        {(status === 'connected' || status === 'calling' || status === 'joining') && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
            marginBottom: '1.25rem', height: '400px',
          }}>
            {/* Local */}
            <div style={{
              position: 'relative', borderRadius: '20px', overflow: 'hidden',
              background: '#0a1230', border: '1px solid rgba(59,130,246,0.15)',
            }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600',
              }}>
                🟢 {userData?.name || 'Vous'}
              </div>
              {detecting && (
                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                  {signWord ? (
                    <div style={{
                      background: 'rgba(34,197,94,0.85)', backdropFilter: 'blur(4px)',
                      padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem',
                      fontWeight: '800', textAlign: 'center',
                    }}>
                      🤟 {signWord.toUpperCase()} — {signConfidence}%
                    </div>
                  ) : signConfidence > 0 ? (
                    <div style={{
                      background: 'rgba(234,179,8,0.8)', backdropFilter: 'blur(4px)',
                      padding: '0.4rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', textAlign: 'center',
                    }}>
                      Aucun signe ({signConfidence}%)
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      padding: '0.4rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem',
                      textAlign: 'center', color: 'rgba(255,255,255,0.5)',
                    }}>
                      👋 Montrez un signe...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Remote */}
            <div style={{
              position: 'relative', borderRadius: '20px', overflow: 'hidden',
              background: '#0a1230', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', bottom: '0.75rem', left: '0.75rem',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600',
              }}>
                {status === 'connected' ? '🟢 Ami' : '⏳ En attente...'}
              </div>
              {messages.filter(m => m.isSign).slice(-1).map(msg => (
                msg.sender !== userData?.name && (
                  <div key={msg.id} style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                    <div style={{
                      background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(4px)',
                      padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem',
                      fontWeight: '800', textAlign: 'center',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Controls bar */}
        {status === 'connected' && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '0.6rem',
            flexWrap: 'wrap', marginBottom: '1.5rem',
          }}>
            <CtrlBtn onClick={toggleMic} active={!micOn} danger={!micOn} icon={micOn ? '🎙️' : '🔇'} label={micOn ? 'Muet' : 'Son'} />
            <CtrlBtn onClick={toggleCamera} active={!cameraOn} danger={!cameraOn} icon={cameraOn ? '📹' : '📷'} label={cameraOn ? 'Cam off' : 'Cam on'} />
            <CtrlBtn onClick={shareScreen} active={sharing} icon="🖥️" label={sharing ? 'Arrêter' : 'Partager'} />
            <div style={{ position: 'relative' }}>
              <CtrlBtn onClick={() => setChatOpen(p => !p)} active={chatOpen} icon="💬" label="Chat" />
              {messages.length > 0 && !chatOpen && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: '700',
                  width: '18px', height: '18px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {messages.length}
                </span>
              )}
            </div>
            <CtrlBtn onClick={toggleFullscreen} icon={isFullscreen ? '🔲' : '⛶'} label={isFullscreen ? 'Quitter' : 'Plein écran'} />
            <CtrlBtn onClick={startDetection} active={detecting} icon="🤟" label={detecting ? 'Actif' : 'Détecter'} />
            <CtrlBtn onClick={endCall} danger icon="📵" label="Terminer" />
          </div>
        )}

        {/* Idle — create or join */}
        {status === 'idle' && !friendLeft && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Create */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '2rem', textAlign: 'center',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', margin: '0 auto 1rem',
              }}>📞</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>Créer un appel</h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Générez un ID et partagez-le avec votre ami.
              </p>
              <button onClick={createCall} style={{
                width: '100%', padding: '0.85rem', borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                color: 'white', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
              }}>
                Créer l'appel
              </button>
            </div>

            {/* Join */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '2rem', textAlign: 'center',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', margin: '0 auto 1rem',
              }}>🤝</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>Rejoindre un appel</h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', lineHeight: '1.6' }}>
                Collez l'ID partagé par votre ami.
              </p>
              <input
                type="text"
                placeholder="Coller l'ID ici..."
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem 1rem', marginBottom: '0.75rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button onClick={joinCall} style={{
                width: '100%', padding: '0.85rem', borderRadius: '14px',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#86efac', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
              }}>
                Rejoindre
              </button>
            </div>
          </div>
        )}

        {/* Waiting for friend */}
        {status === 'calling' && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', padding: '2rem', textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: '1rem' }}>
              ⏳ En attente d'un ami...
            </p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>
              Partagez cet ID avec votre ami :
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '0.75rem',
            }}>
              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#60a5fa', margin: 0, wordBreak: 'break-all' }}>
                {callId}
              </p>
            </div>
            <button onClick={handleCopy} style={{
              padding: '0.6rem 1.5rem', borderRadius: '12px',
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: copied ? '#86efac' : 'rgba(255,255,255,0.65)',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
            }}>
              {copied ? '✓ Copié !' : '📋 Copier l\'ID'}
            </button>
          </div>
        )}

      </div>

      {/* Floating Chat Panel */}
      {status === 'connected' && chatOpen && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          width: '320px', zIndex: 100,
          background: 'rgba(10,18,48,0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px',
          overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.03)',
          }}>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>💬 Chat</p>
            <button onClick={() => setChatOpen(false)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '1rem', cursor: 'pointer', lineHeight: 1,
            }}>✕</button>
          </div>

          <div style={{ height: '260px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {messages.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
                Aucun message...
              </p>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === userData?.name ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>{msg.sender}</span>
                <div style={{
                  padding: '0.45rem 0.85rem', borderRadius: '14px',
                  fontSize: '0.85rem', maxWidth: '220px', wordBreak: 'break-word',
                  background: msg.isSign
                    ? msg.sender === userData?.name ? 'rgba(34,197,94,0.2)' : 'rgba(124,58,237,0.2)'
                    : msg.sender === userData?.name ? 'rgba(37,99,235,0.35)' : 'rgba(255,255,255,0.08)',
                  border: msg.isSign
                    ? msg.sender === userData?.name ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(124,58,237,0.25)'
                    : '1px solid rgba(255,255,255,0.07)',
                  color: 'white',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', gap: '0.5rem',
          }}>
            <input
              type="text"
              placeholder="Écrire un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1, padding: '0.6rem 0.85rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: 'white', fontSize: '0.85rem', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button onClick={sendMessage} style={{
              padding: '0.6rem 0.9rem', borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
              color: 'white', fontSize: '0.9rem', cursor: 'pointer',
            }}>➤</button>
          </div>
        </div>
      )}
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