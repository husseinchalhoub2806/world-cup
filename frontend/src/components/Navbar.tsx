import { LogOut, Menu, Shield, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const NAV_LINKS = [
  { to: "/dashboard",   label: "Dashboard"   },
  { to: "/predictions", label: "Predictions" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { clearAuth(); navigate("/"); };

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
        borderBottom: "3px solid #f97316",
        boxShadow: "0 4px 24px rgba(30,58,138,0.5), 0 0 0 0 transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
            <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.9))" }}>⚽</span>
            <span style={{ color: "#fbbf24", textShadow: "0 0 12px rgba(251,191,36,0.5)" }}>World Cup</span>
            <span className="text-white font-medium opacity-90">Predictions</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white text-blue-700"
                      : "text-blue-100 hover:text-white hover:bg-white/20"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-orange-400 text-white"
                      : "text-orange-300 hover:text-white hover:bg-orange-500/30"
                  }`
                }
              >
                <Shield size={14} />
                Admin
              </NavLink>
            )}
          </div>

          {/* User + logout */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-blue-200">
              Hey, <span className="text-white font-bold">{user?.nickname}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-blue-200 hover:text-red-300 transition-colors text-sm font-medium"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white hover:text-yellow-300 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-3 space-y-1"
          style={{ background: "#1e40af", borderTop: "1px solid rgba(255,255,255,0.15)" }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? "bg-white text-blue-700" : "text-blue-100 hover:text-white hover:bg-white/20"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-orange-300 hover:bg-orange-500/20"
            >
              <Shield size={14} /> Admin Panel
            </NavLink>
          )}
          <hr className="border-white/20 my-2" />
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-white font-bold">{user?.nickname}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-300 text-sm font-medium">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
