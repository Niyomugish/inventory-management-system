import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Package, 
  ShieldCheck, 
  UserCheck, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Database,
  Layers,
  ChevronRight,
  ScanBarcode
} from "lucide-react";

export default function IndexPage({ onOpenScanner }) {
  const { login } = useAuth();

  // Login form state
  const [identifier, setIdentifier] = useState("admin@inventory.com");
  const [password, setPassword] = useState("admin123");
  const [selectedRole, setSelectedRole] = useState("admin"); // 'admin' or 'manager'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
    if (role === "admin") {
      setIdentifier("admin@inventory.com");
      setPassword("admin123");
    } else {
      setIdentifier("manager@inventory.com");
      setPassword("manager123");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Header / Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">JP tech-electronic StockFlow</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Inventory
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ScanBarcode className="w-4 h-4 text-emerald-400" />
              <span>Price Scanner</span>
            </button>

            <button
              onClick={() => {
                setShowLoginModal(true);
                handleRoleSelect("admin");
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Intro */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Inventory Management System</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Complete Stock Control with <span className="text-blue-600">Product In</span> & Role Dashboards
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Seamlessly manage catalog products, record incoming shipments via <strong>Product In</strong>, dispatch stock, and switch between <strong>Admin</strong> and <strong>Manager</strong> dashboards.
              </p>

              {/* Quick Role Triggers & Scanner */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={onOpenScanner}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <ScanBarcode className="w-4 h-4 text-emerald-400" />
                  <span>Scan to Check Price</span>
                </button>

                <button
                  onClick={() => {
                    handleRoleSelect("admin");
                    setShowLoginModal(true);
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </button>

                <button
                  onClick={() => {
                    handleRoleSelect("manager");
                    setShowLoginModal(true);
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Manager</span>
                </button>
              </div>

              {/* Database highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Database: <code>inventory_management</code></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Tables: <code>products</code>, <code>prod_in</code>, <code>prod_out</code></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Audit: <code>stock_transactions</code></span>
                </span>
              </div>
            </div>

            {/* Right Column: Embedded Login Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8">
                
                {/* Role Switcher Tabs */}
                <div className="mb-6">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Sign In to Dashboard</h2>
                    <p className="text-xs text-slate-500 mt-1">Select your role to load credentials</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect("admin")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRole === "admin"
                          ? "bg-white text-purple-700 shadow-sm border border-purple-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Admin Role</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSelect("manager")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRole === "manager"
                          ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Manager Role</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                        placeholder="admin@inventory.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                      selectedRole === "admin"
                        ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                    }`}
                  >
                    <span>{loading ? "Signing in..." : `Open ${selectedRole === "admin" ? "Admin" : "Manager"} Dashboard`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Role description note */}
                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-start gap-2">
                  <span className="font-semibold text-slate-700 whitespace-nowrap">
                    {selectedRole === "admin" ? "Admin Privileges:" : "Manager Privileges:"}
                  </span>
                  <span>
                    {selectedRole === "admin"
                      ? "Full permissions (user management, delete items, Product In/Out, full audit log)."
                      : "Operational permissions (Product In, Product Out, adding & editing products)."}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Features & System Breakdown */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600">Core Modules</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Everything Needed for Production Inventory
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Connected directly to your XAMPP MySQL tables: <code>products</code>, <code>prod_in</code>, <code>prod_out</code>, and <code>stock_transactions</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Product In */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ArrowDownToLine className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Product In (Receiving)</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Log incoming merchandise shipments, update current stock automatically, and maintain a permanent receiving history in <code>prod_in</code>.
              </p>
            </div>

            {/* Feature 2: Product Out */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <ArrowUpFromLine className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Product Out (Dispatch)</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Fulfill sales orders and write-offs. Automatically validates stock availability so inventory never drops below zero.
              </p>
            </div>

            {/* Feature 3: Catalog Management */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Product Catalog</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Full search by name or SKU, category filtering, pricing, and automated low-stock warnings when below minimum limits.
              </p>
            </div>

            {/* Feature 4: Role-Based Access */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Admin & Manager Roles</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Admins have full deletion and user management controls, while Managers have an operational workspace tailored for stock workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">StockFlow Inventory System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Powered by React 18 + Node.js + Express</span>
            <span>•</span>
            <span>XAMPP MySQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
