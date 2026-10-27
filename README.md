# StockFlow - Inventory Management System

A full-stack Inventory Management application built with **React + Tailwind CSS** (Frontend), **Node.js + Express** (Backend), and **XAMPP MySQL** (Database: `inventory_management`).

---

## 🏗️ Architecture & Entities

### Database (`inventory_management` on XAMPP MySQL):
1. **`users`**: User authentication with password hashing (`admin` and `manager` roles).
2. **`products`**: Product catalog, SKU, category, price, current stock, and low-stock threshold (`minimum_stock`).
3. **`prod_in`**: Dedicated table recording incoming stock (Product In).
4. **`prod_out`**: Dedicated table recording outgoing stock (Product Out).
5. **`stock_transactions`**: Complete audit log of every stock movement (`IN` and `OUT`).

---

## 🚀 Running the Project

### 1. Start XAMPP
* Open **XAMPP Control Panel**.
* Start **MySQL** (and **Apache** if you use phpMyAdmin).
* In phpMyAdmin, create the `inventory_management` database if it does not already exist. The backend creates the `users` table, but it cannot create the database itself.

### 2. Start the Backend
Open a terminal in the `backend` folder:
```powershell
cd c:\inventory-management\backend
npm run dev
```
* Backend runs at: `http://localhost:5000`
* Automatically connects to XAMPP MySQL, creates the `users` table if needed, and seeds default users when it is empty.

### 3. Start the Frontend
Open a second terminal in the `front-end` folder:
```powershell
cd c:\inventory-management\front-end
npm run dev
```
* Frontend runs at: `http://localhost:3000`
* Proxies `/api` requests directly to `http://localhost:5000`.

---

## 🔑 Default Accounts

| Role | Email / Login | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@inventory.com` | `admin123` | Full access: User management, delete products, add/edit products, Product In, Product Out, Audit log. |
| **Manager** | `manager@inventory.com` | `manager123` | Operational access: Add/edit products, Product In, Product Out, Audit log. *(Cannot delete products or manage user accounts).* |

*(Quick demo fill buttons are provided directly on the login page for convenience!)*

---

## 🖥️ Web Interface Features

1. **Dashboard**:
   - Live KPI cards: Total Products, Units on Hand, Inventory Valuation ($), Low Stock Items.
   - Low Stock Alert List: Highlights items at or below minimum threshold with a 1-click **"Restock (Product In)"** button.
   - Quick navigation shortcuts.

2. **Product Catalog (`/products`)**:
   - Live search by Name or SKU and category filter dropdown.
   - Add new product modal (Admin & Manager).
   - Edit product modal (Admin & Manager).
   - Delete product with safety confirmation (Admin only).
   - Quick "+ In" and "- Out" buttons on every product row.

3. **Product In (`/product-in`)**:
   - Clean receiving form: Select product, enter arrival quantity, supplier/PO notes.
   - Real-time `prod_in` table: View every incoming shipment with timestamp, product, SKU, and the user who handled it.

4. **Product Out (`/product-out`)**:
   - Stock dispatch form: Prevents dispatching more than available stock.
   - Real-time `prod_out` table.

5. **Audit Log & History (`/transactions`)**:
   - Complete historical ledger from `stock_transactions`.
   - Filterable by movement type (`All`, `IN`, `OUT`).

6. **User Management (`/users`)** *(Admin only)*:
   - View registered users and roles.
   - Create new Admin or Manager accounts.
