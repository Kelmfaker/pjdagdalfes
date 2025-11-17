import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './context/AuthContext'

function RequireAuth({ children }) {
	const { user } = useAuth()
	if (!user) return <Login />
	return children
}

function TopNav() {
	const { user, logout } = useAuth()
	return (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<div>
				<Link to="/">Dashboard</Link>
			</div>
			<div>
				{user ? (
					<>
						<span style={{ marginRight: 10 }}>{user.username}</span>
						<button onClick={logout}>Logout</button>
					</>
				) : (
					<Link to="/login">Login</Link>
				)}
			</div>
		</div>
	)
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<div style={{ padding: 10 }}>
					<TopNav />
					<hr />
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
					</Routes>
				</div>
			</BrowserRouter>
		</AuthProvider>
	)
}
