const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Header me token aayega: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // "Bearer" ke baad ka token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // token verify

    req.user = decoded; // user info ko request me daal diya
    next(); // agle middleware ya route pe jao
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;