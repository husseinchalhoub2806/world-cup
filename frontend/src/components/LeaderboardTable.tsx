import type { LeaderboardEntry } from "../types";
import { useAuthStore } from "../store/authStore";

interface Props {
  entries: LeaderboardEntry[];
  compact?: boolean;
}

export default function LeaderboardTable({ entries, compact = false }: Props) {
  const { user } = useAuthStore();

  if (entries.length === 0)
    return <p className="text-gray-400 text-center py-8">No rankings yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest border-b border-gray-100" style={{ color: "#2563eb" }}>
            <th className="pb-3 pr-4">Rank</th>
            <th className="pb-3 pr-4">Player</th>
            {!compact && <th className="pb-3 pr-4">Predictions</th>}
            <th className="pb-3 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isMe = user?.id === entry.user_id;
            const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

            return (
              <tr
                key={entry.user_id}
                className="border-b border-gray-50 transition-colors"
                style={{ backgroundColor: isMe ? "rgba(249,115,22,0.06)" : undefined }}
                onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#fafafa"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isMe ? "rgba(249,115,22,0.06)" : ""; }}
              >
                <td className="py-3.5 pr-4">
                  {medal
                    ? <span className="text-xl">{medal}</span>
                    : <span className="text-gray-400 font-bold">{entry.rank}</span>}
                </td>
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold" style={{ color: isMe ? "#f97316" : "#1e293b" }}>
                      {entry.nickname}
                    </span>
                    <span className="text-sm text-gray-400">({entry.real_name})</span>
                    {isMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>
                        you
                      </span>
                    )}
                    {entry.title && (
                      <span className="text-xs font-bold" style={{ color: "#eab308" }}>{entry.title}</span>
                    )}
                  </div>
                </td>
                {!compact && (
                  <td className="py-3.5 pr-4 text-gray-400 text-sm">{entry.prediction_count}</td>
                )}
                <td className="py-3.5 text-right">
                  <span
                    className="font-black text-lg"
                    style={entry.rank === 1 ? { color: "#f97316" } : { color: "#1e293b" }}
                  >
                    {entry.total_points}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">pts</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
