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
import { useSessionTracker } from '../../components/useSessionTracker'
import { useGestureDetector } from '../../components/useGestureDetector'
import { useVoiceSubtitles } from '../../components/useVoiceSubtitles'
import { usePlanLimits } from '../../components/usePlanLimits'
import PaywallModal from '../../components/PaywallModal'
import {
  buildPhraseEngine,
  subtitleStyle,
  SINGLE_SIGN_PHRASES,
  SUBTITLE_DURATION,
} from '../../components/PhraseEngine'
import {
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Maximize,
  Minimize,
  Hand,
  Globe,
  Captions,
  CaptionsOff,
  Copy,
  Check,
  Clock,
  Link2,
  UserRound,
  Users,
  LayoutGrid,
  RefreshCw,
  Home,
  X,
  Send,
  ChevronUp,
  Wifi,
  HandMetal,
  CircleDot,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import './call.css'

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]
}

function CallComponent() {
  const [user, setUser]               = useState(null)
  const [userData, setUserData]       = useState(null)

  const [callId, setCallId]           = useState('')
  const [status, setStatus]           = useState('idle')
  const { endSession } = useSessionTracker({ uid: user?.uid, type: 'call', active: status === 'connected' })

  const [friendLeft, setFriendLeft]   = useState(false)
  const [messages, setMessages]       = useState([])
  const [newMessage, setNewMessage]   = useState('')
  const [micOn, setMicOn]             = useState(true)
  const [cameraOn, setCameraOn]       = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sharing, setSharing]         = useState(false)
  const [detecting, setDetecting]     = useState(false)
  const [chatOpen, setChatOpen]       = useState(false)
  const [signWord, setSignWord]       = useState(null)
  const [signConfidence, setSignConf] = useState(0)
  const [copied, setCopied]           = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const [gestureSubtitle, setGestureSubtitle] = useState(null)
  const [pendingSigns, setPendingSigns]         = useState([])

  const localVideoRef   = useRef(null)
  const remoteVideoRef  = useRef(null)
  const pcRef           = useRef(null)
  const localStreamRef  = useRef(null)
  const messagesEndRef  = useRef(null)
  const router          = useRouter()

  const lastSignRef     = useRef(null)
  const callIdRef       = useRef('')
  const userDataRef     = useRef(null)
  const phraseEngineRef = useRef(buildPhraseEngine())
  const subtitleTimeout = useRef(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const { plan, minutesUsed, minutesLimit, canUse } = usePlanLimits({ uid: user?.uid, type: 'call' })

  useEffect(() => { callIdRef.current = callId },    [callId])
  useEffect(() => { userDataRef.current = userData }, [userData])

  // ── Auth ────────────────────────────────────────────────────
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

  // ── Voice subtitles hook ────────────────────────────────────
  const { 
    subtitle: voiceSubtitle, 
    startVoice, 
    stopVoice, 
    voiceActive,
    changeLanguage,
    selectedLang 
  } = useVoiceSubtitles()

  const sendVoiceSubtitleToChat = async (text, isFinal) => {
    const currentCallId   = callIdRef.current
    const currentUserData = userDataRef.current
    if (!currentCallId || !text || !isFinal) return
    try {
      await addDoc(collection(doc(db, 'calls', currentCallId), 'messages'), {
        text: `[voice] ${text}`,
        sender: currentUserData?.name || 'You',
        createdAt: new Date().toISOString(),
        isVoice: true,
      })
    } catch (e) { console.log('Send voice subtitle error:', e) }
  }

  useEffect(() => {
    if (voiceSubtitle && voiceSubtitle.isFinal && voiceSubtitle.text && status === 'connected') {
      sendVoiceSubtitleToChat(voiceSubtitle.text, voiceSubtitle.isFinal)
    }
  }, [voiceSubtitle, status])

  // ── Gesture callbacks ───────────────────────────────────────
  const handleNoHand = useCallback(() => {
    setSignWord(null)
    setSignConf(0)
  }, [])

  const handleDetected = useCallback((data) => {
    if (data.detected) {
      setSignWord(data.word)
      setSignConf(data.confidence)

      if (data.confidence > 60) {
        const result = phraseEngineRef.current.addSign(data.word)

        setGestureSubtitle({ text: result.phrase, type: result.type })
        setPendingSigns(result.type !== 'raw' ? [] : phraseEngineRef.current.getPending())

        if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current)
        subtitleTimeout.current = setTimeout(() => {
          setGestureSubtitle(null)
          setPendingSigns([])
          phraseEngineRef.current.clear()
        }, SUBTITLE_DURATION)

        if (lastSignRef.current !== data.word) {
          lastSignRef.current = data.word
          const chatText = result.type !== 'raw'
            ? `[sign] ${result.phrase}`
            : `[sign] ${data.word.toUpperCase()}`
          sendSignToChat(chatText)
          setTimeout(() => { lastSignRef.current = null }, 2000)
        }
      }
    } else {
      setSignWord(null)
      setSignConf(data.confidence || 0)
    }
  }, [])

  const sendSignToChat = async (text) => {
    const currentCallId   = callIdRef.current
    const currentUserData = userDataRef.current
    if (!currentCallId || !text) return
    try {
      await addDoc(collection(doc(db, 'calls', currentCallId), 'messages'), {
        text,
        sender: currentUserData?.name || 'You',
        createdAt: new Date().toISOString(),
        isSign: true,
      })
    } catch (e) { console.log('Send sign error:', e) }
  }

  // ── Gesture detector ─────────────────────────────────────────
  const { canvasRef, start, stop } = useGestureDetector({
    onDetected: handleDetected,
    onNoHand: handleNoHand,
  })

  const startDetection = async () => {
    if (detecting) {
      stop()
      setDetecting(false)
      setSignWord(null)
      setSignConf(0)
      setGestureSubtitle(null)
      setPendingSigns([])
      phraseEngineRef.current.clear()
      return
    }
    await start(localVideoRef)
    setDetecting(true)
  }

  useEffect(() => {
    return () => {
      stop()
      if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current)
    }
  }, [])

  // ── Camera / WebRTC ─────────────────────────────────────────
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    return stream
  }

  const createCall = async () => {
    if (!canUse) { setShowPaywall(true); return }
    setStatus('calling')
    const stream = await startCamera()
    const pc = new RTCPeerConnection(servers)
    pcRef.current = pc
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0] }
    const callDoc          = doc(collection(db, 'calls'))
    const offerCandidates  = collection(callDoc, 'offerCandidates')
    const answerCandidates = collection(callDoc, 'answerCandidates')
    setCallId(callDoc.id)
    pc.onicecandidate = (e) => { if (e.candidate) addDoc(offerCandidates, e.candidate.toJSON()) }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await setDoc(callDoc, { offer: { sdp: offer.sdp, type: offer.type }, status: 'waiting', createdBy: userData?.name || 'User' })
    onSnapshot(collection(callDoc, 'messages'), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt?.localeCompare(b.createdAt)))
    })
    onSnapshot(callDoc, (snap) => {
      const data = snap.data()
      if (!pc.currentRemoteDescription && data?.answer) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        setStatus('connected'); setFriendLeft(false)
      }
      if (data?.status === 'ended') {
        setFriendLeft(true); setStatus('ended')
        pc.close(); localStreamRef.current?.getTracks().forEach(t => t.stop())
      }
    })
    onSnapshot(answerCandidates, (snap) => {
      snap.docChanges().forEach(ch => {
        if (ch.type === 'added') pc.addIceCandidate(new RTCIceCandidate(ch.doc.data()))
      })
    })
  }

  const joinCall = async () => {
    if (!callId.trim()) return
    if (!canUse) { setShowPaywall(true); return }
    setStatus('joining')
    const stream = await startCamera()
    const pc = new RTCPeerConnection(servers)
    pcRef.current = pc
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0] }
    const callDoc          = doc(db, 'calls', callId)
    const answerCandidates = collection(callDoc, 'answerCandidates')
    const offerCandidates  = collection(callDoc, 'offerCandidates')
    pc.onicecandidate = (e) => { if (e.candidate) addDoc(answerCandidates, e.candidate.toJSON()) }
    const callData = (await getDoc(callDoc)).data()
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await setDoc(callDoc, { ...callData, answer: { type: answer.type, sdp: answer.sdp }, status: 'connected', joinedBy: userData?.name || 'User' })
    onSnapshot(collection(callDoc, 'messages'), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt?.localeCompare(b.createdAt)))
    })
    onSnapshot(callDoc, (snap) => {
      const data = snap.data()
      if (data?.status === 'ended') { setFriendLeft(true); setStatus('ended'); pc.close(); localStreamRef.current?.getTracks().forEach(t => t.stop()) }
    })
    onSnapshot(offerCandidates, (snap) => {
      snap.docChanges().forEach(ch => {
        if (ch.type === 'added') pc.addIceCandidate(new RTCIceCandidate(ch.doc.data()))
      })
    })
    setStatus('connected')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !callId) return
    await addDoc(collection(doc(db, 'calls', callId), 'messages'), {
      text: newMessage, sender: userData?.name || 'User', createdAt: new Date().toISOString(),
    })
    setNewMessage('')
  }

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(p => !p)
  }

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCameraOn(p => !p)
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
      pcRef.current?.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(stream.getVideoTracks()[0])
      setSharing(false)
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
      const screenTrack = screenStream.getVideoTracks()[0]
      pcRef.current?.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(screenTrack)
      screenTrack.onended = () => shareScreen()
      setSharing(true)
    }
  }

  const endCall = async () => {
    stop()
    stopVoice()
    if (callId) { try { await updateDoc(doc(db, 'calls', callId), { status: 'ended' }) } catch (e) {} }
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    await endSession()
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

  // ── Helper: derive bubble className ─────────────────────────
  const getBubbleClass = (msg) => {
    const isSelf = msg.sender === userData?.name
    if (msg.isSign) return isSelf ? 'call-chat__msg-bubble--sign-self' : 'call-chat__msg-bubble--sign-other'
    if (msg.isVoice) return isSelf ? 'call-chat__msg-bubble--voice-self' : 'call-chat__msg-bubble--voice-other'
    return isSelf ? 'call-chat__msg-bubble--text-self' : 'call-chat__msg-bubble--text-other'
  }

  // ── Control button sub-component ────────────────────────────
  const CtrlBtn = ({ onClick, active, danger, icon, label }) => (
    <button
      onClick={onClick}
      className={`call-ctrl-btn ${danger ? 'call-ctrl-btn--danger' : active ? 'call-ctrl-btn--active' : 'call-ctrl-btn--default'}`}
    >
      <span className="call-ctrl-btn__icon">{icon}</span>
      <span className="call-ctrl-btn__label">{label}</span>
    </button>
  )

  return (
    <main className="call-page">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Background glow */}
      <div aria-hidden className="call-bg-glow" />

      <div className="call-container">

        {/* Header */}
        <div className="call-header">
          <div>
            <h1 className="call-header__title">Appel vidéo</h1>
            <p className="call-header__status">
              {status === 'idle'      && 'Créez ou rejoignez un appel'}
              {status === 'calling'   && (
                <span className="call-status-row">
                  <Loader2 size={13} className="call-status-spin" /> En attente d'un ami...
                </span>
              )}
              {status === 'joining'   && (
                <span className="call-status-row">
                  <Link2 size={13} /> Connexion en cours...
                </span>
              )}
              {status === 'connected' && (
                <span className="call-status-row">
                  <CircleDot size={13} className="call-status-dot--green" /> Connecté
                </span>
              )}
              {status === 'ended'     && 'Appel terminé'}
            </p>
          </div>
          {status !== 'idle' && status !== 'ended' && (
            <button onClick={endCall} className="call-header__end-btn">
              <PhoneOff size={15} strokeWidth={2.2} /> Terminer
            </button>
          )}
        </div>

        {/* Friend left banner */}
        {friendLeft && (
          <div className="call-friend-left">
            <p className="call-friend-left__title">
              <PhoneMissed size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Votre ami a quitté l'appel
            </p>
            <div className="call-friend-left__actions">
              <button
                onClick={() => { setFriendLeft(false); setStatus('idle'); setCallId('') }}
                className="call-friend-left__btn--new"
              >
                <RefreshCw size={15} strokeWidth={2.5} /> Nouvel appel
              </button>
              <Link href="/dashboard" className="call-friend-left__btn--dashboard">
                <Home size={15} strokeWidth={2} /> Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Videos */}
        {(status === 'connected' || status === 'calling' || status === 'joining') && (
          <div className="call-videos">

            {/* Local video */}
            <div className="call-video-tile call-video-tile--local">
              <video ref={localVideoRef} autoPlay muted playsInline />

              {/* Name tag */}
              <div
                className="call-video-tile__nametag"
                style={{ bottom: gestureSubtitle ? '56px' : '0.75rem' }}
              >
                <CircleDot size={10} className="call-nametag-dot" />
                {userData?.name || 'Vous'}
              </div>

              {/* Gesture subtitle */}
              {gestureSubtitle && (
                <div
                  className="call-video-tile__subtitle"
                  style={{
                    background: subtitleStyle(gestureSubtitle.type).bg,
                    borderTop: `1px solid ${subtitleStyle(gestureSubtitle.type).border}`,
                  }}
                >
                  <HandMetal size={16} className="call-video-tile__subtitle-icon" />
                  <span className="call-video-tile__subtitle-text">{gestureSubtitle.text}</span>
                  <span className="call-video-tile__subtitle-tag">
                    {gestureSubtitle.type === 'combo'  && 'COMBO'}
                    {gestureSubtitle.type === 'single' && 'PHRASE'}
                    {gestureSubtitle.type === 'raw'    && 'SIGNE'}
                  </span>
                </div>
              )}

              {/* Pending combo signs */}
              {detecting && pendingSigns.length > 0 && !gestureSubtitle && (
                <div className="call-video-tile__pending">
                  {pendingSigns.map((s, i) => (
                    <span key={i} className="call-video-tile__pending-sign">{s}</span>
                  ))}
                  <span className="call-video-tile__pending-dots">...</span>
                </div>
              )}

              {/* Detection badge */}
              {detecting && (
                <div className="call-video-tile__detection">
                  {signWord ? (
                    <div className="call-detection-badge call-detection-badge--detected">
                      <HandMetal size={14} /> {signWord.toUpperCase()} — {signConfidence}%
                    </div>
                  ) : signConfidence > 0 ? (
                    <div className="call-detection-badge call-detection-badge--low">
                      Aucun signe ({signConfidence}%)
                    </div>
                  ) : (
                    <div className="call-detection-badge call-detection-badge--idle">
                      <Hand size={13} /> Montrez un signe...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Remote video */}
            <div className="call-video-tile call-video-tile--remote">
              <video ref={remoteVideoRef} autoPlay playsInline />
              <div className="call-video-tile__nametag" style={{ bottom: '0.75rem' }}>
                {status === 'connected'
                  ? <><CircleDot size={10} className="call-nametag-dot" /> Ami</>
                  : <><Loader2 size={10} className="call-status-spin" /> En attente...</>
                }
              </div>
              
              {/* Remote voice subtitle */}
              {messages.filter(m => m.isVoice).slice(-1).map(msg =>
                msg.sender !== userData?.name && (
                  <div key={msg.id} className="call-video-tile__remote-voice">
                    <Mic size={13} style={{ flexShrink: 0 }} />
                    {msg.text.replace('[voice] ', '')}
                  </div>
                )
              )}
              
              {/* Remote sign overlay */}
              {messages.filter(m => m.isSign).slice(-1).map(msg =>
                msg.sender !== userData?.name && (
                  <div key={msg.id} className="call-video-tile__remote-sign">
                    <div className="call-video-tile__remote-sign-inner">
                      <HandMetal size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                      {msg.text.replace('[sign] ', '')}
                    </div>
                  </div>
                )
              )}
              
              {friendLeft && (
                <div className="call-video-tile__left-overlay">
                  <p><PhoneMissed size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />L'ami a quitté</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        {status === 'connected' && (
          <div className="call-controls">
            <CtrlBtn
              onClick={toggleMic}
              active={!micOn}
              danger={!micOn}
              icon={micOn ? <Mic size={20} /> : <MicOff size={20} />}
              label={micOn ? 'Muet' : 'Son'}
            />
            <CtrlBtn
              onClick={toggleCamera}
              active={!cameraOn}
              danger={!cameraOn}
              icon={cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              label={cameraOn ? 'Cam off' : 'Cam on'}
            />
            <CtrlBtn
              onClick={shareScreen}
              active={sharing}
              icon={sharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
              label={sharing ? 'Arrêter' : 'Partager'}
            />
            <div className="call-ctrl-wrapper">
              <CtrlBtn
                onClick={() => setChatOpen(p => !p)}
                active={chatOpen}
                icon={<MessageSquare size={20} />}
                label="Chat"
              />
              {messages.length > 0 && !chatOpen && (
                <span className="call-ctrl-badge">{messages.length}</span>
              )}
            </div>
            <CtrlBtn
              onClick={toggleFullscreen}
              icon={isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              label={isFullscreen ? 'Quitter' : 'Plein écran'}
            />
            <CtrlBtn
              onClick={startDetection}
              active={detecting}
              icon={<HandMetal size={20} />}
              label={detecting ? 'Actif' : 'Détecter'}
            />
            
            {/* Language selector with dropdown */}
            <div className="call-ctrl-wrapper">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="call-ctrl-btn call-ctrl-btn--default"
              >
                <span className="call-ctrl-btn__icon"><Globe size={20} /></span>
                <span className="call-ctrl-btn__label">{selectedLang === 'en-US' ? 'EN' : 'AR'}</span>
              </button>
              {showLangMenu && (
                <div className="call-lang-menu" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => { changeLanguage('en-US'); setShowLangMenu(false); }}
                    className={selectedLang === 'en-US' ? 'call-lang-menu__active' : ''}
                  >
                    🇬🇧 English
                  </button>
                  <button 
                    onClick={() => { changeLanguage('ar-EG'); setShowLangMenu(false); }}
                    className={selectedLang === 'ar-EG' ? 'call-lang-menu__active' : ''}
                  >
                    🇸🇦 العربية
                  </button>
                </div>
              )}
            </div>
            
            <CtrlBtn
              onClick={voiceActive ? stopVoice : startVoice}
              active={voiceActive}
              icon={voiceActive ? <Captions size={20} /> : <CaptionsOff size={20} />}
              label={voiceActive ? 'Sous-titres ON' : 'Sous-titres OFF'}
            />
            <CtrlBtn
              onClick={endCall}
              danger
              icon={<PhoneOff size={20} />}
              label="Terminer"
            />
          </div>
        )}

        {/* Idle — Create / Join */}
        {status === 'idle' && !friendLeft && (
          <div className="call-idle-grid">

            {/* Create */}
            <div className="call-idle-card">
              <div className="call-idle-card__icon call-idle-card__icon--blue">
                <PhoneCall size={26} color="#60a5fa" strokeWidth={1.8} />
              </div>
              <h3 className="call-idle-card__title">Créer un appel</h3>
              <p className="call-idle-card__desc">Générez un ID et partagez-le avec votre ami.</p>
              <button onClick={createCall} className="call-idle-card__btn call-idle-card__btn--create">
                Créer l'appel
              </button>
            </div>

            {/* Join */}
            <div className="call-idle-card">
              <div className="call-idle-card__icon call-idle-card__icon--green">
                <Link2 size={26} color="#4ade80" strokeWidth={1.8} />
              </div>
              <h3 className="call-idle-card__title">Rejoindre un appel</h3>
              <p className="call-idle-card__desc call-idle-card__desc--join">
                Collez l'ID partagé par votre ami.
              </p>
              <input
                type="text"
                placeholder="Coller l'ID ici..."
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                className="call-idle-card__input"
              />
              <button onClick={joinCall} className="call-idle-card__btn call-idle-card__btn--join">
                Rejoindre
              </button>
            </div>
          </div>
        )}

        {/* Waiting */}
        {status === 'calling' && (
          <div className="call-waiting">
            <p className="call-waiting__label">
              <Loader2 size={15} className="call-status-spin" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              En attente d'un ami...
            </p>
            <p className="call-waiting__id-label">Partagez cet ID :</p>
            <div className="call-waiting__id-box">
              <p className="call-waiting__id-text">{callId}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`call-waiting__copy-btn ${copied ? 'call-waiting__copy-btn--copied' : 'call-waiting__copy-btn--default'}`}
            >
              {copied
                ? <><Check size={15} strokeWidth={2.5} /> Copié !</>
                : <><Copy size={15} /> Copier l'ID</>
              }
            </button>
          </div>
        )}

      </div>

      {/* ── Voice subtitle bar ── */}
      {voiceSubtitle && (
        <div className={`call-voice-subtitle ${voiceSubtitle.isFinal ? 'call-voice-subtitle--final' : 'call-voice-subtitle--interim'}`}>
          <Mic size={14} className="call-voice-subtitle__mic-icon" />
          <span className="call-voice-subtitle__text">{voiceSubtitle.text}</span>
        </div>
      )}

      {/* Floating Chat */}
      {status === 'connected' && chatOpen && (
        <div className="call-chat">
          <div className="call-chat__header">
            <p className="call-chat__header-title">
              <MessageSquare size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Chat
            </p>
            <button onClick={() => setChatOpen(false)} className="call-chat__close-btn">
              <X size={16} />
            </button>
          </div>

          <div className="call-chat__messages">
            {messages.length === 0 && (
              <p className="call-chat__empty">Aucun message...</p>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`call-chat__msg ${msg.sender === userData?.name ? 'call-chat__msg--self' : 'call-chat__msg--other'}`}
              >
                <span className="call-chat__msg-sender">{msg.sender}</span>
                <div className={`call-chat__msg-bubble ${getBubbleClass(msg)}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="call-chat__footer">
            <input
              type="text"
              placeholder="Écrire un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="call-chat__input"
            />
            <button onClick={sendMessage} className="call-chat__send-btn">
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          type="call"
          minutesUsed={minutesUsed}
          minutesLimit={minutesLimit}
          plan={plan}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </main>
  )
}

export default function CallPage() {
  return <Suspense><CallComponent /></Suspense>
}