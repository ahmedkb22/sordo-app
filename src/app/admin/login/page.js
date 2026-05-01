'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import './login.css'

const ADMIN_USERNAME = 'ahmed_kbd22'
const ADMIN_PASSWORD = 'Ahmedkebir2&&4'

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (form.username === ADMIN_USERNAME && form.password === ADMIN_PASSWORD) {
        localStorage.setItem('sordo_admin', 'true')
        router.push('/admin/dashboard')
      } else {
        setError('Invalid username or password.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="admin-login-bg">
      <div className="admin-login-glow" />

      <div className="admin-login-card">
        {/* Logo */}
        <div className="admin-login-logo">SORDO</div>
        <p className="admin-login-sub">Admin Panel</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Username</label>
            <input
              className="admin-form-input"
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoComplete="off"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <div className="admin-input-wrap">
              <input
                className="admin-form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="admin-eye-btn"
                onClick={() => setShowPass(v => !v)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <button className="admin-login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className="admin-login-footer">
          Sordo Admin · Restricted Access
        </p>
      </div>
    </div>
  )
}