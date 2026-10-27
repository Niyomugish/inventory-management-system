import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  ScanBarcode,
  Users, 
  LogOut, 
  ShieldCheck, 
  UserCheck 
} from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "scanner", label: "Price Scanner", icon: ScanBarcode },
    { id: "product-in", label: "Product In", icon: ArrowDownToLine, badge: "Stock In" },
    { id: "product-out", label: "Product Out", icon: ArrowUpFromLine },
    { id: "transactions", label: "Audit Log", icon: History },
  ];

  if (isAdmin) {
    navItems.push({ id: "users", label: "Users", icon: Users });
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">StockFlow</span>
              <span className="block text-xs text-slate-500 font-medium -mt-1">Inventory Management</span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800 leading-none">{user?.name || "User"}</span>
              <span className="text-xs text-slate-500">{user?.email}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border shadow-xs"
              style={{
                backgroundColor: isAdmin ? "#f5f3ff" : "#eff6ff",
                borderColor: isAdmin ? "#ddd6fe" : "#bfdbfe",
                color: isAdmin ? "#6d28d9" : "#1d4ed8"
              }}>
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{user?.role}</span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center overflow-x-auto py-2 border-t border-slate-100 gap-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap text-xs font-medium ${
                  isActive ? "bg-blue-600 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
