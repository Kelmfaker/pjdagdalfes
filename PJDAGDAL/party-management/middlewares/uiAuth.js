import jwt from 'jsonwebtoken';

// Middleware for EJS UI routes: redirect to /login with message when unauthenticated
export default function uiAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (!token) {
    const nextUrl = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/login?msg=${encodeURIComponent('Authentication required')}&next=${nextUrl}`);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    const nextUrl = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/login?msg=${encodeURIComponent('Authentication required')}&next=${nextUrl}`);
  }
}
