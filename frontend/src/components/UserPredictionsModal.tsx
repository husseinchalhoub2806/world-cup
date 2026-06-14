import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect } from "react";
import { usersApi } from "../api/users";
import type { LeaderboardEntry } from "../types";
import { formatMatchDate } from "../utils/dates";

interface Props {
  entry: LeaderboardEntry;
  onClose: () => void;
}

export default function UserPredictionsModal({ entry, onClose }: Props) {
  const { data: predictions = [], isLoading, isError } = useQuery({
    queryKey: ["user-predictions", entry.user_id],
    queryFn: () => usersApi.getPredictions(entry.user_id),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned ?? 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-black text-gray-900 text-base">
              {entry.nickname}
              <span className="text-gray-400 font-normal text-sm ml-2">({entry.real_name})</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {predictions.length} prediction{predictions.length !== 1 ? "s" : ""} · {totalPoints} pts total
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-4">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading && (
            <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
          )}
          {isError && (
            <p className="text-sm text-red-400 text-center py-12">Failed to load predictions.</p>
          )}
          {!isLoading && !isError && predictions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-12">No predictions to show yet.</p>
          )}
          {!isLoading && !isError && predictions.length > 0 && (
            <div className="space-y-2">
              {predictions.map((p) => {
                const isFinished = p.match_status === "finished";
                const winnerLabel =
                  p.predicted_winner === "team1" ? p.match_team1
                  : p.predicted_winner === "team2" ? p.match_team2
                  : "Tie";

                const pointsColor =
                  p.points_earned === null ? "text-gray-400"
                  : p.points_earned >= 6 ? "text-purple-500"
                  : p.points_earned === 3 ? "text-yellow-500"
                  : p.points_earned > 0 ? "text-green-500"
                  : "text-gray-400";

                return (
                  <div
                    key={p.match_id}
                    className="rounded-xl p-3.5"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    {/* Match name + date */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 leading-tight">
                          {p.match_team1} <span className="text-gray-400 font-normal">vs</span> {p.match_team2}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatMatchDate(p.match_datetime)}</p>
                      </div>

                      {/* Points badge */}
                      <div className="shrink-0 text-right">
                        {p.points_earned !== null ? (
                          <span className={`font-black text-base ${pointsColor}`}>
                            {p.points_earned > 0 ? `+${p.points_earned}` : "0"} pts
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">pending</span>
                        )}
                      </div>
                    </div>

                    {/* Scores row */}
                    <div className="flex items-center gap-3">
                      {/* User's prediction */}
                      <div
                        className="flex-1 rounded-lg px-3 py-2 text-center"
                        style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)" }}
                      >
                        <p className="text-xs text-gray-400 mb-0.5">Predicted</p>
                        <p className="font-black text-gray-900 text-sm">
                          {p.predicted_score_team1} – {p.predicted_score_team2}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{winnerLabel}</p>
                      </div>

                      {/* Joker indicator */}
                      {p.joker_applied && (
                        <span className="text-lg" title="Joker applied">🃏</span>
                      )}

                      {/* Actual result */}
                      {isFinished && p.match_score_team1 !== null && p.match_score_team2 !== null ? (
                        <div
                          className="flex-1 rounded-lg px-3 py-2 text-center"
                          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
                        >
                          <p className="text-xs text-gray-400 mb-0.5">Result</p>
                          <p className="font-black text-gray-900 text-sm">
                            {p.match_score_team1} – {p.match_score_team2}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 rounded-lg px-3 py-2 text-center"
                          style={{ background: "rgba(107,114,128,0.05)", border: "1px solid rgba(107,114,128,0.15)" }}
                        >
                          <p className="text-xs text-gray-400 mb-0.5">Result</p>
                          <p className="text-xs text-gray-400 font-semibold capitalize">{p.match_status}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
