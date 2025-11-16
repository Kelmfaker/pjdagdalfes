import jwt from 'jsonwebtoken';

// Non-intrusive middleware to attach user payload to req and res.locals when a valid token exists.
// Does NOT redirect or fail when no token is present — useful for rendering templates with user info.
export default function attachUser(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (!token) {
    // no token — continue without attaching user
    res.locals.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // normalize role to lowercase for consistent template rendering and client-side checks
    if (payload && payload.role) payload.role = String(payload.role).toLowerCase();
    req.user = payload;
    res.locals.user = payload;
    return next();
  } catch (err) {
    // invalid token — clear any existing user and continue
    res.locals.user = null;
    return next();
  }
}
