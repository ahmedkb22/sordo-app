'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { auth } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSessionTracker } from '../../components/useSessionTracker'

import {
  ArrowLeft,
  Dumbbell,
  Camera,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Hand,
  HandMetal,
  Square,
  ClipboardList,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useGestureDetector } from '../../components/useGestureDetector'
import {
  buildPhraseEngine,
  subtitleStyle,
  SUBTITLE_DURATION,
} from '../../components/PhraseEngine'
import './entrainement.css'

export default function EntrainementPage() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)


  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [streamStarted, setStreamStarted] = useState(false)

  const [detecting, setDetecting] = useState(false)
  const { endSession } = useSessionTracker({ uid: user?.uid, type: 'entrainement', active: detecting })

  const [signWord, setSignWord] = useState(null)
  const [signConfidence, setSignConf] = useState(0)

  const [gestureSubtitle, setGestureSubtitle] = useState(null)
  const [pendingSigns, setPendingSigns] = useState([])
  const [detectionLog, setDetectionLog] = useState([])



  const videoRef = useRef(null)
  const localStreamRef = useRef(null)
  const subtitleTimeout = useRef(null)
  const phraseEngineRef = useRef(buildPhraseEngine())
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login')
      else {
        setUser(u)
        setReady(true)
      }
    })

    return () => unsub()
  }, [router])

  const handleDetected = useCallback((data) => {
    if (data.detected) {
      setSignWord(data.word)
      setSignConf(data.confidence)

      if (data.confidence > 60) {
        const result = phraseEngineRef.current.addSign(data.word)

        setGestureSubtitle({ text: result.phrase, type: result.type })
        setPendingSigns(result.type !== 'raw' ? [] : phraseEngineRef.current.getPending())

        setDetectionLog((prev) => [
          {
            word: data.word,
            phrase: result.phrase,
            type: result.type,
            confidence: data.confidence,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 20))

        if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current)

        subtitleTimeout.current = setTimeout(() => {
          setGestureSubtitle(null)
          setPendingSigns([])
          phraseEngineRef.current.clear()
        }, SUBTITLE_DURATION)
      }
    } else {
      setSignWord(null)
      setSignConf(data.confidence || 0)
    }
  }, [])

  const handleNoHand = useCallback(() => {
    setSignWord(null)
    setSignConf(0)
  }, [])

  const { canvasRef, start, stop } = useGestureDetector({
    onDetected: handleDetected,
    onNoHand: handleNoHand,
  })

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraOn(true)
      setStreamStarted(true)
    } catch (e) {
      console.log('Camera error:', e)
    }
  }

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled
    })

    setCameraOn((prev) => !prev)
  }

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled
    })

    setMicOn((prev) => !prev)
  }

  const toggleDetection = async () => {
    if (!streamStarted) {
      await startCamera()
    }

    if (detecting) {
      stop()
      setDetecting(false)
      setSignWord(null)
      setSignConf(0)
      setGestureSubtitle(null)
      setPendingSigns([])
      phraseEngineRef.current.clear()
    } else {
      await start(videoRef)
      setDetecting(true)
    }
  }

  useEffect(() => {
    return () => {
      stop()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())

      if (subtitleTimeout.current) {
        clearTimeout(subtitleTimeout.current)
      }
    }
  }, [])

  const typeLabel = (type) => {
    if (type === 'combo') return { label: 'COMBO', color: '#a78bfa' }
    if (type === 'single') return { label: 'PHRASE', color: '#4ade80' }

    return { label: 'SIGNE', color: '#60a5fa' }
  }

const handleStopAll = async () => {
    stop()

    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    await endSession()

    setStreamStarted(false)
    setCameraOn(false)
    setDetecting(false)
    setSignWord(null)
    setGestureSubtitle(null)
    setPendingSigns([])
    phraseEngineRef.current.clear()
    

  }

  if (!ready) {
    return (
      <main className="entr-loading">
        <Loader2 className="entr-loading-icon" size={42} />
      </main>
    )
  }

  return (
    <main className="entr-page">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div aria-hidden className="entr-bg-glow" />

      <div className="entr-container">
        <div className="entr-header">
          <div>
            <h1 className="entr-header__title">
              <Dumbbell size={26} />
              Mode Entraînement
            </h1>

            <p className="entr-header__subtitle">
              Testez la détection de signes sans appel
            </p>
          </div>

          <Link href="/dashboard" className="entr-header__back-btn">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>

        <div className="entr-grid">
          <div className="entr-video-col">
            <div className="entr-camera-tile">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ display: streamStarted ? 'block' : 'none' }}
              />

              {!streamStarted && (
                <div className="entr-camera-placeholder">
                  <Camera size={48} className="entr-camera-placeholder__icon" />
                  <p className="entr-camera-placeholder__text">
                    Cliquez sur Démarrer pour activer la caméra
                  </p>
                </div>
              )}

              {detecting && (
                <div className="entr-detection-area">
                  {signWord ? (
                    <div className="entr-detection-badge entr-detection-badge--detected">
                      <HandMetal size={15} />
                      {signWord.toUpperCase()} — {signConfidence}%
                    </div>
                  ) : signConfidence > 0 ? (
                    <div className="entr-detection-badge entr-detection-badge--low">
                      Aucun signe ({signConfidence}%)
                    </div>
                  ) : (
                    <div className="entr-detection-badge entr-detection-badge--idle">
                      <Hand size={14} />
                      Montrez un signe...
                    </div>
                  )}
                </div>
              )}

              {detecting && pendingSigns.length > 0 && !gestureSubtitle && (
                <div
                  className="entr-pending"
                  style={{ bottom: gestureSubtitle ? '56px' : '0.75rem' }}
                >
                  {pendingSigns.map((s, i) => (
                    <span key={i} className="entr-pending__sign">
                      {s}
                    </span>
                  ))}
                  <span className="entr-pending__dots">...</span>
                </div>
              )}

              {gestureSubtitle && (
                <div
                  className="entr-subtitle"
                  style={{
                    background: subtitleStyle(gestureSubtitle.type).bg,
                    borderTop: `1px solid ${subtitleStyle(gestureSubtitle.type).border}`,
                  }}
                >
                  <HandMetal size={16} className="entr-subtitle__icon" />
                  <span className="entr-subtitle__text">{gestureSubtitle.text}</span>
                  <span className="entr-subtitle__tag">
                    {gestureSubtitle.type === 'combo' && 'COMBO'}
                    {gestureSubtitle.type === 'single' && 'PHRASE'}
                    {gestureSubtitle.type === 'raw' && 'SIGNE'}
                  </span>
                </div>
              )}
            </div>

            <div className="entr-controls">
              {!streamStarted && (
                <button onClick={startCamera} className="entr-start-btn">
                  <Video size={17} />
                  Démarrer la caméra
                </button>
              )}

              {streamStarted && (
                <>
                  <CtrlBtn
                    onClick={toggleCamera}
                    active={!cameraOn}
                    danger={!cameraOn}
                    icon={cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                    label={cameraOn ? 'Cam' : 'Cam off'}
                  />

                  <CtrlBtn
                    onClick={toggleMic}
                    active={!micOn}
                    danger={!micOn}
                    icon={micOn ? <Mic size={20} /> : <MicOff size={20} />}
                    label={micOn ? 'Micro' : 'Muet'}
                  />

                  <CtrlBtn
                    onClick={toggleDetection}
                    active={detecting}
                    icon={<HandMetal size={20} />}
                    label={detecting ? 'Détection ON' : 'Détecter'}
                  />

                  <CtrlBtn
                    onClick={handleStopAll}
                    danger
                    icon={<Square size={20} />}
                    label="Arrêter"
                  />
                </>
              )}
            </div>
          </div>

          <div className="entr-log">
            <div className="entr-log__header">
              <p className="entr-log__header-title">
                <ClipboardList size={16} />
                Détections
              </p>

              {detectionLog.length > 0 && (
                <button onClick={() => setDetectionLog([])} className="entr-log__clear-btn">
                  <Trash2 size={14} />
                  Effacer
                </button>
              )}
            </div>

            <div className="entr-log__list">
              {detectionLog.length === 0 && (
                <div className="entr-log__empty">
                  <div className="entr-log__empty-icon">
                    <HandMetal size={40} />
                  </div>

                  <p className="entr-log__empty-text">
                    Les signes détectés apparaîtront ici
                  </p>
                </div>
              )}

              {detectionLog.map((entry, i) => {
                const t = typeLabel(entry.type)

                return (
                  <div key={i} className="entr-log__entry">
                    <div className="entr-log__entry-top">
                      <span
                        className="entr-log__entry-badge"
                        style={{
                          color: t.color,
                          background: `${t.color}20`,
                        }}
                      >
                        {t.label}
                      </span>

                      <span className="entr-log__entry-time">{entry.time}</span>
                    </div>

                    <p className="entr-log__entry-word">
                      <HandMetal size={13} />
                      {entry.word.toUpperCase()} — {entry.confidence.toFixed(1)}%
                    </p>

                    <p className="entr-log__entry-phrase">"{entry.phrase}"</p>
                  </div>
                )
              })}
            </div>

            <div className="entr-log__statusbar">
              <span className="entr-log__status-item">
                <span
                  className={`entr-log__status-dot ${
                    streamStarted
                      ? 'entr-log__status-dot--camera-on'
                      : 'entr-log__status-dot--camera-off'
                  }`}
                />
                Caméra
              </span>

              <span className="entr-log__status-item">
                <span
                  className={`entr-log__status-dot ${
                    detecting
                      ? 'entr-log__status-dot--detect-on'
                      : 'entr-log__status-dot--detect-off'
                  }`}
                />
                Détection
              </span>

              <span className="entr-log__count">
                {detectionLog.length} signe{detectionLog.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function CtrlBtn({ onClick, active, danger, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`entr-ctrl-btn ${
        danger
          ? 'entr-ctrl-btn--danger'
          : active
            ? 'entr-ctrl-btn--active'
            : 'entr-ctrl-btn--default'
      }`}
    >
      <span className="entr-ctrl-btn__icon">{icon}</span>
      <span className="entr-ctrl-btn__label">{label}</span>
    </button>
  )
}