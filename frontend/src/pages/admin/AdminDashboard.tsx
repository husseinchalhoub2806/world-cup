import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import LeaderboardTable from "../../components/LeaderboardTable";

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.listUsers });
  const { data: matches = [] } = useQuery({ queryKey: ["admin-matches"], queryFn: adminApi.listMatches });
  const { data: predictions = [] } = useQuery({ queryKey: ["admin-predictions"], queryFn: adminApi.listPredictions });
  const { data: leaderboard } = useQuery({ queryKey: ["admin-leaderboard"], queryFn: adminApi.getLeaderboard });

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved" && u.role !== "admin");
  const upcoming = matches.filter((m) => m.status === "scheduled");
  const needsResult = matches.filter((m) => m.status === "live" || (m.status === "scheduled" && new Date(m.match_datetime + "Z") < new Date()));

  const STATS = [
    { label: "Pending Approvals", value: pending.length,     accent: "#eab308", emoji: "⏳" },
    { label: "Active Players",    value: approved.length,    accent: "#22c55e", emoji: "👥" },
    { label: "Upcoming Matches",  value: upcoming.length,    accent: "#3b82f6", emoji: "📅" },
    { label: "Total Predictions", value: predictions.length, accent: "#f97316", emoji: "🎯" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black" style={{ color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, accent, emoji }) => (
          <div key={label} className="card text-center" style={{ borderTop: `4px solid ${accent}` }}>
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-3xl font-black" style={{ color: accent }}>{value}</div>
            <div className="text-gray-500 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Pending users alert */}
      {pending.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4">
          <h3 className="font-bold text-yellow-400 mb-2">
            ⚠️ {pending.length} user{pending.length > 1 ? "s" : ""} awaiting approval
          </h3>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  <strong>{u.nickname}</strong> ({u.real_name})
                </span>
              </div>
            ))}
          </div>
          <a href="/admin/users" className="text-yellow-400 text-sm font-medium mt-3 inline-block hover:underline">
            Manage users →
          </a>
        </div>
      )}

      {/* Matches needing result */}
      {needsResult.length > 0 && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
          <h3 className="font-bold text-red-400 mb-2">
            ⚠️ {needsResult.length} match{needsResult.length > 1 ? "es" : ""} need{needsResult.length === 1 ? "s" : ""} a result
          </h3>
          <a href="/admin/matches" className="text-red-400 text-sm font-medium hover:underline">
            Enter results →
          </a>
        </div>
      )}

      {/* Leaderboard */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Current Leaderboard</h2>
        <LeaderboardTable entries={leaderboard?.entries ?? []} />
      </div>
    </div>
  );
}
