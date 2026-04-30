// =============================================================
// useGestureDetector — runs fully in the browser (no backend)
// MediaPipe → normalize → TFJS model → voting → onDetected
// =============================================================
import { useRef, useCallback, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'

const SEQUENCE_LENGTH      = 30
const PREDICTION_THRESHOLD = 0.50
const BUFFER_SIZE          = 15
const CONFIRM_VOTES        = 4
const NO_HAND_RESET_AFTER  = 10

// =============================================================
// NORMALIZATION — unchanged from original
// =============================================================
function normalizeLandmarks(raw126) {
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
    const hasData = arr[h].some(p => p[0] !== 0 || p[1] !== 0 || p[2] !== 0)
    if (!hasData) continue

    const [wx, wy, wz] = arr[h][0]
    for (let j = 0; j < 21; j++) {
      arr[h][j][0] -= wx
      arr[h][j][1] -= wy
      arr[h][j][2] -= wz
    }

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

  const out = []
  for (let h = 0; h < 2; h++) {
    for (let j = 0; j < 21; j++) {
      out.push(arr[h][j][0], arr[h][j][1], arr[h][j][2])
    }
  }
  return out
}

// =============================================================
// HAND ASSIGNMENT — unchanged from original
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
  const modelRef        = useRef(null)   // TFJS model
  const labelsRef       = useRef([])     // labels from labels.json
  const sequenceRef     = useRef([])
  const frameCounterRef = useRef(0)
  const noHandFramesRef = useRef(0)
  const detectingRef    = useRef(false)
  const animFrameRef    = useRef(null)
  const canvasRef       = useRef(null)

  const predBufferRef = useRef([])
  const probBufferRef = useRef([])

  const currentWordRef       = useRef('')
  const currentConfidenceRef = useRef(0.0)

  // =============================================================
  // LOAD MODEL + LABELS on mount
  // =============================================================
  useEffect(() => {
    async function loadModel() {
      try {
        console.log('Loading Sordo TFJS model...')
        const [model, labelsRes] = await Promise.all([
          tf.loadLayersModel('/sordo_tfjs_model/model.json'),
          fetch('/labels.json')
        ])
        const labels = await labelsRes.json()
        modelRef.current  = model
        // labels.json can be an array ["hello","thanks",...] or object {0:"hello",...}
        labelsRef.current = Array.isArray(labels) ? labels : Object.values(labels)
        console.log('✅ Model loaded. Classes:', labelsRef.current)
      } catch (err) {
        console.error('Failed to load Sordo model:', err)
      }
    }
    loadModel()
  }, [])

  // =============================================================
  // RESET STATE
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
  // MEDIAPIPE SETUP — unchanged from original
  // =============================================================
  const setupMediaPipe = useCallback(async () => {
    const { Hands } = await import('@mediapipe/hands')
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        noHandFramesRef.current = 0

        const frameLandmarks = assignHands(
          results.multiHandLandmarks,
          results.multiHandedness
        )

        sequenceRef.current.push(frameLandmarks)
        if (sequenceRef.current.length > SEQUENCE_LENGTH) {
          sequenceRef.current.shift()
        }

        frameCounterRef.current += 1

        if (
          sequenceRef.current.length === SEQUENCE_LENGTH &&
          frameCounterRef.current % 3 === 0
        ) {
          predictSign([...sequenceRef.current])
        }

      } else {
        noHandFramesRef.current += 1
        if (noHandFramesRef.current >= NO_HAND_RESET_AFTER) {
          resetState()
          onNoHand?.()
        }
      }
    })

    handsRef.current = hands
  }, [onNoHand])

  // =============================================================
  // PREDICT — now runs locally with TFJS, same voting logic
  // =============================================================
  const predictSign = useCallback(async (sequence) => {
    if (!modelRef.current || labelsRef.current.length === 0) return

    try {
      // Run inference inside tf.tidy to avoid memory leaks
      const probabilities = tf.tidy(() => {
        const input = tf.tensor3d([sequence], [1, SEQUENCE_LENGTH, 126])
        const output = modelRef.current.predict(input)
        return output.dataSync() // Float32Array of 8 probabilities
      })

      // Find best prediction
      let maxProb = 0
      let maxIdx  = 0
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i]
          maxIdx  = i
        }
      }

      const confidence = maxProb
      const word       = labelsRef.current[maxIdx] || `class_${maxIdx}`
      const detected   = confidence >= PREDICTION_THRESHOLD

      if (detected) {
        predBufferRef.current.push(word)
        if (predBufferRef.current.length > BUFFER_SIZE) {
          predBufferRef.current.shift()
        }

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
      console.error('Local prediction error:', e)
    }
  }, [onDetected])

  // =============================================================
  // FRAME LOOP — unchanged from original
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
  // START / STOP — unchanged from original
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