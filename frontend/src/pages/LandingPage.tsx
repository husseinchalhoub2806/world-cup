import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { leaderboardApi } from "../api/leaderboard";
import TopThree from "../components/TopThree";
import LeaderboardTable from "../components/LeaderboardTable";
import StadiumBackground from "../components/StadiumBackground";
import { useAuthStore } from "../store/authStore";

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard-public"],
    queryFn: leaderboardApi.getPublic,
    staleTime: 60_000,
  });
  const top3 = leaderboard?.entries.slice(0, 3) ?? [];

  return (
    <>
      <StadiumBackground />
      <div className="relative min-h-screen">

        {/* Navbar */}
        <header
          style={{
            background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#2563eb 100%)",
            borderBottom: "3px solid #f97316",
            boxShadow: "0 4px 24px rgba(30,58,138,0.5)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-black text-lg tracking-tight">
              <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.9))" }}>⚽</span>
              <span style={{ color: "#fbbf24" }}>World Cup</span>
              <span className="text-white font-medium opacity-90">Predictions</span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-gold text-sm">Go to Dashboard →</Link>
              ) : (
                <>
                  <Link to="/login"  className="btn-secondary text-sm">Login</Link>
                  <Link to="/signup" className="btn-gold text-sm">Join Now</Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(251,146,60,0.2) 0%, transparent 70%)" }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <div className="text-7xl mb-6 inline-block" style={{ filter: "drop-shadow(0 0 24px rgba(249,115,22,0.6))" }}>🏆</div>
            <h1 className="text-5xl md:text-7xl font-black mb-5 leading-none tracking-tight" style={{ color: "#fff", textShadow: "0 3px 16px rgba(0,0,0,0.45)" }}>
              World Cup{" "}
              <span
                className="text-transparent bg-clip-text block md:inline"
                style={{ backgroundImage: "linear-gradient(135deg,#f97316 0%,#fbbf24 60%,#facc15 100%)" }}
              >
                Predictions
              </span>
            </h1>
            <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
              Predict match scores, earn points, and battle for the top of the family leaderboard.
              Who will be crowned{" "}
              <span className="font-black" style={{ color: "#fbbf24", textShadow: "0 0 12px rgba(251,191,36,0.6)" }}>
                El Magnifico
              </span>?
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3 rounded-xl">
                  ⚽ Join the Game <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary inline-flex items-center gap-2 text-base px-8 py-3 rounded-xl">
                  I have an account
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Scoring cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: "🎯", title: "Exact Score",       pts: "3 pts", desc: "Nail the exact final scoreline",    accent: "#f97316" },
              { icon: "✅", title: "Correct Winner",    pts: "1 pt",  desc: "Pick the winning side or a draw",   accent: "#22c55e" },
              { icon: "❌", title: "Wrong Prediction",  pts: "0 pts", desc: "Back to the drawing board",         accent: "#3b82f6" },
            ].map(({ icon, title, pts, desc, accent }) => (
              <div key={title} className="card text-center hover:-translate-y-1 transition-transform duration-200" style={{ borderTop: `4px solid ${accent}` }}>
                <div className="text-5xl mb-3">{icon}</div>
                <div className="font-black text-gray-900 text-lg">{title}</div>
                <div className="font-black text-3xl my-2" style={{ color: accent }}>{pts}</div>
                <div className="text-gray-500 text-sm">{desc}</div>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Trophy size={24} style={{ color: "#f97316", filter: "drop-shadow(0 0 6px rgba(249,115,22,0.6))" }} />
              <h2 className="text-2xl font-black text-gray-900">Current Standings</h2>
            </div>
            {top3.length > 0 ? (
              <>
                <TopThree entries={top3} />
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <LeaderboardTable entries={leaderboard?.entries ?? []} compact />
                </div>
              </>
            ) : (
              <div className="text-center py-14 text-gray-500">
                <div className="text-5xl mb-4">🏁</div>
                <p>Game hasn't kicked off yet. Sign up to be first on the board!</p>
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-white/20 py-8 text-center text-sm" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)", opacity: 0.8 }}>
          <p>⚽ World Cup Family Predictions — May the best predictor win!</p>
        </footer>
      </div>
    </>
  );
}
