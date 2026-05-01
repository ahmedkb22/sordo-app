'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import {
  LayoutDashboard,
  Mail,
  Users,
  CircleDot,
  Phone,
  LogOut,
  X,
} from 'lucide-react'
import './dashboard.css'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalCalls: 0,
    unreadMessages: 0,
    totalMessages: 0,
  })
  const [messages, setMessages] = useState([])
  const [signupChart, setSignupChart] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMsg, setSelectedMsg] = useState(null)

  // Auth guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('sordo_admin')) {
        router.replace('/admin/login')
      }
    }
  }, [])

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        // --- Users ---
        const usersSnap = await getDocs(collection(db, 'users'))
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const totalUsers = users.length

        // Active today
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const activeToday = users.filter(u => {
          const ts = u.lastSeen?.toDate?.() || u.createdAt?.toDate?.()
          return ts && ts >= todayStart
        }).length

        // Signup chart — last 7 days
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          d.setHours(0, 0, 0, 0)
          const label = d.toLocaleDateString('en', { weekday: 'short' })
          const count = users.filter(u => {
            const ts = u.createdAt?.toDate?.()
            if (!ts) return false
            const next = new Date(d); next.setDate(next.getDate() + 1)
            return ts >= d && ts < next
          }).length
          days.push({ label, count })
        }
        setSignupChart(days)

        // --- Calls ---
        const callsSnap = await getDocs(collection(db, 'calls'))
        const totalCalls = callsSnap.size

        // --- Contact messages ---
        const msgsSnap = await getDocs(
          query(collection(db, 'contact_submissions'), orderBy('createdAt', 'desc'))
        )
        const msgs = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const unreadMessages = msgs.filter(m => m.status === 'unread').length

        setMessages(msgs)
        setStats({ totalUsers, activeToday, totalCalls, unreadMessages, totalMessages: msgs.length })
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('sordo_admin')
    router.push('/admin/login')
  }

  const maxCount = Math.max(...signupChart.map(d => d.count), 1)

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-logo">SORDO</div>
        <div className="admin-loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dash">

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">SORDO</div>
        <p className="admin-sidebar-role">Admin Panel</p>

        <nav className="admin-nav">
          <div className="admin-nav-item active">
            <span className="admin-nav-icon"><LayoutDashboard size={16} /></span> Dashboard
          </div>
          <div className="admin-nav-item" onClick={() => setSelectedMsg(null)}>
            <span className="admin-nav-icon"><Mail size={16} /></span> Messages
            {stats.unreadMessages > 0 && (
              <span className="admin-nav-badge">{stats.unreadMessages}</span>
            )}
          </div>
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Sign Out
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-header-title">Dashboard</h1>
            <p className="admin-header-sub">Welcome back, Ahmed </p>
          </div>
          <div className="admin-header-date">
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
              <Users size={20} />
            </div>
            <div>
              <p className="admin-stat-value">{stats.totalUsers}</p>
              <p className="admin-stat-label">Total Users</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
              <CircleDot size={20} />
            </div>
            <div>
              <p className="admin-stat-value">{stats.activeToday}</p>
              <p className="admin-stat-label">Active Today</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc' }}>
              <Phone size={20} />
            </div>
            <div>
              <p className="admin-stat-value">{stats.totalCalls}</p>
              <p className="admin-stat-label">Total Calls</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
              <Mail size={20} />
            </div>
            <div>
              <p className="admin-stat-value">{stats.totalMessages}</p>
              <p className="admin-stat-label">
                Messages
                {stats.unreadMessages > 0 && (
                  <span className="admin-unread-dot">{stats.unreadMessages} unread</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── Signup chart ── */}
        <div className="admin-card">
          <h2 className="admin-card-title">New Signups — Last 7 Days</h2>
          <div className="admin-chart">
            {signupChart.map((day, i) => (
              <div key={i} className="admin-chart-col">
                <span className="admin-chart-val">{day.count > 0 ? day.count : ''}</span>
                <div className="admin-chart-bar-wrap">
                  <div
                    className="admin-chart-bar"
                    style={{ height: `${(day.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="admin-chart-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact messages ── */}
        <div className="admin-card">
          <h2 className="admin-card-title">
            Contact Messages
            {stats.unreadMessages > 0 && (
              <span className="admin-card-badge">{stats.unreadMessages} unread</span>
            )}
          </h2>

          {messages.length === 0 ? (
            <p className="admin-empty">No messages yet.</p>
          ) : (
            <div className="admin-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`admin-msg-row ${msg.status === 'unread' ? 'unread' : ''} ${selectedMsg?.id === msg.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMsg(selectedMsg?.id === msg.id ? null : msg)}
                >
                  <div className="admin-msg-left">
                    {msg.status === 'unread' && <span className="admin-msg-dot" />}
                    <div>
                      <p className="admin-msg-name">{msg.fullName}</p>
                      <p className="admin-msg-email">{msg.email}</p>
                    </div>
                  </div>
                  <div className="admin-msg-right">
                    <p className="admin-msg-preview">
                      {msg.description?.slice(0, 60)}{msg.description?.length > 60 ? '...' : ''}
                    </p>
                    <p className="admin-msg-date">
                      {msg.createdAt?.toDate?.()?.toLocaleDateString('en', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) || '—'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Expanded message */}
              {selectedMsg && (
                <div className="admin-msg-detail">
                  <div className="admin-msg-detail-header">
                    <div>
                      <h3>{selectedMsg.fullName}</h3>
                      <p>{selectedMsg.email} {selectedMsg.phone ? `· ${selectedMsg.phone}` : ''}</p>
                    </div>
                    <button className="admin-msg-close" onClick={() => setSelectedMsg(null)}>
                      <X size={16} />
                    </button>
                  </div>
                  <p className="admin-msg-detail-body">{selectedMsg.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}