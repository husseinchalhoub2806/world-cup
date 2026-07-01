import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { predictionsApi } from "../api/predictions";
import type { Match, MatchPredictionPublic } from "../types";

interface Props {
  match: Match;
  onClose: () => void;
}

export default function MatchPredictionsModal({ match, onClose }: Props) {
  const [predictions, setPredictions] = useState<MatchPredictionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    predictionsApi
      .matchPredictions(match.id)
      .then(setPredictions)
      .catch(() => setError("Failed to load predictions"))
      .finally(() => setLoading(false));
  }, [match.id]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-black text-gray-900 text-sm">
              {match.score_team1 !== null && match.score_team2 !== null ? (
                <>
                  {match.team1}{" "}
                  <span className="text-gray-900">{match.score_team1} – {match.score_team2}</span>{" "}
                  {match.team2}
                </>
              ) : (
                <>{match.team1} <span className="text-gray-400 font-normal">vs</span> {match.team2}</>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Player predictions</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          )}
          {error && (
            <p className="text-sm text-red-400 text-center py-8">{error}</p>
          )}
          {!loading && !error && predictions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No predictions for this match</p>
          )}
          {!loading && !error && predictions.length > 0 && (
            <>
              {/* Column headers */}
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs text-gray-400 font-semibold">Player</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-semibold">Prediction</span>
                  {(match.status === "finished" || match.status === "live") && (
                    <span className="text-xs text-gray-400 font-semibold w-10 text-right">Pts</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                {predictions.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50"
                  >
                    <span className="font-semibold text-sm text-gray-800">{p.nickname}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-gray-900">
                        {p.predicted_score_team1} – {p.predicted_score_team2}
                      </span>
                      {match.status === "finished" && (
                        <span className={`text-sm font-black w-10 text-right ${
                          p.points_earned === 3 ? "text-green-600" :
                          p.points_earned === 2 ? "text-blue-600" :
                          p.points_earned === 1 ? "text-yellow-600" :
                          "text-gray-400"
                        }`}>
                          {p.points_earned ?? 0} pts
                        </span>
                      )}
                      {match.status === "live" && (
                        <span className="text-xs font-semibold text-orange-500 w-10 text-right">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
