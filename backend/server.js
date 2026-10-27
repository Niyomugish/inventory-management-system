const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = require("./config/db");
const { router: authRoutes, initDefaultUsers } = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);

// Welcome route
app.get("/", (req, res) => {
    res.json({
        message: "Inventory Management API is running!",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth (POST /login, POST /register, GET /me, GET /users)",
            products: "/api/products (GET, POST, GET /:id, PUT /:id, DELETE /:id)",
            transactions: "/api/transactions (POST /in, POST /out, GET /, GET /summary)",
            test_db: "/api/test-db"
        }
    });
});

// Test database route for XAMPP MySQL connection check
app.get("/api/test-db", (req, res) => {
    db.query("SELECT DATABASE() AS database_name, CURRENT_TIMESTAMP() AS server_time", (err, results) => {
        if (err) {
            console.error("Database query error:", err.message);
            return res.status(500).json({
                message: "Database query failed. Make sure XAMPP MySQL is running and database 'inventory_management' exists.",
                error: err.message
            });
        }

        res.json({
            message: "Database connection is working successfully!",
            database: results[0].database_name,
            server_time: results[0].server_time
        });
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "production" ? undefined : err.message
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    await initDefaultUsers();

    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Database target: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        console.log(`===============================================`);
    });
}

startServer();
