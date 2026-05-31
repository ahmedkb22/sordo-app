// src/components/usePlanLimits.js
// ─────────────────────────────────────────────────────────────
// Reads user's plan + today's usage and returns limit info.
//
// TYPE can be: 'call' | 'entrainement' | 'academic'
//
// PLAN LIMITS:
//   free  → 60 min/day  for call & entrainement. NO academic mode.
//   plus  → 360 min/day for call & entrainement. NO academic mode.
//   pro   → unlimited   for call & entrainement. NO academic mode.
//   vip   → unlimited   for everything, INCLUDING academic mode.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

// ── Single source of truth for all plan limits ───────────────
export const PLAN_LIMITS = {
  free: {
    callMinutes:          60,    // 60 min/day
    entrainementMinutes:  60,    // 60 min/day
    academicAllowed:      false, // academic mode LOCKED
    label: 'Sordo Free',
    color: '#60a5fa',
  },
  plus: {
    callMinutes:          360,   // 6h/day
    entrainementMinutes:  360,   // 6h/day
    academicAllowed:      false, // academic mode LOCKED
    label: 'Sordo Plus',
    color: '#a78bfa',
  },
  pro: {
    callMinutes:          null,  // null = unlimited
    entrainementMinutes:  null,  // null = unlimited
    academicAllowed:      false, // academic mode LOCKED
    label: 'Sordo Pro',
    color: '#4ade80',
  },
  vip: {
    callMinutes:          null,  // unlimited
    entrainementMinutes:  null,  // unlimited
    academicAllowed:      true,  // ✅ academic mode OPEN
    label: 'Sordo VIP',
    color: '#fbbf24',
  },
}

// ── Helper: today's Firestore key ────────────────────────────
const getTodayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── Hook ─────────────────────────────────────────────────────
// Returns:
//   plan          → 'free' | 'plus' | 'pro' | 'vip'
//   minutesUsed   → number of minutes used today for `type`
//   minutesLimit  → limit (number or null for unlimited)
//   canUse        → boolean — false means paywall should show
//   loading       → boolean
//
// For type === 'academic':
//   canUse = true only when plan === 'vip'
//   minutesUsed / minutesLimit are not relevant (unlimited when allowed)
export function usePlanLimits({ uid, type }) {
  const [plan, setPlan]                   = useState('free')
  const [minutesUsed, setMinutesUsed]     = useState(0)
  const [minutesLimit, setMinutesLimit]   = useState(60)
  const [canUse, setCanUse]               = useState(true)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!uid) return

    async function check() {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        const data = snap.data() || {}

        const userPlan  = data.subscription?.plan || 'free'
        const limits    = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free
        const todayKey  = getTodayKey()
        const todayUsage = data.usage?.usageByDay?.[todayKey] || {}

        setPlan(userPlan)

        // ── Academic mode check ───────────────────────────────
        if (type === 'academic') {
          // Academic mode has no minute tracking — just a yes/no gate
          setMinutesUsed(0)
          setMinutesLimit(null)
          setCanUse(limits.academicAllowed)
          return
        }

        // ── Call / Entrainement minute check ──────────────────
        const field = type === 'call' ? 'callMinutes' : 'entrainementMinutes'
        const used  = todayUsage[field] || 0
        const limit = limits[field]    // null = unlimited

        setMinutesUsed(Math.round(used))
        setMinutesLimit(limit)
        setCanUse(limit === null || used < limit)   // null = unlimited → always true

      } catch (err) {
        console.error('usePlanLimits error:', err)
        setCanUse(true)   // fail open so users aren't blocked by Firestore errors
      } finally {
        setLoading(false)
      }
    }

    check()
  }, [uid, type])

  return { plan, minutesUsed, minutesLimit, canUse, loading }
}