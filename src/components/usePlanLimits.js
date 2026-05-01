// src/components/usePlanLimits.js
// Reads user's plan + today's usage and returns limit info

import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

export const PLAN_LIMITS = {
  free:  { callMinutes: 60,  entrainementMinutes: 60,  label: 'Sordo Free',  color: '#60a5fa' },
  plus:  { callMinutes: 360, entrainementMinutes: 360, label: 'Sordo Plus',  color: '#a78bfa' },
  pro:   { callMinutes: null, entrainementMinutes: null, label: 'Sordo Pro', color: '#4ade80' },
  vip:   { callMinutes: null, entrainementMinutes: null, label: 'Sordo VIP', color: '#fbbf24' },
}

const getTodayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function usePlanLimits({ uid, type }) {
  const [plan, setPlan]               = useState('free')
  const [minutesUsed, setMinutesUsed] = useState(0)
  const [minutesLimit, setMinutesLimit] = useState(60)
  const [canUse, setCanUse]           = useState(true)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!uid) return

    async function check() {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        const data = snap.data() || {}

        const userPlan   = data.subscription?.plan || 'free'
        const limits     = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free
        const todayKey   = getTodayKey()
        const todayUsage = data.usage?.usageByDay?.[todayKey] || {}

        const field      = type === 'call' ? 'callMinutes' : 'entrainementMinutes'
        const used       = todayUsage[field] || 0
        const limit      = limits[field]

        setPlan(userPlan)
        setMinutesUsed(Math.round(used))
        setMinutesLimit(limit)

        // null limit = unlimited (pro/vip)
        setCanUse(limit === null || used < limit)
      } catch (err) {
        console.error('usePlanLimits error:', err)
        setCanUse(true) // fail open
      } finally {
        setLoading(false)
      }
    }

    check()
  }, [uid, type])

  return { plan, minutesUsed, minutesLimit, canUse, loading }
}
