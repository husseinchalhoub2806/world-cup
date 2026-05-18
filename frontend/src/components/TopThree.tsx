import { Crown } from "lucide-react";
import type { LeaderboardEntry } from "../types";

interface Props { entries: LeaderboardEntry[]; }

const MEDALS = ["🥇", "🥈", "🥉"];
const HEIGHTS = ["h-28", "h-20", "h-16"];

const AVATAR_STYLES = [
  { background: "linear-gradient(135deg,#f97316 0%,#fbbf24 100%)", boxShadow: "0 0 20px rgba(249,115,22,0.6)" },
  { background: "linear-gradient(135deg,#3b82f6 0%,#60a5fa 100%)", boxShadow: "0 0 14px rgba(59,130,246,0.5)" },
  { background: "linear-gradient(135deg,#22c55e 0%,#4ade80 100%)", boxShadow: "0 0 14px rgba(34,197,94,0.5)" },
];

const PODIUM_STYLES = [
  { background: "linear-gradient(180deg,#f97316 0%,#ea580c 100%)", boxShadow: "0 0 20px rgba(249,115,22,0.4)" },
  { background: "linear-gradient(180deg,#3b82f6 0%,#1d4ed8 100%)", boxShadow: "0 0 14px rgba(59,130,246,0.3)" },
  { background: "linear-gradient(180deg,#22c55e 0%,#16a34a 100%)", boxShadow: "0 0 14px rgba(34,197,94,0.3)" },
];

export default function TopThree({ entries }: Props) {
  if (entries.length === 0)
    return <div className="text-center py-12 text-gray-400"><p>No rankings yet — be the first to predict!</p></div>;

  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-6 py-6">
      {podiumOrder.map((entry) => {
        const rank        = entry.rank;
        const heightClass = rank === 1 ? HEIGHTS[0] : rank === 2 ? HEIGHTS[1] : HEIGHTS[2];
        const avatarStyle = rank <= 3 ? AVATAR_STYLES[rank - 1] : AVATAR_STYLES[2];
        const podiumStyle = rank <= 3 ? PODIUM_STYLES[rank - 1] : PODIUM_STYLES[2];
        const medal       = MEDALS[rank - 1] || "";
        const isFirst     = rank === 1;

        return (
          <div key={entry.user_id} className="flex flex-col items-center gap-2 animate-fade-in">
            {isFirst && (
              <Crown size={22} className="mb-1" style={{ color: "#f97316", filter: "drop-shadow(0 0 6px rgba(249,115,22,0.8))" }} />
            )}

            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-black text-white"
              style={avatarStyle}
            >
              {entry.nickname.slice(0, 2).toUpperCase()}
            </div>

            {/* Name + points */}
            <div className="text-center">
              <p className="font-black text-gray-900 text-sm">{entry.nickname}</p>
              {entry.title && (
                <p className="text-xs font-bold" style={{ color: "#f97316" }}>{entry.title}</p>
              )}
              <p
                className="text-2xl font-black mt-0.5"
                style={isFirst
                  ? { color: "#f97316", textShadow: "0 0 10px rgba(249,115,22,0.5)" }
                  : { color: "#1d4ed8" }}
              >
                {entry.total_points}
              </p>
              <p className="text-xs text-gray-400">pts</p>
            </div>

            {/* Podium block */}
            <div className={`w-20 ${heightClass} rounded-t-lg flex items-start justify-center pt-2`} style={podiumStyle}>
              <span className="text-xl">{medal}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
