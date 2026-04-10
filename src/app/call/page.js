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
const SUBTITLE_DURATION = 4000 // 4 secondes

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
  
  // Nouveaux états pour les sous-titres
  const [subtitles, setSubtitles] = useState([])
  const [isListening, setIsListening] = useState(false)

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
  
  // Nouveaux refs pour la reconnaissance vocale
  const recognitionRef = useRef(null)
  const subtitleTimeoutRef = useRef(null)

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

  // Configuration de la reconnaissance vocale
  const setupSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US' // Anglais

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      const newText = finalTranscript || interimTranscript
      
      if (newText.trim()) {
        const newSubtitle = {
          id: Date.now(),
          text: newText.trim(),
          timestamp: Date.now()
        }
        
        setSubtitles(prev => {
          // Garder seulement les sous-titres récents (moins de 4 secondes)
          const filtered = prev.filter(sub => Date.now() - sub.timestamp < SUBTITLE_DURATION)
          return [...filtered, newSubtitle]
        })

        // Nettoyer automatiquement après 4 secondes
        setTimeout(() => {
          setSubtitles(prev => prev.filter(sub => sub.id !== newSubtitle.id))
        }, SUBTITLE_DURATION)
      }
    }

    recognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        // Redémarrer automatiquement si pas de parole détectée
        if (isListening) {
          setTimeout(() => {
            try {
              recognition.start()
            } catch (e) {
              console.log('Recognition restart error:', e)
            }
          }, 100)
        }
      }
    }

    recognition.onend = () => {
      // Redémarrer automatiquement si l'écoute est toujours active
      if (isListening) {
        try {
          recognition.start()
        } catch (e) {
          console.log('Recognition restart error:', e)
        }
      }
    }

    recognitionRef.current = recognition
  }, [isListening])

  // Démarrer/arrêter l'écoute
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setupSpeechRecognition()
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setSubtitles([])
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.log('Error starting recognition:', e)
      }
    }
  }, [isListening, setupSpeechRecognition])

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current)
      }
    }
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
    setIsFullscreen(prev => !prev)
  }

  const endCall = async () => {
    if (callId) {
      const callDoc = doc(db, 'calls', callId)
      await updateDoc(callDoc, { status: 'ended' })
    }
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    setStatus('idle')
    setCallId('')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const copyCallId = () => {
    navigator.clipboard.writeText(callId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareScreen = async () => {
    if (sharing) {
      const videoTrack = localStreamRef.current?.getVideoTracks()[0]
      if (videoTrack) {
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(videoTrack)
      }
      setSharing(false)
      return
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = screenStream.getVideoTracks()[0]
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video')
      if (sender) sender.replaceTrack(screenTrack)
      setSharing(true)
      screenTrack.onended = () => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0]
        if (videoTrack && sender) sender.replaceTrack(videoTrack)
        setSharing(false)
      }
    } catch (e) { console.log('Screen share error:', e) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SignConnect
          </h1>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {status === 'idle' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Start a Call</h2>
              <button
                onClick={createCall}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Create New Call
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Join a Call</h2>
              <input
                type="text"
                placeholder="Enter Call ID"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={joinCall}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                Join Call
              </button>
            </div>
          </div>
        )}

        {(status === 'calling' || status === 'joining' || status === 'connected') && (
          <div className="space-y-6">
            {status === 'calling' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">Call ID:</p>
                    <p className="text-2xl font-mono text-indigo-600">{callId}</p>
                  </div>
                  <button
                    onClick={copyCallId}
                    className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    {copied ? '✓ Copied!' : 'Copy ID'}
                  </button>
                </div>
              </div>
            )}

            <div className={`grid ${chatOpen ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}>
              {/* Local Video avec sous-titres */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                  <p className="text-white font-semibold">You</p>
                </div>
                
                {/* Sous-titres en temps réel */}
                {subtitles.length > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 px-4 py-3 rounded-lg">
                    <p className="text-white text-center text-lg font-semibold leading-relaxed">
                      {subtitles[subtitles.length - 1].text}
                    </p>
                  </div>
                )}

                {signWord && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl">
                    <p className="text-3xl font-bold">🤟 {signWord.toUpperCase()}</p>
                    <p className="text-sm mt-1">Confidence: {signConfidence.toFixed(1)}%</p>
                  </div>
                )}
              </div>

              {/* Remote Video */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                  <p className="text-white font-semibold">Friend</p>
                </div>
                {friendLeft && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <p className="text-white text-xl font-semibold">Friend left the call</p>
                  </div>
                )}
              </div>

              {/* Chat Panel */}
              {chatOpen && (
                <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Chat</h3>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.isSign
                            ? 'bg-indigo-100 border-l-4 border-indigo-600'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="font-semibold text-sm text-gray-600">{msg.sender}</p>
                        <p className="text-gray-800">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={toggleMic}
                  className={`p-4 rounded-full ${
                    micOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'
                  } transition-colors`}
                >
                  <span className="text-2xl">{micOn ? '🎤' : '🔇'}</span>
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-4 rounded-full ${
                    cameraOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'
                  } transition-colors`}
                >
                  <span className="text-2xl">{cameraOn ? '📹' : '📷'}</span>
                </button>

                <button
                  onClick={startDetection}
                  className={`p-4 rounded-full ${
                    detecting ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                >
                  <span className="text-2xl">🤟</span>
                </button>

                <button
                  onClick={toggleListening}
                  className={`p-4 rounded-full ${
                    isListening ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                  title={isListening ? 'Stop Voice Recognition' : 'Start Voice Recognition'}
                >
                  <span className="text-2xl">{isListening ? '🎙️' : '🔴'}</span>
                </button>

                <button
                  onClick={shareScreen}
                  className={`p-4 rounded-full ${
                    sharing ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                >
                  <span className="text-2xl">🖥️</span>
                </button>

                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="p-4 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  <span className="text-2xl">💬</span>
                </button>

                <button
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <span className="text-2xl">📞</span>
                </button>
              </div>
              
              {isListening && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-green-600 font-semibold flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Voice recognition active
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CallPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallComponent />
    </Suspense>
  )
}