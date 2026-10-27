import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { ArrowUpFromLine, RefreshCw, CheckCircle2, AlertCircle, Package } from "lucide-react";

export default function ProductOutPage() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoadingHistory(true);
    try {
      const [prods, outRecords] = await Promise.all([
        api.getProducts(),
        api.getProdOutHistory()
      ]);
      setProducts(prods);
      setHistory(outRecords);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(String(prods[0].id));
      }
    } catch (err) {
      console.error("Failed to load Product Out data:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
  const currentStock = selectedProduct ? Number(selectedProduct.stock) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage(null);

    const qty = Number(quantity);
    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    if (qty > currentStock) {
      setError(`Cannot dispatch ${qty} units. Current stock is only ${currentStock}.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.productOut({
        product_id: Number(selectedProductId),
        quantity: qty,
        notes: notes || "Dispatched via Product Out form"
      });

      setMessage(res.message || `Successfully dispatched ${qty} units!`);
      setQuantity(1);
      setNotes("");

      loadData();
    } catch (err) {
      setError(err.message || "Failed to process Product Out entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Out (Dispatch & Sales)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch stock to fulfill customer orders or write-offs and record entries into the <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">prod_out</code> table.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin text-amber-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 self-start">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>New Stock Out Entry</span>
          </h2>

          {message && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Select Product *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-sm bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Available: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex justify-between items-center">
                <span className="text-slate-500">Available In Stock:</span>
                <span className={`font-bold ${currentStock > 0 ? "text-slate-800" : "text-rose-600"}`}>
                  {currentStock} units
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Quantity to Dispatch *
              </label>
              <input
                type="number"
                min="1"
                max={currentStock}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Order Reference / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Sales order #1042 / Client delivery"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || currentStock === 0 || products.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>{submitting ? "Dispatching..." : "Confirm Product Out"}</span>
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Recent `prod_out` Records</h2>
              <p className="text-xs text-slate-400 mt-0.5">Logs recorded directly into the XAMPP database</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {history.length} Entries
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            {loadingHistory && history.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading prod_out records...</div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No Product Out records yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-center">Dispatched</th>
                    <th className="py-3 px-4">Handled By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(row.date).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{row.product_name || `ID #${row.product_id}`}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{row.product_sku || "—"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          -{row.quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {row.handled_by || "System"}
                        {row.user_role && (
                          <span className="ml-1.5 text-[10px] uppercase font-bold text-slate-400">
                            ({row.user_role})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
