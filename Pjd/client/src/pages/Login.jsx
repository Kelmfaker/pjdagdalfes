import React, { useState } from 'react'
import api from '../api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await api.login(username, password)
      if (res && res.token) {
        api.setToken(res.token)
        if (onLogin) onLogin(res.user)
      }
    } catch (err) {
      setError(err.body || err.message || 'Login failed')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red' }}>{JSON.stringify(error)}</div>}
      <form onSubmit={submit}>
        <div>
          <label>Username:</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  )
}
