import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  Package, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  CheckCircle2 
} from "lucide-react";

export default function DashboardPage({ setActiveTab, onOpenProductIn }) {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const stats = summary?.stats || {};
  const lowStockItems = summary?.low_stock_items || [];

  return (
    <div className="space-y-6">
      {/* Role Banner / Context */}
      <div className={`p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isAdmin 
          ? "bg-gradient-to-r from-purple-50 via-indigo-50 to-white border-purple-200" 
          : "bg-gradient-to-r from-blue-50 via-sky-50 to-white border-blue-200"
      }`}>
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isAdmin ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "bg-blue-600 text-white shadow-md shadow-blue-200"
          }`}>
            {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {isAdmin ? "Admin Executive Dashboard" : "Manager Operations Dashboard"}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isAdmin ? "bg-purple-200/80 text-purple-900" : "bg-blue-200/80 text-blue-900"
              }`}>
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {isAdmin 
                ? "Full system control: User management, database auditing, product deletion, and stock monitoring."
                : "Operational workspace: Stock receiving (Product In), dispatch fulfillment (Product Out), and catalog updates."}
            </p>
          </div>
        </div>

        {/* Action button inside banner */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isAdmin ? (
            <button
              onClick={() => setActiveTab("users")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage Accounts</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("product-in")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Record Product In</span>
            </button>
          )}

          <button
            onClick={loadSummary}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Products</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {loading ? "..." : stats.total_products || 0}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">Catalog items</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Units on Hand</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {loading ? "..." : stats.total_stock_units || 0}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">Total physical units</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Valuation</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {loading ? "..." : `FRW${Number(stats.total_inventory_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">Estimated retail value</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between{
          Number(stats.low_stock_count) > 0 ? "bg-amber-50/60 border-amber-200/80" : "bg-white border-slate-100"
        }`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block text-amber-700">
              Low Stock Alerts
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {loading ? "..." : stats.low_stock_count || 0}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {Number(stats.out_of_stock_count || 0)} out of stock
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Restock Attention Required Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900">Restock Attention Required</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {lowStockItems.length} items below minimum threshold
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">All inventory levels are healthy! No low-stock items detected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Min. Stock</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.category || "—"}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.stock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                      {item.minimum_stock} units
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenProductIn(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>Restock (Product In)</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab("products")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Product Catalog</h3>
              <p className="text-xs text-slate-500 mt-0.5">Browse, search, edit, or add products</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("product-in")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Product In (Stock In)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Record new inventory arrival logs</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("transactions")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Audit History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Complete history of all stock movements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
