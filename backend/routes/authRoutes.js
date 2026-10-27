const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// Create the authentication table before checking whether it needs default users.
async function initDefaultUsers() {
    try {
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'manager',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.promise().query(
            "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'manager'"
        );

        const [rows] = await db.promise().query("SELECT COUNT(*) AS count FROM users");
        if (Number(rows[0].count) > 0) {
            return;
        }

        const adminHash = await bcrypt.hash("admin123", 10);
        const managerHash = await bcrypt.hash("manager123", 10);
        await db.promise().query(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
            [
                "System Admin", "admin@inventory.com", adminHash, "admin",
                "Store Manager", "manager@inventory.com", managerHash, "manager"
            ]
        );
        console.log("Default Admin and Manager accounts initialized.");
    } catch (err) {
        console.error("Failed to initialize default users:", err.message);
    }
}

// POST: Login (for Admin and Manager)
router.post("/login", (req, res) => {
    const { email, username, name, password } = req.body || {};
    const rawIdentifier = email || username || name;
    const identifier = typeof rawIdentifier === "string" ? rawIdentifier.trim() : "";

    if (!identifier || typeof password !== "string" || !password) {
        return res.status(400).json({
            message: "Email (or name) and password are required."
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("Login unavailable: JWT_SECRET is not configured.");
        return res.status(503).json({
            message: "Login service is not configured. Check the backend environment settings."
        });
    }

    const sql = "SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1";

    db.query(sql, [identifier, identifier], async (err, results) => {
        if (err) {
            console.error("Login query error:", err);
            return res.status(503).json({
                message: "Login service is unavailable. Check the backend database and users table."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email/name or password." });
        }

        const user = results[0];

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email/name or password." });
            }

            const tokenPayload = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
            );

            res.json({
                message: "Login successful!",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (compareErr) {
            console.error("Password comparison error:", compareErr);
            return res.status(500).json({ message: "Error validating credentials." });
        }
    });
});

// POST: Register a new user (Admin only)
router.post("/register", (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email, and password are required."
        });
    }

    const assignedRole = role === "admin" ? "admin" : "manager";

    db.query("SELECT COUNT(*) AS count FROM users", async (countErr, countResults) => {
        if (countErr) {
            console.error(countErr);
            return res.status(500).json({ message: "Database query failed." });
        }

        const userCount = countResults[0].count;

        // If users exist, check if requester is Admin
        if (userCount > 0) {
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];

            if (!token) {
                return res.status(401).json({
                    message: "Creating new accounts requires an authenticated Admin user."
                });
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.role !== "admin") {
                    return res.status(403).json({
                        message: "Only administrators can create new users."
                    });
                }
            } catch (jwtErr) {
                return res.status(403).json({ message: "Invalid or expired authorization token." });
            }
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertSql = `
                INSERT INTO users (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(insertSql, [name.trim(), email.trim(), hashedPassword, assignedRole], (insertErr, result) => {
                if (insertErr) {
                    if (insertErr.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "A user with that email already exists."
                        });
                    }
                    console.error("User registration error:", insertErr);
                    return res.status(500).json({ message: "Failed to create user." });
                }

                res.status(201).json({
                    message: `User created successfully with role '${assignedRole}'!`,
                    user: {
                        id: result.insertId,
                        name: name.trim(),
                        email: email.trim(),
                        role: assignedRole
                    }
                });
            });
        } catch (hashErr) {
            console.error("Hashing error:", hashErr);
            res.status(500).json({ message: "Failed to process password." });
        }
    });
});

// GET: Current authenticated user info
router.get("/me", authenticateToken, (req, res) => {
    db.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        [req.user.id],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            res.json(results[0]);
        }
    );
});

// GET: List all users (Admin only)
router.get("/users", authenticateToken, authorizeRoles("admin"), (req, res) => {
    db.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY id ASC",
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to fetch users." });
            }
            res.json(results);
        }
    );
});

// DELETE: Remove a user account (Admin only)
router.delete("/users/:id", authenticateToken, authorizeRoles("admin"), (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    // Safety guard: Prevent admin from deleting their own current account
    if (req.user && req.user.id === id) {
        return res.status(400).json({
            message: "You cannot delete your own admin account while logged in."
        });
    }

    // First check if target user exists
    db.query("SELECT id, name, role FROM users WHERE id = ?", [id], (findErr, findResults) => {
        if (findErr) {
            console.error("Find user error:", findErr);
            return res.status(500).json({ message: "Database query error." });
        }

        if (findResults.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const targetUser = findResults[0];

        // Safely unlink user reference in transaction tables so historical logs remain intact
        db.query("UPDATE prod_in SET user_id = NULL WHERE user_id = ?", [id], () => {
            db.query("UPDATE prod_out SET user_id = NULL WHERE user_id = ?", [id], () => {
                db.query("UPDATE stock_transactions SET user_id = NULL WHERE user_id = ?", [id], () => {
                    // Now delete the user
                    db.query("DELETE FROM users WHERE id = ?", [id], (deleteErr, result) => {
                        if (deleteErr) {
                            console.error("Delete user error:", deleteErr);
                            return res.status(500).json({
                                message: "Failed to delete user."
                            });
                        }

                        res.json({
                            message: `User '${targetUser.name}' (${targetUser.role}) has been deleted successfully!`
                        });
                    });
                });
            });
        });
    });
});

module.exports = {
    router,
    initDefaultUsers
};
