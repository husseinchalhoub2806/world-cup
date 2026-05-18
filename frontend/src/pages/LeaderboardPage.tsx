import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { leaderboardApi } from "../api/leaderboard";
import LeaderboardTable from "../components/LeaderboardTable";
import TopThree from "../components/TopThree";
import { useAuthStore } from "../store/authStore";

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: leaderboardApi.get,
    refetchInterval: 30_000,
  });

  const myRank = leaderboard?.entries.find(e => e.user_id === user?.id);
  const top3   = leaderboard?.entries.slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={28} style={{ color: "#f97316", filter: "drop-shadow(0 0 8px rgba(249,115,22,0.7))" }} />
          <h1 className="text-3xl font-black" style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Leaderboard</h1>
        </div>
        <p style={{ color: "#fff", opacity: 0.8, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>Live standings — updates every 30 seconds</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16" style={{ color: "#fff", opacity: 0.8, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>Loading rankings...</div>
      ) : (
        <>
          {myRank && (
            <div className="card" style={{ borderLeft: "4px solid #f97316" }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your position</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-gray-900">#{myRank.rank}</span>
                  <span className="text-gray-400 ml-2 text-sm">of {leaderboard?.total_users} players</span>
                  {myRank.title && (
                    <span className="ml-3 text-sm font-black" style={{ color: "#f97316" }}>{myRank.title}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black" style={{ color: "#f97316" }}>{myRank.total_points}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            </div>
          )}

          {top3.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-black text-center uppercase tracking-widest mb-2" style={{ color: "#f97316" }}>
                🏟️ Podium
              </h2>
              <TopThree entries={top3} />
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-black text-gray-900 mb-6">Full Rankings</h2>
            <LeaderboardTable entries={leaderboard?.entries ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
