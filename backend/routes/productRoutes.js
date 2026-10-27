const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// ==========================================
// PUBLIC SCANNER & PRICE CHECKER ENDPOINTS
// Accessible by purchasers and floor employees without login
// ==========================================

// GET: Check price and product details by scanning SKU or Barcode
router.get("/scan/:sku", (req, res) => {
    const rawSku = req.params.sku ? req.params.sku.trim() : "";

    if (!rawSku) {
        return res.status(400).json({ message: "SKU or barcode is required." });
    }

    const cleanSku = rawSku.replace(/\s+/g, "");

    const sql = `
        SELECT id, name, sku, category, price, stock, minimum_stock
        FROM products
        WHERE UPPER(sku) = UPPER(?) OR UPPER(REPLACE(sku, ' ', '')) = UPPER(?)
        LIMIT 1
    `;

    db.query(sql, [rawSku, cleanSku], (err, results) => {
        if (err) {
            console.error("Scanner query error:", err);
            return res.status(500).json({ message: "Database lookup failed." });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: `No product found matching barcode / SKU "${rawSku}".`
            });
        }

        const product = results[0];
        const stock = Number(product.stock) || 0;
        const minStock = Number(product.minimum_stock) || 5;

        res.json({
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: Number(product.price),
            stock: stock,
            minimum_stock: minStock,
            in_stock: stock > 0,
            stock_status: stock === 0 ? "Out of Stock" : stock <= minStock ? "Low Stock" : "In Stock"
        });
    });
});

// GET: Quick catalog preview for scanner suggestions / test buttons
router.get("/scan-catalog", (req, res) => {
    const sql = "SELECT id, name, sku, category, price, stock FROM products ORDER BY name ASC LIMIT 50";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Catalog query error:", err);
            return res.status(500).json({ message: "Failed to load catalog." });
        }
        res.json(results);
    });
});

// ==========================================
// PROTECTED MANAGEMENT ROUTES (Admin & Manager)
// ==========================================
router.use(authenticateToken);

// CREATE: Add a new product (accessible by admin and manager)
router.post("/", authorizeRoles("admin", "manager"), (req, res) => {
    const { name, sku, category, price, stock, minimum_stock } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!name || !sku || price === undefined || stock === undefined) {
        return res.status(400).json({
            message: "Name, SKU, price, and stock are required."
        });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);
    const numMinStock = minimum_stock === undefined ? 5 : Number(minimum_stock);

    if (
        !Number.isFinite(numPrice) ||
        numPrice < 0 ||
        !Number.isInteger(numStock) ||
        numStock < 0 ||
        !Number.isInteger(numMinStock) ||
        numMinStock < 0
    ) {
        return res.status(400).json({
            message: "Price, stock, and minimum stock must be valid non-negative numbers."
        });
    }

    const sql = `
        INSERT INTO products
        (name, sku, category, price, stock, minimum_stock)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name.trim(),
        sku.trim().toUpperCase(),
        category ? category.trim() : null,
        numPrice,
        numStock,
        numMinStock
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "A product with this SKU already exists."
                });
            }

            console.error(err);
            return res.status(500).json({
                message: "Failed to add product."
            });
        }

        const insertedId = result.insertId;

        // If product was created with initial stock > 0, log in prod_in and stock_transactions
        if (numStock > 0) {
            const prodInSql = "INSERT INTO prod_in (product_id, quantity, user_id, date) VALUES (?, ?, ?, NOW())";
            db.query(prodInSql, [insertedId, numStock, userId], (prodInErr) => {
                if (prodInErr) {
                    console.error("Warning: Failed to log opening prod_in:", prodInErr.message);
                }
            });

            const stockTxSql = `
                INSERT INTO stock_transactions
                (product_id, user_id, type, quantity, previous_stock, new_stock, notes, created_at)
                VALUES (?, ?, 'IN', ?, 0, ?, 'Opening initial stock', NOW())
            `;
            db.query(stockTxSql, [insertedId, userId, numStock, numStock], (txErr) => {
                if (txErr) {
                    console.error("Warning: Failed to log opening stock transaction:", txErr.message);
                }
            });
        }

        res.status(201).json({
            message: "Product added successfully!",
            id: insertedId,
            product: {
                id: insertedId,
                name: name.trim(),
                sku: sku.trim().toUpperCase(),
                category: category ? category.trim() : null,
                price: numPrice,
                stock: numStock,
                minimum_stock: numMinStock
            }
        });
    });
});

// READ: Get all products (accessible by admin and manager)
router.get("/", authorizeRoles("admin", "manager"), (req, res) => {
    const { search, category } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const values = [];

    if (search) {
        sql += " AND (name LIKE ? OR sku LIKE ?)";
        const term = `%${search.trim()}%`;
        values.push(term, term);
    }

    if (category) {
        sql += " AND category = ?";
        values.push(category.trim());
    }

    sql += " ORDER BY id DESC";

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to retrieve products."
            });
        }

        res.json(results);
    });
});

// READ: Get one product
router.get("/:id", authorizeRoles("admin", "manager"), (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "Invalid product ID." });
    }

    db.query(
        "SELECT * FROM products WHERE id = ?",
        [id],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to retrieve product."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Product not found."
                });
            }

            res.json(results[0]);
        }
    );
});

// UPDATE: Edit product details (admin and manager)
router.put("/:id", authorizeRoles("admin", "manager"), (req, res) => {
    const id = Number(req.params.id);
    const { name, sku, category, price, minimum_stock } = req.body;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "Invalid product ID." });
    }

    if (!name || !sku || price === undefined) {
        return res.status(400).json({
            message: "Name, SKU, and price are required."
        });
    }

    const numPrice = Number(price);
    const numMinStock = minimum_stock === undefined ? 5 : Number(minimum_stock);

    if (
        !Number.isFinite(numPrice) ||
        numPrice < 0 ||
        !Number.isInteger(numMinStock) ||
        numMinStock < 0
    ) {
        return res.status(400).json({
            message: "Price and minimum stock must be valid non-negative numbers."
        });
    }

    const sql = `
        UPDATE products
        SET name = ?, sku = ?, category = ?, price = ?, minimum_stock = ?
        WHERE id = ?
    `;

    const values = [
        name.trim(),
        sku.trim().toUpperCase(),
        category ? category.trim() : null,
        numPrice,
        numMinStock,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "That SKU is already used by another product."
                });
            }

            console.error(err);
            return res.status(500).json({
                message: "Failed to update product."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found or no changes made."
            });
        }

        res.json({ message: "Product updated successfully!" });
    });
});

// DELETE: Remove product (Admin only!)
router.delete("/:id", authorizeRoles("admin"), (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "Invalid product ID." });
    }

    db.query(
        "DELETE FROM products WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                if (err.code === "ER_ROW_IS_REFERENCED_2") {
                    return res.status(409).json({
                        message: "Cannot delete this product because it has associated entries in prod_in, prod_out, or stock_transactions."
                    });
                }

                console.error(err);
                return res.status(500).json({
                    message: "Failed to delete product."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Product not found."
                });
            }

            res.json({ message: "Product deleted successfully!" });
        }
    );
});

module.exports = router;
