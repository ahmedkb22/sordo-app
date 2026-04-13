'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { auth } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGestureDetector } from '../../components/useGestureDetector'
import {
  buildPhraseEngine,
  subtitleStyle,
  SUBTITLE_DURATION,
} from '../../components/PhraseEngine'
import './entrainement.css'

export default function EntrainementPage() {
  const [user, setUser]               = useState(null)
  const [ready, setReady]             = useState(false)

  // Camera / mic
  const [cameraOn, setCameraOn]       = useState(false)
  const [micOn, setMicOn]             = useState(true)
  const [streamStarted, setStreamStarted] = useState(false)

  // Detection
  const [detecting, setDetecting]     = useState(false)
  const [signWord, setSignWord]       = useState(null)
  const [signConfidence, setSignConf] = useState(0)

  // Subtitles / phrase
  const [gestureSubtitle, setGestureSubtitle] = useState(null)
  const [pendingSigns, setPendingSigns]         = useState([])

  // History log for training feedback
  const [detectionLog, setDetectionLog] = useState([])

  const videoRef        = useRef(null)
  const localStreamRef  = useRef(null)
  const subtitleTimeout = useRef(null)
  const phraseEngineRef = useRef(buildPhraseEngine())
  const router          = useRouter()

  // ── Auth ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login')
      else { setUser(u); setReady(true) }
    })
    return () => unsub()
  }, [])

  // ── Gesture detector hook ───────────────────────────────────
  const handleDetected = useCallback((data) => {
    if (data.detected) {
      setSignWord(data.word)
      setSignConf(data.confidence)

      if (data.confidence > 75) {
        const result = phraseEngineRef.current.addSign(data.word)

        setGestureSubtitle({ text: result.phrase, type: result.type })
        setPendingSigns(result.type !== 'raw' ? [] : phraseEngineRef.current.getPending())

        // Log for training feedback
        setDetectionLog(prev => [{
          word: data.word,
          phrase: result.phrase,
          type: result.type,
          confidence: data.confidence,
          time: new Date().toLocaleTimeString(),
        }, ...prev].slice(0, 20))

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

  // ── Camera ─────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
      setStreamStarted(true)
    } catch (e) {
      console.log('Camera error:', e)
    }
  }

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCameraOn(prev => !prev)
  }

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(prev => !prev)
  }

  // ── Detection ───────────────────────────────────────────────
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

  // ── Cleanup ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stop()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current)
    }
  }, [])

  const typeLabel = (type) => {
    if (type === 'combo')  return { label: 'COMBO',  color: '#a78bfa' }
    if (type === 'single') return { label: 'PHRASE', color: '#4ade80' }
    return                        { label: 'SIGNE',  color: '#60a5fa' }
  }

  const handleStopAll = () => {
    stop()
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    setStreamStarted(false)
    setCameraOn(false)
    setDetecting(false)
    setSignWord(null)
    setGestureSubtitle(null)
    setPendingSigns([])
    phraseEngineRef.current.clear()
  }

  if (!ready) return (
    <main className="entr-loading">
      <div className="entr-spinner" />
    </main>
  )

  return (
    <main className="entr-page">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Background glow */}
      <div aria-hidden className="entr-bg-glow" />

      <div className="entr-container">

        {/* Header */}
        <div className="entr-header">
          <div>
            <h1 className="entr-header__title">🏋️ Mode Entraînement</h1>
            <p className="entr-header__subtitle">Testez la détection de signes sans appel</p>
          </div>
          <Link href="/dashboard" className="entr-header__back-btn">
            ← Dashboard
          </Link>
        </div>

        <div className="entr-grid">

          {/* ── Video column ─────────────────────────────────── */}
          <div className="entr-video-col">

            {/* Camera tile */}
            <div className="entr-camera-tile">
              <video
                ref={videoRef}
                autoPlay muted playsInline
                style={{ display: streamStarted ? 'block' : 'none' }}
              />

              {/* Placeholder */}
              {!streamStarted && (
                <div className="entr-camera-placeholder">
                  <span className="entr-camera-placeholder__icon">📷</span>
                  <p className="entr-camera-placeholder__text">
                    Cliquez sur Démarrer pour activer la caméra
                  </p>
                </div>
              )}

              {/* Detection badge */}
              {detecting && (
                <div className="entr-detection-area">
                  {signWord ? (
                    <div className="entr-detection-badge entr-detection-badge--detected">
                      🤟 {signWord.toUpperCase()} — {signConfidence}%
                    </div>
                  ) : signConfidence > 0 ? (
                    <div className="entr-detection-badge entr-detection-badge--low">
                      Aucun signe ({signConfidence}%)
                    </div>
                  ) : (
                    <div className="entr-detection-badge entr-detection-badge--idle">
                      👋 Montrez un signe...
                    </div>
                  )}
                </div>
              )}

              {/* Pending combo signs */}
              {detecting && pendingSigns.length > 0 && !gestureSubtitle && (
                <div
                  className="entr-pending"
                  style={{ bottom: gestureSubtitle ? '56px' : '0.75rem' }}
                >
                  {pendingSigns.map((s, i) => (
                    <span key={i} className="entr-pending__sign">{s}</span>
                  ))}
                  <span className="entr-pending__dots">...</span>
                </div>
              )}

              {/* Gesture subtitle */}
              {gestureSubtitle && (
                <div
                  className="entr-subtitle"
                  style={{
                    background: subtitleStyle(gestureSubtitle.type).bg,
                    borderTop: `1px solid ${subtitleStyle(gestureSubtitle.type).border}`,
                  }}
                >
                  <span className="entr-subtitle__emoji">🤟</span>
                  <span className="entr-subtitle__text">{gestureSubtitle.text}</span>
                  <span className="entr-subtitle__tag">
                    {gestureSubtitle.type === 'combo'  && 'COMBO'}
                    {gestureSubtitle.type === 'single' && 'PHRASE'}
                    {gestureSubtitle.type === 'raw'    && 'SIGNE'}
                  </span>
                </div>
              )}
            </div>

            {/* Controls bar */}
            <div className="entr-controls">
              {!streamStarted && (
                <button onClick={startCamera} className="entr-start-btn">
                  🎬 Démarrer la caméra
                </button>
              )}

              {streamStarted && (
                <>
                  <CtrlBtn
                    onClick={toggleCamera}
                    active={!cameraOn}
                    danger={!cameraOn}
                    icon={cameraOn ? '📹' : '📷'}
                    label={cameraOn ? 'Cam' : 'Cam off'}
                  />
                  <CtrlBtn
                    onClick={toggleMic}
                    active={!micOn}
                    danger={!micOn}
                    icon={micOn ? '🎙️' : '🔇'}
                    label={micOn ? 'Micro' : 'Muet'}
                  />
                  <CtrlBtn
                    onClick={toggleDetection}
                    active={detecting}
                    icon="🤟"
                    label={detecting ? 'Détection ON' : 'Détecter'}
                  />
                  <CtrlBtn
                    onClick={handleStopAll}
                    danger
                    icon="⏹️"
                    label="Arrêter"
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Log panel ────────────────────────────────────── */}
          <div className="entr-log">

            <div className="entr-log__header">
              <p className="entr-log__header-title">📋 Détections</p>
              {detectionLog.length > 0 && (
                <button onClick={() => setDetectionLog([])} className="entr-log__clear-btn">
                  Effacer
                </button>
              )}
            </div>

            <div className="entr-log__list">
              {detectionLog.length === 0 && (
                <div className="entr-log__empty">
                  <div className="entr-log__empty-icon">🤟</div>
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
                      🤟 {entry.word.toUpperCase()} — {entry.confidence.toFixed(1)}%
                    </p>
                    <p className="entr-log__entry-phrase">"{entry.phrase}"</p>
                  </div>
                )
              })}
            </div>

            {/* Status bar */}
            <div className="entr-log__statusbar">
              <span className="entr-log__status-item">
                <span className={`entr-log__status-dot ${streamStarted ? 'entr-log__status-dot--camera-on' : 'entr-log__status-dot--camera-off'}`} />
                Caméra
              </span>
              <span className="entr-log__status-item">
                <span className={`entr-log__status-dot ${detecting ? 'entr-log__status-dot--detect-on' : 'entr-log__status-dot--detect-off'}`} />
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

/* ── Control button ─────────────────────────────────────────── */
function CtrlBtn({ onClick, active, danger, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`entr-ctrl-btn ${
        danger  ? 'entr-ctrl-btn--danger'  :
        active  ? 'entr-ctrl-btn--active'  :
                  'entr-ctrl-btn--default'
      }`}
    >
      <span className="entr-ctrl-btn__icon">{icon}</span>
      <span className="entr-ctrl-btn__label">{label}</span>
    </button>
  )
}