import React, { useState } from "react";
import { api } from "../services/api";
import { X, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from "lucide-react";

export default function StockActionModal({ isOpen, onClose, product, actionType = "IN", onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !product) return null;

  const isProductIn = actionType === "IN";
  const currentStock = Number(product.stock) || 0;
  const numQty = Number(quantity) || 0;
  const projectedStock = isProductIn ? currentStock + numQty : Math.max(0, currentStock - numQty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (numQty <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (!isProductIn && numQty > currentStock) {
      setError(`Cannot dispatch more than current stock (${currentStock}).`);
      return;
    }

    setLoading(true);

    try {
      if (isProductIn) {
        await api.productIn({
          product_id: product.id,
          quantity: numQty,
          notes: notes || "Restocked via dashboard"
        });
      } else {
        await api.productOut({
          product_id: product.id,
          quantity: numQty,
          notes: notes || "Dispatched via dashboard"
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to process stock movement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isProductIn ? "bg-emerald-50/70 border-emerald-100" : "bg-amber-50/70 border-amber-100"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isProductIn ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
            }`}>
              {isProductIn ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-none">
                {isProductIn ? "Product In (Receive Stock)" : "Product Out (Dispatch Stock)"}
              </h3>
              <span className="text-xs text-slate-500 font-mono mt-0.5 block">{product.sku}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Product</span>
            <p className="text-sm font-bold text-slate-800">{product.name}</p>
          </div>

          {/* Stock comparison badge */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Current Stock</span>
              <span className="text-lg font-bold text-slate-700">{currentStock}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Projected Stock</span>
              <span className={`text-lg font-bold ${isProductIn ? "text-emerald-600" : "text-amber-600"}`}>
                {projectedStock}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Quantity to {isProductIn ? "Add" : "Deduct"} *
            </label>
            <input
              type="number"
              min="1"
              max={!isProductIn ? currentStock : undefined}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Notes / Reason (Optional)
            </label>
            <input
              type="text"
              placeholder={isProductIn ? "e.g., Shipment from Supplier X" : "e.g., Order #1042 dispatch"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 ${
                isProductIn
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
              }`}
            >
              {loading ? "Processing..." : isProductIn ? "Confirm Product In" : "Confirm Product Out"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
