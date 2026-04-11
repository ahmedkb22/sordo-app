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

  const videoRef         = useRef(null)
  const localStreamRef   = useRef(null)
  const subtitleTimeout  = useRef(null)
  const phraseEngineRef  = useRef(buildPhraseEngine())
  const router           = useRouter()

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

  if (!ready) return (
    <main style={{ minHeight: '100vh', background: '#050a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #050a1e 0%, #0a1635 60%, #0d1f4a 100%)',
      color: 'white',
      paddingTop: '68px',
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Glow */}
      <div aria-hidden style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '350px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.15rem',
              background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              🏋️ Mode Entraînement
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              Testez la détection de signes sans appel
            </p>
          </div>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '0.6rem 1.2rem', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
            }}>
              ← Dashboard
            </button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem' }}>

          {/* ── Video panel ──────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Camera view */}
            <div style={{
              position: 'relative', borderRadius: '20px', overflow: 'hidden',
              background: '#060d24', border: '1px solid rgba(124,58,237,0.2)',
              aspectRatio: '16/9',
            }}>
              <video
                ref={videoRef}
                autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: streamStarted ? 'block' : 'none' }}
              />

              {/* Placeholder when no camera */}
              {!streamStarted && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                }}>
                  <span style={{ fontSize: '3rem', opacity: 0.3 }}>📷</span>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                    Cliquez sur Démarrer pour activer la caméra
                  </p>
                </div>
              )}

              {/* Detection badge top */}
              {detecting && (
                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                  {signWord ? (
                    <div style={{
                      background: 'rgba(34,197,94,0.85)', backdropFilter: 'blur(4px)',
                      padding: '0.5rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.85rem', fontWeight: '800', textAlign: 'center',
                    }}>
                      🤟 {signWord.toUpperCase()} — {signConfidence}%
                    </div>
                  ) : signConfidence > 0 ? (
                    <div style={{
                      background: 'rgba(234,179,8,0.8)', backdropFilter: 'blur(4px)',
                      padding: '0.4rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.75rem', textAlign: 'center',
                    }}>
                      Aucun signe ({signConfidence}%)
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      padding: '0.4rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.75rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)',
                    }}>
                      👋 Montrez un signe...
                    </div>
                  )}
                </div>
              )}

              {/* Pending combo badges */}
              {detecting && pendingSigns.length > 0 && !gestureSubtitle && (
                <div style={{
                  position: 'absolute', bottom: gestureSubtitle ? '56px' : '0.75rem', right: '0.75rem',
                  display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  {pendingSigns.map((s, i) => (
                    <span key={i} style={{
                      background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)',
                      borderRadius: '5px', padding: '2px 6px',
                      fontSize: '0.7rem', fontWeight: '700',
                    }}>{s}</span>
                  ))}
                  <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>...</span>
                </div>
              )}

              {/* ── GESTURE SUBTITLE ── */}
              {gestureSubtitle && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '0.6rem 0.85rem',
                  background: subtitleStyle(gestureSubtitle.type).bg,
                  backdropFilter: 'blur(6px)',
                  borderTop: `1px solid ${subtitleStyle(gestureSubtitle.type).border}`,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  animation: 'fadeSlideUp 0.2s ease',
                }}>
                  <span style={{ fontSize: '1rem' }}>🤟</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', flex: 1, lineHeight: '1.3' }}>
                    {gestureSubtitle.text}
                  </span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: '700', opacity: 0.75,
                    background: 'rgba(0,0,0,0.3)', borderRadius: '4px',
                    padding: '1px 5px', letterSpacing: '0.05em',
                  }}>
                    {gestureSubtitle.type === 'combo'  && 'COMBO'}
                    {gestureSubtitle.type === 'single' && 'PHRASE'}
                    {gestureSubtitle.type === 'raw'    && 'SIGNE'}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '1rem',
            }}>
              {/* Start button (before camera starts) */}
              {!streamStarted && (
                <button onClick={startCamera} style={{
                  padding: '0.7rem 1.5rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none',
                  color: 'white', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                }}>
                  🎬 Démarrer la caméra
                </button>
              )}

              {streamStarted && (
                <>
                  <CtrlBtn
                    onClick={toggleCamera}
                    active={!cameraOn} danger={!cameraOn}
                    icon={cameraOn ? '📹' : '📷'}
                    label={cameraOn ? 'Cam' : 'Cam off'}
                  />
                  <CtrlBtn
                    onClick={toggleMic}
                    active={!micOn} danger={!micOn}
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
                    onClick={() => {
                      stop()
                      localStreamRef.current?.getTracks().forEach(t => t.stop())
                      setStreamStarted(false)
                      setCameraOn(false)
                      setDetecting(false)
                      setSignWord(null)
                      setGestureSubtitle(null)
                      setPendingSigns([])
                      phraseEngineRef.current.clear()
                    }}
                    danger
                    icon="⏹️"
                    label="Arrêter"
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Log panel ────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>📋 Détections</p>
              {detectionLog.length > 0 && (
                <button onClick={() => setDetectionLog([])} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.75rem', cursor: 'pointer',
                }}>Effacer</button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {detectionLog.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <span style={{ fontSize: '2.5rem', opacity: 0.2 }}>🤟</span>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Les signes détectés apparaîtront ici
                  </p>
                </div>
              )}
              {detectionLog.map((entry, i) => {
                const t = typeLabel(entry.type)
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px', padding: '0.6rem 0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em',
                        color: t.color,
                        background: `${t.color}20`, borderRadius: '4px',
                        padding: '1px 6px',
                      }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>
                        {entry.time}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.15rem', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>
                      🤟 {entry.word.toUpperCase()} — {entry.confidence.toFixed(1)}%
                    </p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
                      "{entry.phrase}"
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Status bar */}
            <div style={{
              padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: streamStarted ? '#22c55e' : 'rgba(255,255,255,0.2)',
                  display: 'inline-block',
                }} />
                Caméra
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: detecting ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                  display: 'inline-block',
                }} />
                Détection
              </span>
              <span style={{ marginLeft: 'auto' }}>
                {detectionLog.length} signe{detectionLog.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}

function CtrlBtn({ onClick, active, danger, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '0.7rem 1rem', borderRadius: '14px',
      background: danger
        ? 'rgba(239,68,68,0.15)'
        : active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
      border: danger
        ? '1px solid rgba(239,68,68,0.3)'
        : active ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.08)',
      color: danger ? '#fca5a5' : active ? '#c4b5fd' : 'rgba(255,255,255,0.7)',
      cursor: 'pointer', transition: 'all 0.2s ease', minWidth: '72px',
    }}>
      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      <span style={{ fontSize: '0.68rem', fontWeight: '600', letterSpacing: '0.03em' }}>{label}</span>
    </button>
  )
}