import jwt from "jsonwebtoken";

// Accept token from Authorization header OR from cookie (req.cookies.token)
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // normalize role to lowercase for consistent checks across server and templates
    if (payload && payload.role) payload.role = String(payload.role).toLowerCase();
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  const allowed = roles.map(r => String(r).toLowerCase());
  const userRole = String(req.user.role || '').toLowerCase();
  if (!allowed.includes(userRole)) return res.status(403).json({ message: "Forbidden" });
  next();
};
