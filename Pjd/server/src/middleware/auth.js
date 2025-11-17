const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function authenticateJWT(req, res, next) {
	// Check Authorization header first
	let token = null;
	const auth = req.headers['authorization'] || req.headers['Authorization'];
	if (auth) {
		const parts = auth.split(' ');
		if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1];
	}

	// Fallback: check query param ?token=...
	if (!token && req.query && req.query.token) token = req.query.token;

	// Fallback: check cookie header for token (simple parse)
	if (!token && req.headers && req.headers.cookie) {
		const cookieHeader = req.headers.cookie.split(';').map(c=>c.trim());
		for (const c of cookieHeader) {
			if (c.startsWith('token=')) { token = c.substring('token='.length); break; }
		}
	}

	if (!token) return res.status(401).json({ message: 'Authorization token missing' });

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = { id: payload.sub, role: payload.role, username: payload.username };
		return next();
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

function requireRole(role) {
	return function(req, res, next) {
		if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
		if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden: insufficient role' });
		return next();
	}
}

function requireAnyRole(...roles) {
	return function(req, res, next) {
		if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
		if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden: insufficient role' });
		return next();
	}
}

module.exports = { authenticateJWT, requireRole, requireAnyRole };

