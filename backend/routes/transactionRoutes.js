const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// All transaction endpoints require authentication (both admin and manager have access)
router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));

/**
 * PRODUCT IN (Stock In / Receiving inventory)
 * POST /api/transactions/in
 * Body: { product_id, quantity, notes }
 */
router.post("/in", (req, res) => {
    const { product_id, quantity, notes } = req.body;
    const userId = req.user ? req.user.id : null;

    const productId = Number(product_id);
    const qty = Number(quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: "A valid product_id is required." });
    }

    if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive whole number." });
    }

    db.getConnection((connErr, connection) => {
        if (connErr) {
            console.error("Connection error:", connErr);
            return res.status(500).json({ message: "Database connection failed." });
        }

        connection.beginTransaction((txErr) => {
            if (txErr) {
                connection.release();
                console.error("Transaction error:", txErr);
                return res.status(500).json({ message: "Failed to begin transaction." });
            }

            // 1. Fetch current product
            connection.query(
                "SELECT id, name, sku, stock FROM products WHERE id = ? FOR UPDATE",
                [productId],
                (fetchErr, products) => {
                    if (fetchErr) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error(fetchErr);
                            res.status(500).json({ message: "Failed to query product." });
                        });
                    }

                    if (products.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(404).json({ message: "Product not found." });
                        });
                    }

                    const product = products[0];
                    const previousStock = Number(product.stock);
                    const newStock = previousStock + qty;

                    // 2. Update product stock
                    connection.query(
                        "UPDATE products SET stock = ? WHERE id = ?",
                        [newStock, productId],
                        (updateErr) => {
                            if (updateErr) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error(updateErr);
                                    res.status(500).json({ message: "Failed to update product stock." });
                                });
                            }

                            // 3. Insert into prod_in table
                            const insertProdInSql = `
                                INSERT INTO prod_in (product_id, quantity, user_id, date)
                                VALUES (?, ?, ?, NOW())
                            `;

                            connection.query(
                                insertProdInSql,
                                [productId, qty, userId],
                                (prodInErr, prodInResult) => {
                                    if (prodInErr) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("prod_in insert error:", prodInErr);
                                            res.status(500).json({ message: "Failed to record prod_in entry." });
                                        });
                                    }

                                    // 4. Also insert into stock_transactions audit log
                                    const insertStockTxSql = `
                                        INSERT INTO stock_transactions
                                        (product_id, user_id, type, quantity, previous_stock, new_stock, notes, created_at)
                                        VALUES (?, ?, 'IN', ?, ?, ?, ?, NOW())
                                    `;

                                    connection.query(
                                        insertStockTxSql,
                                        [productId, userId, qty, previousStock, newStock, notes || "Product In (Received)"],
                                        (stockTxErr, stockTxResult) => {
                                            if (stockTxErr) {
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    console.error("stock_transactions insert error:", stockTxErr);
                                                    res.status(500).json({ message: "Failed to record stock_transactions." });
                                                });
                                            }

                                            connection.commit((commitErr) => {
                                                if (commitErr) {
                                                    return connection.rollback(() => {
                                                        connection.release();
                                                        console.error(commitErr);
                                                        res.status(500).json({ message: "Transaction commit failed." });
                                                    });
                                                }

                                                connection.release();
                                                res.status(200).json({
                                                    message: `Product In successful! Added ${qty} units of '${product.name}'.`,
                                                    prod_in_id: prodInResult.insertId,
                                                    stock_transaction_id: stockTxResult.insertId,
                                                    product: {
                                                        id: productId,
                                                        name: product.name,
                                                        sku: product.sku,
                                                        previous_stock: previousStock,
                                                        added_quantity: qty,
                                                        current_stock: newStock
                                                    }
                                                });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});

/**
 * PRODUCT OUT (Stock Out / Dispatch / Sales)
 * POST /api/transactions/out
 * Body: { product_id, quantity, notes }
 */
router.post("/out", (req, res) => {
    const { product_id, quantity, notes } = req.body;
    const userId = req.user ? req.user.id : null;

    const productId = Number(product_id);
    const qty = Number(quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: "A valid product_id is required." });
    }

    if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: "Quantity must be a positive whole number." });
    }

    db.getConnection((connErr, connection) => {
        if (connErr) {
            console.error("Connection error:", connErr);
            return res.status(500).json({ message: "Database connection failed." });
        }

        connection.beginTransaction((txErr) => {
            if (txErr) {
                connection.release();
                console.error("Transaction error:", txErr);
                return res.status(500).json({ message: "Failed to begin transaction." });
            }

            connection.query(
                "SELECT id, name, sku, stock FROM products WHERE id = ? FOR UPDATE",
                [productId],
                (fetchErr, products) => {
                    if (fetchErr) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error(fetchErr);
                            res.status(500).json({ message: "Failed to query product." });
                        });
                    }

                    if (products.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(404).json({ message: "Product not found." });
                        });
                    }

                    const product = products[0];
                    const previousStock = Number(product.stock);

                    if (previousStock < qty) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(400).json({
                                message: `Insufficient stock. Current stock is ${previousStock}, but ${qty} was requested.`
                            });
                        });
                    }

                    const newStock = previousStock - qty;

                    connection.query(
                        "UPDATE products SET stock = ? WHERE id = ?",
                        [newStock, productId],
                        (updateErr) => {
                            if (updateErr) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error(updateErr);
                                    res.status(500).json({ message: "Failed to update product stock." });
                                });
                            }

                            // Insert into prod_out
                            const insertProdOutSql = `
                                INSERT INTO prod_out (product_id, quantity, user_id, date)
                                VALUES (?, ?, ?, NOW())
                            `;

                            connection.query(
                                insertProdOutSql,
                                [productId, qty, userId],
                                (prodOutErr, prodOutResult) => {
                                    if (prodOutErr) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("prod_out insert error:", prodOutErr);
                                            res.status(500).json({ message: "Failed to record prod_out entry." });
                                        });
                                    }

                                    // Also insert into stock_transactions
                                    const insertStockTxSql = `
                                        INSERT INTO stock_transactions
                                        (product_id, user_id, type, quantity, previous_stock, new_stock, notes, created_at)
                                        VALUES (?, ?, 'OUT', ?, ?, ?, ?, NOW())
                                    `;

                                    connection.query(
                                        insertStockTxSql,
                                        [productId, userId, qty, previousStock, newStock, notes || "Product Out (Dispatched)"],
                                        (stockTxErr, stockTxResult) => {
                                            if (stockTxErr) {
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    console.error("stock_transactions insert error:", stockTxErr);
                                                    res.status(500).json({ message: "Failed to record stock_transactions." });
                                                });
                                            }

                                            connection.commit((commitErr) => {
                                                if (commitErr) {
                                                    return connection.rollback(() => {
                                                        connection.release();
                                                        console.error(commitErr);
                                                        res.status(500).json({ message: "Transaction commit failed." });
                                                    });
                                                }

                                                connection.release();
                                                res.status(200).json({
                                                    message: `Product Out successful! Dispatched ${qty} units of '${product.name}'.`,
                                                    prod_out_id: prodOutResult.insertId,
                                                    stock_transaction_id: stockTxResult.insertId,
                                                    product: {
                                                        id: productId,
                                                        name: product.name,
                                                        sku: product.sku,
                                                        previous_stock: previousStock,
                                                        dispatched_quantity: qty,
                                                        current_stock: newStock
                                                    }
                                                });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});

/**
 * GET /api/transactions/prod-in
 * View all entries specifically in the prod_in table
 */
router.get("/prod-in", (req, res) => {
    const sql = `
        SELECT 
            pi.id,
            pi.product_id,
            p.name AS product_name,
            p.sku AS product_sku,
            p.category AS product_category,
            pi.quantity,
            pi.date,
            pi.user_id,
            u.name AS handled_by,
            u.role AS user_role
        FROM prod_in pi
        LEFT JOIN products p ON pi.product_id = p.id
        LEFT JOIN users u ON pi.user_id = u.id
        ORDER BY pi.date DESC
        LIMIT 100
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("prod_in query error:", err);
            return res.status(500).json({ message: "Failed to retrieve prod_in records." });
        }
        res.json(results);
    });
});

/**
 * GET /api/transactions/prod-out
 * View all entries specifically in the prod_out table
 */
router.get("/prod-out", (req, res) => {
    const sql = `
        SELECT 
            po.id,
            po.product_id,
            p.name AS product_name,
            p.sku AS product_sku,
            p.category AS product_category,
            po.quantity,
            po.date,
            po.user_id,
            u.name AS handled_by,
            u.role AS user_role
        FROM prod_out po
        LEFT JOIN products p ON po.product_id = p.id
        LEFT JOIN users u ON po.user_id = u.id
        ORDER BY po.date DESC
        LIMIT 100
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("prod_out query error:", err);
            return res.status(500).json({ message: "Failed to retrieve prod_out records." });
        }
        res.json(results);
    });
});

/**
 * GET /api/transactions
 * View combined stock_transactions log
 * Query params: ?type=IN|OUT & product_id=... & limit=...
 */
router.get("/", (req, res) => {
    const { type, product_id, limit } = req.query;

    let sql = `
        SELECT 
            t.id,
            t.product_id,
            p.name AS product_name,
            p.sku AS product_sku,
            p.category AS product_category,
            t.type,
            t.quantity,
            t.previous_stock,
            t.new_stock,
            t.notes,
            t.created_at,
            t.user_id,
            u.name AS handled_by,
            u.role AS user_role
        FROM stock_transactions t
        LEFT JOIN products p ON t.product_id = p.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
    `;

    const values = [];

    if (type && (type.toUpperCase() === "IN" || type.toUpperCase() === "OUT")) {
        sql += " AND t.type = ?";
        values.push(type.toUpperCase());
    }

    if (product_id && Number.isInteger(Number(product_id))) {
        sql += " AND t.product_id = ?";
        values.push(Number(product_id));
    }

    sql += " ORDER BY t.created_at DESC";

    const maxResults = limit && Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 100;
    sql += " LIMIT ?";
    values.push(maxResults);

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error("Transaction history error:", err);
            return res.status(500).json({ message: "Failed to retrieve transactions." });
        }
        res.json(results);
    });
});

/**
 * GET /api/transactions/summary
 * Dashboard KPI statistics
 */
router.get("/summary", (req, res) => {
    const sql = `
        SELECT
            COUNT(*) AS total_products,
            COALESCE(SUM(stock), 0) AS total_stock_units,
            COALESCE(SUM(stock * price), 0) AS total_inventory_value,
            COUNT(CASE WHEN stock <= minimum_stock THEN 1 END) AS low_stock_count,
            COUNT(CASE WHEN stock = 0 THEN 1 END) AS out_of_stock_count
        FROM products
    `;

    db.query(sql, (err, statsResults) => {
        if (err) {
            console.error("Dashboard stats query error:", err);
            return res.status(500).json({ message: "Failed to load dashboard summary." });
        }

        const lowStockSql = `
            SELECT id, name, sku, category, price, stock, minimum_stock
            FROM products
            WHERE stock <= minimum_stock
            ORDER BY stock ASC
            LIMIT 10
        `;

        db.query(lowStockSql, (lowErr, lowResults) => {
            if (lowErr) {
                console.error("Low stock items error:", lowErr);
                return res.status(500).json({ message: "Failed to load low stock items." });
            }

            res.json({
                stats: statsResults[0],
                low_stock_items: lowResults
            });
        });
    });
});

module.exports = router;
