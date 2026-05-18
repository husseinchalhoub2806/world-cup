import { Clock, Lock } from "lucide-react";
import type { Match, PredictionWithMatch } from "../types";
import { formatMatchDate, formatMatchTime, isMatchLocked } from "../utils/dates";

interface Props {
  match: Match;
  prediction?: PredictionWithMatch;
  onPredict?: (match: Match) => void;
}

function StatusBadge({ status }: { status: Match["status"] }) {
  const cls: Record<string, string> = {
    scheduled: "badge-scheduled",
    live:       "badge-live",
    finished:   "badge-finished",
    cancelled:  "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200",
  };
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    live:      "⚽ Live",
    finished:  "Finished",
    cancelled: "Cancelled",
  };
  return <span className={cls[status]}>{labels[status]}</span>;
}

function PredictionBadge({ prediction, match }: { prediction?: PredictionWithMatch; match: Match }) {
  if (!prediction) {
    if (match.status === "finished")          return <span className="text-xs text-gray-400">No prediction</span>;
    if (isMatchLocked(match.match_datetime))  return <span className="text-xs text-gray-400">Locked</span>;
    return <span className="text-xs font-semibold text-orange-500">Not predicted yet</span>;
  }

  const winnerLabel =
    prediction.predicted_winner === "team1" ? match.team1
    : prediction.predicted_winner === "team2" ? match.team2
    : "Tie";

  return (
    <div className="text-xs text-right">
      <div className="text-gray-700 font-semibold">
        {prediction.predicted_score_team1} – {prediction.predicted_score_team2}
        <span className="text-gray-400 ml-1 font-normal">({winnerLabel})</span>
      </div>
      {prediction.points_earned !== null && (
        <div className={`font-black mt-0.5 ${
          prediction.points_earned === 3 ? "text-yellow-500"
          : prediction.points_earned === 1 ? "text-green-500"
          : "text-gray-400"
        }`}>
          {prediction.points_earned > 0 ? `+${prediction.points_earned} pts` : "0 pts"}
        </div>
      )}
    </div>
  );
}

export default function MatchCard({ match, prediction, onPredict }: Props) {
  const locked   = isMatchLocked(match.match_datetime);
  const canPredict = (!locked && match.status === "scheduled") || match.status === "live";
  const showResult = match.status === "finished" && match.score_team1 !== null;
  const isLive   = match.status === "live";

  return (
    <div
      className="card-sm animate-slide-up"
      style={isLive ? { borderColor: "rgba(249,115,22,0.6)", boxShadow: "0 4px 28px rgba(249,115,22,0.2)" } : undefined}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={11} />
          <span>{formatMatchDate(match.match_datetime)}</span>
          <span>·</span>
          <span>{formatMatchTime(match.match_datetime)}</span>
        </div>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3 my-4">
        <div className="flex-1 text-right">
          <p className="font-black text-gray-900 text-base leading-tight">{match.team1}</p>
        </div>

        <div className="shrink-0 text-center">
          {showResult ? (
            <div
              className="rounded-xl px-4 py-2 min-w-[88px]"
              style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)" }}
            >
              <span className="font-black text-2xl text-white">
                {match.score_team1} – {match.score_team2}
              </span>
            </div>
          ) : (
            <div
              className="rounded-xl px-4 py-2 min-w-[72px] text-center"
              style={{ background: "linear-gradient(135deg,#f97316 0%,#fbbf24 100%)" }}
            >
              <span className="font-black text-sm text-white tracking-widest">VS</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-black text-gray-900 text-base leading-tight">{match.team2}</p>
        </div>
      </div>

      {/* Prediction row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {locked && match.status !== "finished" && <Lock size={11} className="text-gray-400" />}
          <span className="text-xs text-gray-400">Your prediction</span>
        </div>
        <div className="flex items-center gap-3">
          <PredictionBadge prediction={prediction} match={match} />
          {onPredict && canPredict && match.status !== "cancelled" && (
            <button
              onClick={() => onPredict(match)}
              className="text-xs font-black px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)",
                color: "#fff",
                boxShadow: "0 0 10px rgba(249,115,22,0.35)",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 18px rgba(249,115,22,0.6)")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 10px rgba(249,115,22,0.35)")}
            >
              {prediction ? "Edit" : "⚽ Predict"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
