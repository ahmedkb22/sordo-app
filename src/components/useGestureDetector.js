// =============================================================
// useGestureDetector — Option B
// No MediaPipe in browser — sends raw frames to backend
// Backend does: MediaPipe + normalize + sequence + predict
// =============================================================
import { useRef, useCallback } from 'react'

const FRAME_INTERVAL_MS = 100   // send 1 frame every 100ms (10fps)
const API_URL           = 'https://sordo-backend2.onrender.com/api/frame/'

// Generate a unique session ID per browser tab
const SESSION_ID = Math.random().toString(36).substring(2, 12)

export function useGestureDetector({ onDetected, onNoHand }) {
  const detectingRef = useRef(false)
  const intervalRef  = useRef(null)
  const canvasRef    = useRef(null)
  const isPredicting = useRef(false)   // prevent overlapping requests

  // =============================================================
  // CAPTURE FRAME — draw video to canvas, export as base64 JPEG
  // =============================================================
  const captureFrame = (videoRef) => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null

    canvas.width  = 320   // smaller = faster upload
    canvas.height = 240

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, 320, 240)

    // Export as JPEG base64 (strip the data:image/jpeg;base64, prefix)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
    return dataUrl.split(',')[1]
  }

  // =============================================================
  // SEND FRAME TO BACKEND
  // =============================================================
  const sendFrame = useCallback(async (videoRef) => {
    if (isPredicting.current) return   // skip if previous request still pending
    isPredicting.current = true

    const frameB64 = captureFrame(videoRef)
    if (!frameB64) {
      isPredicting.current = false
      return
    }

    try {
      const response = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          frame:      frameB64,
          session_id: SESSION_ID,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.log('Backend error:', data.error)
        isPredicting.current = false
        return
      }

      if (data.hand) {
        onDetected?.(data)
      } else {
        onNoHand?.()
        onDetected?.({
          detected:    false,
          word:        null,
          confidence:  0,
          hand:        false,
          buffer_fill: data.buffer_fill || 0,
        })
      }

    } catch (e) {
      console.log('Frame send error:', e)
    }

    isPredicting.current = false
  }, [onDetected, onNoHand])

  // =============================================================
  // START — begin sending frames on interval
  // =============================================================
  const start = useCallback(async (videoRef) => {
    detectingRef.current = true
    intervalRef.current  = setInterval(() => {
      if (detectingRef.current) sendFrame(videoRef)
    }, FRAME_INTERVAL_MS)
  }, [sendFrame])

  // =============================================================
  // STOP
  // =============================================================
  const stop = useCallback(() => {
    detectingRef.current = false
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    isPredicting.current = false
  }, [])

  return { canvasRef, start, stop, detectingRef }
}