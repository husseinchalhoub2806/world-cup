import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { useState } from "react";
import { matchesApi } from "../api/matches";
import { predictionsApi } from "../api/predictions";
import MatchCard from "../components/MatchCard";
import PredictionForm from "../components/PredictionForm";
import type { Match } from "../types";

type FilterType = "all" | "unpredicted" | "predicted" | "finished";

export default function PredictionsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: matchesApi.list,
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ["predictions"],
    queryFn: predictionsApi.mine,
  });

  const predictionMap = new Map(predictions.map((p) => [p.match_id, p]));

  const filtered = matches.filter((m) => {
    if (filter === "unpredicted") return !predictionMap.has(m.id) && m.status !== "finished";
    if (filter === "predicted") return predictionMap.has(m.id);
    if (filter === "finished") return m.status === "finished";
    return true;
  });

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unpredicted", label: "To Predict" },
    { value: "predicted", label: "Predicted" },
    { value: "finished", label: "Finished" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Predictions</h1>
          <p className="mt-1" style={{ color: "#fff", opacity: 0.8, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>Matches visible 10 days before kickoff</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} style={{ color: "#fff", opacity: 0.7 }} />
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={
              filter === value
                ? { background: "#f97316", color: "#fff", boxShadow: "0 2px 10px rgba(249,115,22,0.4)" }
                : { background: "rgba(255,255,255,0.85)", color: "#374151" }
            }
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16" style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>Loading matches...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500">No matches found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictionMap.get(match.id)}
              onPredict={setSelectedMatch}
            />
          ))}
        </div>
      )}

      {selectedMatch && (
        <PredictionForm
          match={selectedMatch}
          existing={predictionMap.get(selectedMatch.id)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
