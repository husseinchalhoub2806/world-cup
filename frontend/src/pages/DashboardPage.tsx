import { useQuery } from "@tanstack/react-query";
import { Calendar, Star, Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { matchesApi } from "../api/matches";
import { predictionsApi } from "../api/predictions";
import { leaderboardApi } from "../api/leaderboard";
import MatchCard from "../components/MatchCard";
import PredictionForm from "../components/PredictionForm";
import { useAuthStore } from "../store/authStore";
import type { Match } from "../types";
import { isMatchLocked } from "../utils/dates";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { data: matches = [] }     = useQuery({ queryKey: ["matches"],     queryFn: matchesApi.list });
  const { data: predictions = [] } = useQuery({ queryKey: ["predictions"], queryFn: predictionsApi.mine });
  const { data: leaderboard }      = useQuery({ queryKey: ["leaderboard"], queryFn: leaderboardApi.get });

  const predictionMap = new Map(predictions.map(p => [p.match_id, p]));
  const myRank    = leaderboard?.entries.find(e => e.user_id === user?.id);
  const upcoming  = matches.filter(m => m.status === "scheduled" && !isMatchLocked(m.match_datetime));
  const recent    = matches.filter(m => m.status === "finished").slice(0, 3);
  const unpredicted = upcoming.filter(m => !predictionMap.has(m.id));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            Hey, <span style={{ color: "#fbbf24" }}>{user?.nickname}</span>! ⚽
          </h1>
          <p className="mt-1" style={{ color: "#fff", opacity: 0.85, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>Ready to make some predictions?</p>
        </div>
        {user?.status === "pending" && (
          <div className="card-sm" style={{ borderColor: "rgba(234,179,8,0.4)", boxShadow: "0 0 16px rgba(234,179,8,0.1)" }}>
            <p className="text-yellow-600 text-sm font-semibold">⏳ Pending admin approval</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Points */}
        <div className="card text-center" style={{ borderTop: "4px solid #f97316" }}>
          <div className="text-4xl font-black" style={{ color: "#f97316" }}>{myRank?.total_points ?? 0}</div>
          <div className="text-gray-500 text-sm mt-1">Total Points</div>
          {myRank?.title && <div className="text-xs font-black mt-1.5" style={{ color: "#f97316" }}>{myRank.title}</div>}
        </div>
        {/* Rank */}
        <div className="card text-center" style={{ borderTop: "4px solid #3b82f6" }}>
          <div className="text-4xl font-black text-gray-900">#{myRank?.rank ?? "—"}</div>
          <div className="text-gray-500 text-sm mt-1">Your Rank</div>
          <div className="text-xs text-gray-400 mt-1">of {leaderboard?.total_users ?? 0} players</div>
        </div>
        {/* Predictions */}
        <div className="card text-center" style={{ borderTop: "4px solid #22c55e" }}>
          <div className="text-4xl font-black" style={{ color: "#22c55e" }}>{predictions.length}</div>
          <div className="text-gray-500 text-sm mt-1">Predictions Made</div>
          {unpredicted.length > 0 && (
            <div className="text-xs font-bold mt-1.5" style={{ color: "#f97316" }}>
              {unpredicted.length} match{unpredicted.length > 1 ? "es" : ""} to predict!
            </div>
          )}
        </div>
      </div>

      {/* Upcoming predictions */}
      {unpredicted.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={20} style={{ color: "#f97316" }} />
              <h2 className="text-xl font-black" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>Predict Now</h2>
            </div>
            <Link to="/predictions" className="text-sm font-black transition-colors" style={{ color: "#fbbf24", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unpredicted.slice(0, 4).map(match => (
              <MatchCard key={match.id} match={match} prediction={predictionMap.get(match.id)} onPredict={setSelectedMatch} />
            ))}
          </div>
        </section>
      )}

      {/* Recent results */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} style={{ color: "#fff" }} />
            <h2 className="text-xl font-black" style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>Recent Results</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map(match => (
              <MatchCard key={match.id} match={match} prediction={predictionMap.get(match.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {matches.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No matches yet</h3>
          <p className="text-gray-500">The admin hasn't added any matches yet. Check back soon!</p>
        </div>
      )}

      {selectedMatch && (
        <PredictionForm match={selectedMatch} existing={predictionMap.get(selectedMatch.id)} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}
