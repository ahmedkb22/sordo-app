// =============================================================
// useGestureDetector — shared hook for MediaPipe + API
// Used in both /call and /entrainement pages
// =============================================================
import { useRef, useCallback } from 'react'

const SEQUENCE_LENGTH = 30
const API_URL = 'https://sordo-backend2.onrender.com/api/predict/'

// =============================================================
// NORMALIZATION — must match collect_data.py exactly
// Centres each hand on its wrist and scales to [-1, 1]
// =============================================================
function normalizeHand(handLandmarks) {
  // handLandmarks: array of 21 {x, y, z} objects
  const flat = handLandmarks.flatMap(lm => [lm.x, lm.y, lm.z]) // 63 values

  const wristX = flat[0]
  const wristY = flat[1]
  const wristZ = flat[2]

  // Centre on wrist
  const centred = []
  for (let i = 0; i < 63; i += 3) {
    centred.push(
      flat[i]     - wristX,
      flat[i + 1] - wristY,
      flat[i + 2] - wristZ
    )
  }

  // Scale to [-1, 1]
  const maxVal = Math.max(...centred.map(Math.abs)) + 1e-6
  return centred.map(v => v / maxVal)
}

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
        const handedness = results.multiHandedness || []

        results.multiHandLandmarks.slice(0, 2).forEach((hand, i) => {
          // slot 0 = right hand, slot 1 = left hand (mirrors collect_data.py)
          const label = handedness[i]?.classification?.[0]?.label || 'Right'
          const slot  = label === 'Right' ? 0 : 1

          const normalized = normalizeHand(hand)
          for (let j = 0; j < 63; j++) {
            landmarks[slot * 63 + j] = normalized[j]
          }
        })

        sequenceRef.current.push(landmarks)
        if (sequenceRef.current.length > SEQUENCE_LENGTH) {
          sequenceRef.current.shift()
        }

        frameCounterRef.current += 1

        if (
          sequenceRef.current.length === SEQUENCE_LENGTH &&
          frameCounterRef.current % 5 === 0
        ) {
          predictSign(sequenceRef.current)
        }

      } else {
        sequenceRef.current   = []
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
      .then(() => {
        animFrameRef.current = requestAnimationFrame(() => runLoop(videoRef))
      })
      .catch(() => {
        animFrameRef.current = requestAnimationFrame(() => runLoop(videoRef))
      })
  }, [])

  const start = useCallback(async (videoRef) => {
    await setupMediaPipe()
    detectingRef.current = true
    runLoop(videoRef)
  }, [setupMediaPipe, runLoop])

  const stop = useCallback(() => {
    detectingRef.current    = false
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    sequenceRef.current     = []
    frameCounterRef.current = 0
  }, [])

  return { canvasRef, start, stop, detectingRef }
}