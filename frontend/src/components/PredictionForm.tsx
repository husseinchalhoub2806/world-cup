import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Match, PredictedWinner, PredictionWithMatch } from "../types";
import { predictionsApi } from "../api/predictions";
import { authApi } from "../api/auth";
import { getErrorMessage } from "../api/client";

interface Props {
  match: Match;
  existing?: PredictionWithMatch;
  onClose: () => void;
}

export default function PredictionForm({ match, existing, onClose }: Props) {
  const queryClient = useQueryClient();
  const [score1, setScore1] = useState(existing?.predicted_score_team1 ?? 0);
  const [score2, setScore2] = useState(existing?.predicted_score_team2 ?? 0);
  const [useJoker, setUseJoker] = useState(existing?.joker_applied ?? false);

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    staleTime: 30_000,
  });

  const derivedWinner: PredictedWinner =
    score1 > score2 ? "team1" : score2 > score1 ? "team2" : "tie";

  // Joker already applied to this prediction counts as "used", not "available"
  const availableJokers = (currentUser?.joker_balance ?? 0);
  const canToggleJoker = availableJokers > 0 || (existing?.joker_applied ?? false);

  const mutation = useMutation({
    mutationFn: () =>
      predictionsApi.submit(match.id, {
        predicted_winner: derivedWinner,
        predicted_score_team1: score1,
        predicted_score_team2: score2,
        joker_applied: useJoker,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Prediction saved!");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const winnerLabel = derivedWinner === "team1" ? match.team1 : derivedWinner === "team2" ? match.team2 : "Tie 🤝";

  const ScoreButton = ({ onClick, children }: { onClick: () => void; children: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-xl font-black text-white text-lg transition-all duration-150"
      style={{ background: "linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)", boxShadow: "0 0 8px rgba(59,130,246,0.4)" }}
      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(59,130,246,0.6)")}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(59,130,246,0.4)")}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-xl text-gray-900">Make Your Prediction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-1">
            <X size={20} />
          </button>
        </div>

        {/* Match banner */}
        <div
          className="rounded-xl p-4 mb-6 text-center"
          style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)" }}
        >
          <p className="text-blue-200 text-xs mb-1 font-semibold uppercase tracking-wider">Match</p>
          <p className="font-black text-white text-lg">{match.team1} vs {match.team2}</p>
        </div>

        {/* Score inputs */}
        <div className="mb-5">
          <p className="label text-center mb-4">Enter your predicted final score</p>
          <div className="flex items-center justify-center gap-6">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-gray-700">{match.team1}</span>
              <div className="flex items-center gap-2">
                <ScoreButton onClick={() => setScore1(Math.max(0, score1 - 1))}>−</ScoreButton>
                <span className="w-12 text-center text-4xl font-black text-gray-900">{score1}</span>
                <ScoreButton onClick={() => setScore1(Math.min(30, score1 + 1))}>+</ScoreButton>
              </div>
            </div>

            <span className="text-3xl font-black text-gray-300 mb-1">–</span>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-gray-700">{match.team2}</span>
              <div className="flex items-center gap-2">
                <ScoreButton onClick={() => setScore2(Math.max(0, score2 - 1))}>−</ScoreButton>
                <span className="w-12 text-center text-4xl font-black text-gray-900">{score2}</span>
                <ScoreButton onClick={() => setScore2(Math.min(30, score2 + 1))}>+</ScoreButton>
              </div>
            </div>
          </div>
        </div>

        {/* Derived winner */}
        <div
          className="rounded-xl p-3 mb-5 text-center"
          style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}
        >
          <p className="text-sm text-gray-600">
            Winner: <span className="font-black" style={{ color: "#f97316" }}>{winnerLabel}</span>
          </p>
        </div>

        {/* Points reminder */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <p className="text-xs text-gray-500">Correct winner</p>
            <p className="font-black text-blue-600 text-lg">{useJoker ? "2 pts" : "1 pt"}</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)" }}>
            <p className="text-xs text-gray-500">Exact score</p>
            <p className="font-black text-yellow-500 text-lg">{useJoker ? "6 pts" : "3 pts"}</p>
          </div>
        </div>

        {/* Joker toggle */}
        {(canToggleJoker || useJoker) && (
          <div
            className="rounded-xl p-4 mb-5"
            style={{
              background: useJoker ? "rgba(168,85,247,0.1)" : "rgba(107,114,128,0.06)",
              border: useJoker ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(107,114,128,0.2)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800">
                  🃏 Use Joker
                  {availableJokers > 0 && (
                    <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(168,85,247,0.15)", color: "#9333ea" }}>
                      {availableJokers} available
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {useJoker ? "Points will be doubled for this prediction" : "Double your points for this match"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!useJoker && availableJokers <= 0) return;
                  setUseJoker(!useJoker);
                }}
                disabled={!useJoker && availableJokers <= 0}
                className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: useJoker ? "#9333ea" : "#d1d5db" }}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
                  style={{ transform: useJoker ? "translateX(22px)" : "translateX(2px)" }}
                />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? "Saving..." : existing ? "Update" : "Submit Prediction"}
          </button>
        </div>
      </div>
    </div>
  );
}
