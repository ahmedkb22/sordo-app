// =============================================================
// useGestureDetector — shared hook for MediaPipe + API
// Used in both /call and /entrainement pages
// =============================================================
import { useRef, useCallback } from 'react'

const SEQUENCE_LENGTH = 30
const API_URL = 'https://sordo-backend2.onrender.com/api/predict/'

export function useGestureDetector({ onDetected, onNoHand }) {
  const handsRef        = useRef(null)
  const sequenceRef     = useRef([])
  const frameCounterRef = useRef(0)
  const detectingRef    = useRef(false)
  const animFrameRef    = useRef(null)
  const canvasRef       = useRef(null)

  const setupMediaPipe = useCallback(async () => {
    const { Hands } = await import('@mediapipe/hands')
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.3,
    })
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
        onNoHand?.()
      }
    })
    handsRef.current = hands
  }, [onNoHand])

  const predictSign = async (sequence) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
      })
      const data = await response.json()
      onDetected?.(data)
    } catch (e) {
      console.log('Prediction error:', e)
    }
  }

  const runLoop = useCallback((videoRef) => {
    if (!detectingRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !handsRef.current) {
      animFrameRef.current = requestAnimationFrame(() => runLoop(videoRef))
      return
    }
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    handsRef.current.send({ image: canvas })
      .then(() => { animFrameRef.current = requestAnimationFrame(() => runLoop(videoRef)) })
      .catch(() => { animFrameRef.current = requestAnimationFrame(() => runLoop(videoRef)) })
  }, [])

  const start = useCallback(async (videoRef) => {
    await setupMediaPipe()
    detectingRef.current = true
    runLoop(videoRef)
  }, [setupMediaPipe, runLoop])

  const stop = useCallback(() => {
    detectingRef.current = false
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    sequenceRef.current = []
    frameCounterRef.current = 0
  }, [])

  return { canvasRef, start, stop, detectingRef }
}