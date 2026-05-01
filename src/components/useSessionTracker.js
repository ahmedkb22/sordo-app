// src/components/useSessionTracker.js
// Tracks time spent in a session and writes it to Firestore
// Usage: call useSessionTracker({ uid, type: 'call' | 'entrainement' })

import { useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const FLUSH_INTERVAL = 60 // flush to Firestore every 60 seconds

export function useSessionTracker({ uid, type, active = true }) {
  const startTimeRef    = useRef(null)
  const lastFlushRef    = useRef(null)
  const intervalRef     = useRef(null)
  const accumulatedRef  = useRef(0) // minutes accumulated this session

  const getTodayKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const flushToFirestore = useCallback(async (finalFlush = false) => {
    if (!uid || !startTimeRef.current) return

    const now = new Date()
    const elapsedMs = now - lastFlushRef.current
    const elapsedMinutes = elapsedMs / 1000 / 60

    if (elapsedMinutes < 0.1 && !finalFlush) return // skip tiny intervals

    lastFlushRef.current = now
    accumulatedRef.current += elapsedMinutes

    const todayKey = getTodayKey()
    const userRef  = doc(db, 'users', uid)

    try {
      const snap = await getDoc(userRef)
      const data  = snap.data() || {}
      const usage = data.usage || {}
      const byDay = usage.usageByDay || {}
      const today = byDay[todayKey] || { callMinutes: 0, entrainementMinutes: 0, total: 0 }

      const minuteField = type === 'call' ? 'callMinutes' : 'entrainementMinutes'

      const updatedToday = {
        ...today,
        [minuteField]: (today[minuteField] || 0) + elapsedMinutes,
        total: (today.total || 0) + elapsedMinutes,
      }

      await updateDoc(userRef, {
        [`usage.${minuteField}`]:                     (usage[minuteField] || 0) + elapsedMinutes,
        'usage.totalMinutes':                          (usage.totalMinutes || 0) + elapsedMinutes,
        [`usage.usageByDay.${todayKey}`]:              updatedToday,
        'usage.lastSeen':                              serverTimestamp(),
      })
    } catch (err) {
      console.error('Session tracker flush error:', err)
    }
  }, [uid, type])

  const startSession = useCallback(() => {
    if (!uid) return
    const now = new Date()
    startTimeRef.current   = now
    lastFlushRef.current   = now
    accumulatedRef.current = 0

    // Flush every FLUSH_INTERVAL seconds
    intervalRef.current = setInterval(() => {
      flushToFirestore(false)
    }, FLUSH_INTERVAL * 1000)
  }, [uid, flushToFirestore])

  const endSession = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    await flushToFirestore(true)
    startTimeRef.current = null
  }, [flushToFirestore])

  // Auto start/stop based on active prop
  useEffect(() => {
    if (active && uid) {
      startSession()
    } else if (!active) {
      endSession()
    }
    return () => {
      if (active) endSession()
    }
  }, [active, uid])

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => { flushToFirestore(true) }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [flushToFirestore])

  return { endSession }
}