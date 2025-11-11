const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function authenticateJWT(req, res, next) {
	const auth = req.headers['authorization'] || req.headers['Authorization'];
	if (!auth) return res.status(401).json({ message: 'Authorization header missing' });
	const parts = auth.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization format' });
	const token = parts[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = { id: payload.sub, role: payload.role };
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

