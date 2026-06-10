import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { formatMatchDateTime } from "../../utils/dates";

export default function AdminPredictions() {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ["admin-predictions"],
    queryFn: adminApi.listPredictions,
  });

  // Group by match
  const byMatch = new Map<string, typeof predictions>();
  for (const p of predictions) {
    const key = `${p.match_id}:${p.match_team1} vs ${p.match_team2}`;
    if (!byMatch.has(key)) byMatch.set(key, []);
    byMatch.get(key)!.push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">All Predictions</h1>
        <span className="text-gray-500 text-sm">{predictions.length} total</span>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : predictions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No predictions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(byMatch.entries()).map(([key, preds]) => {
            const first = preds[0];
            return (
              <div key={key} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-black">
                      {first.match_team1} vs {first.match_team2}
                    </h3>
                    <p className="text-xs text-gray-400">{formatMatchDateTime(first.match_datetime)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                    first.match_status === "finished"
                      ? "bg-gray-800 text-gray-400"
                      : "badge-scheduled"
                  }`}>
                    {first.match_status}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                        <th className="pb-2 pr-4 text-left">User</th>
                        <th className="pb-2 pr-4 text-center">Prediction</th>
                        <th className="pb-2 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {preds.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-800/20">
                          <td className="py-2 pr-4">
                            <span className="font-medium text-gray-100">{p.user_real_name}</span>
                            <span className="text-gray-500 text-xs ml-1">({p.user_nickname})</span>
                          </td>
                          <td className="py-2 pr-4 text-center">
                            <span className="text-gray-100 font-mono font-semibold">
                              {p.predicted_score_team1} – {p.predicted_score_team2}
                            </span>
                            <span className="text-gray-400 text-xs ml-2">
                              ({p.predicted_winner === "team1"
                                ? first.match_team1
                                : p.predicted_winner === "team2"
                                ? first.match_team2
                                : "Tie"})
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            {p.points_earned !== null ? (
                              <span className={`font-bold ${p.points_earned > 0 ? "text-green-400" : "text-gray-500"}`}>
                                {p.points_earned > 0 ? `+${p.points_earned}` : "0"}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
