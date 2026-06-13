import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import type { MatchStatus } from "../../types";
import { formatMatchDateTime } from "../../utils/dates";

const STATUS_FILTERS: { label: string; value: MatchStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Live", value: "live" },
  { label: "Finished", value: "finished" },
  { label: "Draft", value: "draft" },
];

const STATUS_BADGE: Record<MatchStatus, string> = {
  draft:     "bg-blue-900/60 text-blue-300",
  scheduled: "badge-scheduled",
  live:      "badge-live",
  finished:  "bg-gray-800 text-gray-400",
  cancelled: "bg-gray-800 text-gray-500",
};

export default function AdminPredictions() {
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ["admin-predictions"],
    queryFn: adminApi.listPredictions,
  });

  // Group by match, preserving insertion order
  const byMatch = new Map<number, typeof predictions>();
  for (const p of predictions) {
    if (!byMatch.has(p.match_id)) byMatch.set(p.match_id, []);
    byMatch.get(p.match_id)!.push(p);
  }

  // Sort match groups by datetime ascending, then apply status filter
  const sortedGroups = Array.from(byMatch.values())
    .sort((a, b) => a[0].match_datetime.localeCompare(b[0].match_datetime))
    .filter((preds) => statusFilter === "all" || preds[0].match_status === statusFilter);

  const filteredCount = sortedGroups.reduce((n, preds) => n + preds.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">All Predictions</h1>
        <span className="text-gray-500 text-sm">{filteredCount} shown</span>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => {
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-amber-900/40 text-amber-400 border border-amber-700/50"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sortedGroups.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No predictions for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map((preds) => {
            const first = preds[0];
            return (
              <div key={first.match_id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-black text-sm sm:text-base">
                      {first.match_team1} vs {first.match_team2}
                    </h3>
                    <p className="text-xs text-gray-400">{formatMatchDateTime(first.match_datetime)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[first.match_status]}`}>
                    {first.match_status}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                        <th className="pb-2 pr-4 text-left">User</th>
                        <th className="pb-2 pr-4 text-center">Prediction</th>
                        <th className="pb-2 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {preds.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-800/20">
                          <td className="py-2 pr-4">
                            <div className="font-medium text-black text-sm">{p.user_real_name}</div>
                            <div className="text-gray-500 text-xs hidden sm:block">{p.user_nickname}</div>
                          </td>
                          <td className="py-2 pr-4 text-center">
                            <span className="text-black font-mono font-semibold">
                              {p.predicted_score_team1} – {p.predicted_score_team2}
                            </span>
                            <span className="text-gray-400 text-xs ml-2 hidden sm:inline">
                              ({p.predicted_winner === "team1"
                                ? first.match_team1
                                : p.predicted_winner === "team2"
                                ? first.match_team2
                                : "Tie"})
                            </span>
                            {p.joker_applied && (
                              <span className="ml-2 text-xs font-bold" style={{ color: "#c084fc" }}>🃏</span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            {p.points_earned !== null ? (
                              <span className={`font-bold ${p.points_earned > 0 ? "text-green-400" : "text-gray-500"}`}>
                                {p.points_earned > 0 ? `+${p.points_earned}` : "0"}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
