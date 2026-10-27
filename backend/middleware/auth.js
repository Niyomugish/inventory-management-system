const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verify JWT token from request header
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Authentication token is missing."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        req.user = user;
        next();
    });
}

// Restrict access by user role (e.g., 'admin', 'manager')
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access forbidden: Requires one of the following roles: [${allowedRoles.join(", ")}]. Your role is '${req.user ? req.user.role : "none"}'.`
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles
};
