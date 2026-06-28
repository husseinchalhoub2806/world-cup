import { useState } from "react";
import { Clock, Lock } from "lucide-react";
import type { Match, PredictionWithMatch } from "../types";
import { formatMatchDate, formatMatchTime, isMatchLocked } from "../utils/dates";
import MatchPredictionsModal from "./MatchPredictionsModal";

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

function PredictionBadge({ prediction, match, knockout }: { prediction?: PredictionWithMatch; match: Match; knockout: boolean }) {
  const mutedStyle = knockout ? { color: "rgba(251,146,60,0.6)" } : { color: "#9ca3af" };

  if (!prediction) {
    if (match.status === "finished")         return <span className="text-xs" style={mutedStyle}>No prediction</span>;
    if (isMatchLocked(match.match_datetime)) return <span className="text-xs" style={mutedStyle}>Locked</span>;
    return <span className="text-xs font-semibold" style={{ color: knockout ? "#fb923c" : "#f97316" }}>Not predicted yet</span>;
  }

  const winnerLabel =
    prediction.predicted_winner === "team1" ? match.team1
    : prediction.predicted_winner === "team2" ? match.team2
    : "Tie";

  return (
    <div className="text-xs text-right">
      <div className="font-semibold" style={{ color: knockout ? "#fed7aa" : "#374151" }}>
        {prediction.predicted_score_team1} – {prediction.predicted_score_team2}
        <span className="ml-1 font-normal" style={{ color: knockout ? "rgba(251,146,60,0.7)" : "#9ca3af" }}>({winnerLabel})</span>
      </div>
      {prediction.joker_applied && (
        <div className="text-xs font-bold mt-0.5" style={{ color: "#c084fc" }}>🃏 Joker</div>
      )}
      {prediction.points_earned !== null && (
        <div className={`font-black mt-0.5 ${
          prediction.points_earned >= 6 ? "text-purple-400"
          : prediction.points_earned === 3 ? "text-yellow-400"
          : prediction.points_earned > 0 ? "text-green-400"
          : "text-gray-500"
        }`}>
          {prediction.points_earned > 0 ? `+${prediction.points_earned} pts` : "0 pts"}
        </div>
      )}
    </div>
  );
}

export default function MatchCard({ match, prediction, onPredict }: Props) {
  const [showPredictions, setShowPredictions] = useState(false);
  const locked      = isMatchLocked(match.match_datetime);
  const canPredict  = (!locked && match.status === "scheduled") || match.status === "live";
  const showResult  = (match.status === "finished" || match.status === "live") && match.score_team1 !== null;
  const isLive      = match.status === "live";
  const isKnockout  = match.is_knockout;
  const canViewPredictions = locked && match.status !== "cancelled";

  // ── Knockout card styles ──────────────────────────────────────────────────
  const cardStyle = isKnockout ? {
    background: "linear-gradient(160deg, #0c0400 0%, #1e0900 55%, #100500 100%)",
    border: `1.5px solid ${isLive ? "rgba(251,146,60,0.8)" : "rgba(249,115,22,0.5)"}`,
    boxShadow: isLive
      ? "0 8px 48px rgba(234,88,12,0.55), 0 0 0 1px rgba(251,146,60,0.18) inset"
      : "0 8px 36px rgba(234,88,12,0.28), 0 0 0 1px rgba(251,146,60,0.1) inset",
    borderRadius: "12px",
    padding: "16px",
    transition: "box-shadow 0.2s, transform 0.2s",
  } : isLive ? {
    borderColor: "rgba(249,115,22,0.6)",
    boxShadow: "0 4px 28px rgba(249,115,22,0.2)",
  } : undefined;

  const scoreBoxStyle = showResult
    ? isKnockout
      ? isLive
        ? { background: "linear-gradient(135deg,#7f1d1d 0%,#f97316 55%,#dc2626 100%)", boxShadow: "0 0 28px rgba(239,68,68,0.65)" }
        : { background: "linear-gradient(135deg,#7f1d1d 0%,#c2410c 55%,#991b1b 100%)", boxShadow: "0 0 20px rgba(220,38,38,0.45)" }
      : isLive
        ? { background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)" }
        : { background: "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)" }
    : isKnockout
      ? { background: "linear-gradient(135deg,#b91c1c 0%,#f97316 60%,#dc2626 100%)", boxShadow: "0 0 16px rgba(249,115,22,0.4)" }
      : { background: "linear-gradient(135deg,#f97316 0%,#fbbf24 100%)" };

  return (
    <div
      className={isKnockout ? "animate-slide-up" : "card-sm animate-slide-up"}
      style={cardStyle}
    >
      {/* Knockout fire stripe */}
      {isKnockout && (
        <div style={{
          height: "2px",
          background: "linear-gradient(90deg,#dc2626 0%,#f97316 45%,#fbbf24 80%,#f97316 100%)",
          borderRadius: "2px",
          marginBottom: "14px",
          boxShadow: "0 1px 10px rgba(249,115,22,0.55)",
        }} />
      )}

      {/* Top row */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs" style={{ color: isKnockout ? "#fb923c" : "#9ca3af" }}>
          <Clock size={11} />
          <span>{formatMatchDate(match.match_datetime)}</span>
          <span>·</span>
          <span>{formatMatchTime(match.match_datetime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isKnockout && (
            <span style={{
              fontSize: "10px",
              fontWeight: 900,
              padding: "2px 8px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg,#991b1b 0%,#f97316 100%)",
              color: "#fff",
              letterSpacing: "0.05em",
              boxShadow: "0 0 10px rgba(239,68,68,0.45)",
            }}>
              🔥 KNOCKOUT
            </span>
          )}
          <StatusBadge status={match.status} />
        </div>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-3 my-4">
        <div className="flex-1 text-right">
          <p className="font-black text-base leading-tight" style={{ color: isKnockout ? "#fff" : "#111827" }}>
            {match.team1}
          </p>
        </div>

        <div className="shrink-0 text-center">
          <div className="rounded-xl px-4 py-2 min-w-[88px]" style={scoreBoxStyle}>
            {showResult ? (
              <span className="font-black text-2xl text-white">
                {match.score_team1} – {match.score_team2}
              </span>
            ) : (
              <span className="font-black text-sm text-white tracking-widest">VS</span>
            )}
          </div>
        </div>

        <div className="flex-1">
          <p className="font-black text-base leading-tight" style={{ color: isKnockout ? "#fff" : "#111827" }}>
            {match.team2}
          </p>
        </div>
      </div>

      {/* Prediction row */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: `1px solid ${isKnockout ? "rgba(249,115,22,0.2)" : "#f3f4f6"}` }}
      >
        <div className="flex items-center gap-2">
          {locked && match.status !== "finished" && (
            <Lock size={11} style={{ color: isKnockout ? "#fb923c" : "#9ca3af" }} />
          )}
          <span className="text-xs" style={{ color: isKnockout ? "rgba(251,146,60,0.7)" : "#9ca3af" }}>
            Your prediction
          </span>
        </div>
        <div className="flex items-center gap-3">
          <PredictionBadge prediction={prediction} match={match} knockout={isKnockout} />
          {onPredict && canPredict && match.status !== "cancelled" && (
            <button
              onClick={() => onPredict(match)}
              className="text-xs font-black px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: isKnockout
                  ? "linear-gradient(135deg,#b91c1c 0%,#f97316 100%)"
                  : "linear-gradient(135deg,#f97316 0%,#ea580c 100%)",
                color: "#fff",
                boxShadow: isKnockout
                  ? "0 0 14px rgba(239,68,68,0.45)"
                  : "0 0 10px rgba(249,115,22,0.35)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isKnockout
                  ? "0 0 22px rgba(239,68,68,0.7)"
                  : "0 0 18px rgba(249,115,22,0.6)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isKnockout
                  ? "0 0 14px rgba(239,68,68,0.45)"
                  : "0 0 10px rgba(249,115,22,0.35)";
              }}
            >
              {prediction ? "Edit" : "⚽ Predict"}
            </button>
          )}
        </div>
      </div>

      {/* View Predictions */}
      {canViewPredictions && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isKnockout ? "rgba(249,115,22,0.2)" : "#f3f4f6"}` }}>
          <button
            onClick={() => setShowPredictions(true)}
            className="w-full text-xs font-semibold py-1.5 rounded-lg transition-colors"
            style={isKnockout
              ? { color: "rgba(251,146,60,0.7)", background: "transparent" }
              : { color: "#9ca3af", background: "transparent" }
            }
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = isKnockout ? "#fb923c" : "#374151"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = isKnockout ? "rgba(251,146,60,0.7)" : "#9ca3af"; }}
          >
            View Predictions
          </button>
        </div>
      )}

      {showPredictions && (
        <MatchPredictionsModal match={match} onClose={() => setShowPredictions(false)} />
      )}
    </div>
  );
}
