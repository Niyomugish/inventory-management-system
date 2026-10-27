import React, { lazy, Suspense, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import IndexPage from "./pages/IndexPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ProductInPage from "./pages/ProductInPage";
import ProductOutPage from "./pages/ProductOutPage";
import TransactionsPage from "./pages/TransactionsPage";
import UsersPage from "./pages/UsersPage";
import StockActionModal from "./components/StockActionModal";
import { Loader2 } from "lucide-react";

const PriceCheckerPage = lazy(() => import("./pages/PriceCheckerPage"));

function ScannerLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Quick Restock modal from Dashboard
  const [quickProduct, setQuickProduct] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <span className="text-sm text-slate-500 font-medium">Connecting to Inventory System...</span>
      </div>
    );
  }

  // If not logged in, display the beautiful Index Page with Login portal
  if (!user) {
    return isScannerOpen
      ? (
        <Suspense fallback={<ScannerLoading />}>
          <PriceCheckerPage onBack={() => setIsScannerOpen(false)} />
        </Suspense>
      )
      : <IndexPage onOpenScanner={() => setIsScannerOpen(true)} />;
  }

  if (activeTab === "scanner") {
    return (
      <Suspense fallback={<ScannerLoading />}>
        <PriceCheckerPage onBack={() => setActiveTab("dashboard")} />
      </Suspense>
    );
  }

  // Once authenticated, display the respective role dashboard and page switcher
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
        {activeTab === "dashboard" && (
          <DashboardPage 
            setActiveTab={setActiveTab} 
            onOpenProductIn={(prod) => setQuickProduct(prod)} 
          />
        )}
        {activeTab === "products" && <ProductsPage />}
        {activeTab === "product-in" && <ProductInPage />}
        {activeTab === "product-out" && <ProductOutPage />}
        {activeTab === "transactions" && <TransactionsPage />}
        {activeTab === "users" && <UsersPage />}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StockFlow Inventory Management System</span>
          <span className="font-mono text-slate-500">Database store (inventory_management)</span>
        </div>
      </footer>

      {/* Quick Action Modal for Restock from Dashboard */}
      {quickProduct && (
        <StockActionModal
          isOpen={Boolean(quickProduct)}
          onClose={() => setQuickProduct(null)}
          product={quickProduct}
          actionType="IN"
          onSuccess={() => {
            setQuickProduct(null);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
