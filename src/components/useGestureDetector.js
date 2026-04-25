// =============================================================
// useGestureDetector — mirrors predict_realtime.py exactly
// Same normalization, hand assignment, buffering, voting system
// =============================================================
import { useRef, useCallback } from 'react'

const SEQUENCE_LENGTH      = 30
const PREDICTION_THRESHOLD = 0.50
const BUFFER_SIZE          = 15   // smoothing window
const CONFIRM_VOTES        = 4    // votes needed to confirm a word
const NO_HAND_RESET_AFTER  = 10   // frames before resetting state
const API_URL              = 'https://sordo-backend2.onrender.com/api/predict/'

// =============================================================
// NORMALIZATION — mirrors normalize_landmarks() in predict_realtime.py
// Operates on the full 126-value array (2 hands × 21 landmarks × 3)
// Centres each hand on its wrist and scales to [-1, 1]
// =============================================================
function normalizeLandmarks(raw126) {
  // reshape to [2, 21, 3]
  const arr = []
  for (let h = 0; h < 2; h++) {
    const hand = []
    for (let j = 0; j < 21; j++) {
      const base = h * 63 + j * 3
      hand.push([raw126[base], raw126[base + 1], raw126[base + 2]])
    }
    arr.push(hand)
  }

  for (let h = 0; h < 2; h++) {
    // Check if hand is present (any non-zero value)
    const hasData = arr[h].some(p => p[0] !== 0 || p[1] !== 0 || p[2] !== 0)
    if (!hasData) continue

    // Centre on wrist (landmark 0)
    const [wx, wy, wz] = arr[h][0]
    for (let j = 0; j < 21; j++) {
      arr[h][j][0] -= wx
      arr[h][j][1] -= wy
      arr[h][j][2] -= wz
    }

    // Scale to [-1, 1]
    let maxVal = 1e-6
    for (let j = 0; j < 21; j++) {
      for (let k = 0; k < 3; k++) {
        maxVal = Math.max(maxVal, Math.abs(arr[h][j][k]))
      }
    }
    for (let j = 0; j < 21; j++) {
      arr[h][j][0] /= maxVal
      arr[h][j][1] /= maxVal
      arr[h][j][2] /= maxVal
    }
  }

  // Flatten back to 126
  const out = []
  for (let h = 0; h < 2; h++) {
    for (let j = 0; j < 21; j++) {
      out.push(arr[h][j][0], arr[h][j][1], arr[h][j][2])
    }
  }
  return out
}

// =============================================================
// HAND ASSIGNMENT — mirrors assign_hands() in predict_realtime.py
// slot 0 = right hand, slot 1 = left hand
// =============================================================
function assignHands(multiHandLandmarks, multiHandedness) {
  const landmarks = new Array(126).fill(0.0)
  const handedness = multiHandedness || []

  multiHandLandmarks.slice(0, 2).forEach((hand, i) => {
    const label = handedness[i]?.classification?.[0]?.label || 'Right'
    const slot = label === 'Right' ? 1 : 0

    hand.forEach((lm, j) => {
      const base = slot * 63 + j * 3
      landmarks[base]     = lm.x
      landmarks[base + 1] = lm.y
      landmarks[base + 2] = lm.z
    })
  })

  return normalizeLandmarks(landmarks)
}

// =============================================================
// HOOK
// =============================================================
export function useGestureDetector({ onDetected, onNoHand }) {
  const handsRef        = useRef(null)
  const sequenceRef     = useRef([])
  const frameCounterRef = useRef(0)
  const noHandFramesRef = useRef(0)
  const detectingRef    = useRef(false)
  const animFrameRef    = useRef(null)
  const canvasRef       = useRef(null)

  // Smoothing buffers — mirror predict_realtime.py
  const predBufferRef = useRef([])   // last BUFFER_SIZE predicted words
  const probBufferRef = useRef([])   // last BUFFER_SIZE softmax arrays

  // Current confirmed result
  const currentWordRef       = useRef('')
  const currentConfidenceRef = useRef(0.0)

  // =============================================================
  // RESET STATE — same as NO_HAND_RESET_AFTER block in py
  // =============================================================
  function resetState() {
    sequenceRef.current          = []
    frameCounterRef.current      = 0
    noHandFramesRef.current      = 0
    predBufferRef.current        = []
    probBufferRef.current        = []
    currentWordRef.current       = ''
    currentConfidenceRef.current = 0.0
  }

  // =============================================================
  // MEDIAPIPE SETUP
  // =============================================================
  const setupMediaPipe = useCallback(async () => {
    const { Hands } = await import('@mediapipe/hands')
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,  // matches predict_realtime.py
      minTrackingConfidence: 0.5,   // matches predict_realtime.py
    })

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Hand detected — reset no-hand counter
        noHandFramesRef.current = 0

        // Assign hands to slots + normalize (mirrors assign_hands in py)
        const frameLandmarks = assignHands(
          results.multiHandLandmarks,
          results.multiHandedness
        )

        sequenceRef.current.push(frameLandmarks)
        if (sequenceRef.current.length > SEQUENCE_LENGTH) {
          sequenceRef.current.shift()
        }

        frameCounterRef.current += 1

        // Predict every 3 frames (matches py: frame_counter % 3 == 0)
        if (
          sequenceRef.current.length === SEQUENCE_LENGTH &&
          frameCounterRef.current % 3 === 0
        ) {
          predictSign([...sequenceRef.current])
        }

      } else {
        // No hand detected
        noHandFramesRef.current += 1

        // Grace period — only reset after N consecutive no-hand frames
        if (noHandFramesRef.current >= NO_HAND_RESET_AFTER) {
          resetState()
          onNoHand?.()
        }
      }
    })

    handsRef.current = hands
  }, [onNoHand])

  // =============================================================
  // PREDICT — sends sequence to backend, applies same voting logic
  // as predict_realtime.py
  // =============================================================
  const predictSign = async (sequence) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
      })
      const data = await response.json()

      if (!data || data.error) return

      const confidence = data.confidence / 100  // backend returns 0-100
      const word       = data.word
      const detected   = data.detected

      if (detected && confidence >= PREDICTION_THRESHOLD) {
        // Add to predictions buffer (cap at BUFFER_SIZE)
        predBufferRef.current.push(word)
        if (predBufferRef.current.length > BUFFER_SIZE) {
          predBufferRef.current.shift()
        }

        // Count votes for this word — mirrors predict_realtime.py voting
        const votes = predBufferRef.current.filter(w => w === word).length

        if (votes >= CONFIRM_VOTES) {
          currentWordRef.current       = word
          currentConfidenceRef.current = confidence
          onDetected?.({
            detected:   true,
            word:       word,
            confidence: Math.round(confidence * 100),
          })
        }

      } else {
        // Below threshold — clear buffers (matches py behaviour)
        predBufferRef.current        = []
        probBufferRef.current        = []
        currentWordRef.current       = ''
        currentConfidenceRef.current = confidence

        onDetected?.({
          detected:   false,
          word:       null,
          confidence: Math.round(confidence * 100),
        })
      }

    } catch (e) {
      console.log('Prediction error:', e)
    }
  }

  // =============================================================
  // FRAME LOOP
  // =============================================================
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

  // =============================================================
  // START / STOP
  // =============================================================
  const start = useCallback(async (videoRef) => {
    await setupMediaPipe()
    detectingRef.current = true
    runLoop(videoRef)
  }, [setupMediaPipe, runLoop])

  const stop = useCallback(() => {
    detectingRef.current = false
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    resetState()
  }, [])

  return { canvasRef, start, stop, detectingRef }
}