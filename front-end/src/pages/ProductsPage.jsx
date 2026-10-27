import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  Package, 
  Search, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Edit3, 
  Trash2, 
  Filter, 
  RefreshCw 
} from "lucide-react";
import ProductModal from "../components/ProductModal";
import StockActionModal from "../components/StockActionModal";

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockModalType, setStockModalType] = useState("IN"); // 'IN' or 'OUT'

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        search: searchTerm,
        category: selectedCategory
      });
      setProducts(data);

      // Extract unique categories
      const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedCategory]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'?`)) return;

    try {
      await api.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const handleOpenProductIn = (product) => {
    setStockModalProduct(product);
    setStockModalType("IN");
  };

  const handleOpenProductOut = (product) => {
    setStockModalProduct(product);
    setStockModalType("OUT");
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500">Manage catalog products and direct inventory adjustments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No products found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Threshold</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const stock = Number(p.stock) || 0;
                  const minStock = Number(p.minimum_stock) || 5;
                  const isOutOfStock = stock === 0;
                  const isLowStock = !isOutOfStock && stock <= minStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{p.sku}</td>
                      <td className="py-3.5 px-4 text-slate-500">{p.category || "—"}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        ${Number(p.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOutOfStock
                              ? "bg-rose-100 text-rose-700"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {stock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                        {minStock}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Product In Quick Button */}
                          <button
                            onClick={() => handleOpenProductIn(p)}
                            title="Product In (Receive Stock)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            <span>In</span>
                          </button>

                          {/* Product Out Quick Button */}
                          <button
                            onClick={() => handleOpenProductOut(p)}
                            title="Product Out (Dispatch Stock)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition-colors"
                          >
                            <ArrowUpFromLine className="w-3.5 h-3.5" />
                            <span>Out</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button (Admin Only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Delete Product (Admin Only)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        onSuccess={fetchProducts}
      />

      <StockActionModal
        isOpen={Boolean(stockModalProduct)}
        onClose={() => setStockModalProduct(null)}
        product={stockModalProduct}
        actionType={stockModalType}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
