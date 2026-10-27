import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { History, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Filter } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions({
        type: filterType,
        limit: 100
      });
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load audit history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log & Stock Transactions</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete history of all stock movements recorded in <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">stock_transactions</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Type */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="outline-none bg-transparent font-semibold text-slate-700 cursor-pointer"
            >
              <option value="">All Movements</option>
              <option value="IN">Product In (IN)</option>
              <option value="OUT">Product Out (OUT)</option>
            </select>
          </div>

          <button
            onClick={fetchTransactions}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No stock transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Stock Change</th>
                  <th className="py-3 px-4 text-center">New Stock</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isIn = tx.type === "IN";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {tx.product_name || `Product #${tx.product_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {tx.product_sku || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isIn
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isIn ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                          <span>{tx.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-xs text-slate-600">
                          {tx.previous_stock}
                        </span>
                        <span className={`mx-1 font-bold ${isIn ? "text-emerald-600" : "text-amber-600"}`}>
                          {isIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {tx.new_stock}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {tx.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {tx.handled_by || "System"}
                        {tx.user_role && (
                          <span className="ml-1 text-[10px] uppercase font-bold text-slate-400">
                            ({tx.user_role})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
