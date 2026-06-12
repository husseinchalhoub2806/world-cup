import { BarChart3, List, Trophy, Users } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/matches", label: "Matches", icon: List },
  { to: "/admin/predictions", label: "Predictions", icon: Trophy },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Admin header */}
      <header className="bg-gray-900 border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl">⚽</Link>
            <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Admin Panel</span>
          </div>
          <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Player view
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Mobile nav — above content */}
        <div className="md:hidden flex gap-1 mb-4 bg-gray-900/60 rounded-xl p-1">
          {ADMIN_NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? "bg-amber-900/30 text-amber-400" : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop only */}
          <aside className="w-48 shrink-0 hidden md:block">
            <nav className="space-y-1">
              {ADMIN_NAV.map(({ to, label, icon: Icon, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-900/30 text-amber-400 border border-amber-800/50"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
