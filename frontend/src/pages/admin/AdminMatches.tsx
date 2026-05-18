import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { adminApi, type MatchCreateInput } from "../../api/admin";
import { getErrorMessage } from "../../api/client";
import CountrySelect from "../../components/CountrySelect";
import type { Match } from "../../types";
import { formatMatchDateTime } from "../../utils/dates";

interface MatchFormData {
  team1: string;
  team2: string;
  match_datetime: string; // datetime-local input value
}

interface ResultFormData {
  score_team1: number;
  score_team2: number;
}

function MatchForm({ onClose, existing }: { onClose: () => void; existing?: Match }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<MatchFormData>({
    defaultValues: existing
      ? {
          team1: existing.team1,
          team2: existing.team2,
          match_datetime: existing.match_datetime.slice(0, 16),
        }
      : {},
  });

  const team1Value = watch("team1");
  const team2Value = watch("team2");

  const createMutation = useMutation({
    mutationFn: (data: MatchCreateInput) => existing
      ? adminApi.updateMatch(existing.id, data)
      : adminApi.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success(existing ? "Match updated" : "Match created");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onSubmit = (data: MatchFormData) => {
    // Convert local datetime to UTC ISO string
    const utcDatetime = new Date(data.match_datetime).toISOString().slice(0, 19);
    createMutation.mutate({ team1: data.team1, team2: data.team2, match_datetime: utcDatetime });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-bold text-xl text-white mb-6">
          {existing ? "Edit Match" : "Create Match"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Team 1</label>
            <Controller
              name="team1"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <CountrySelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Select Team 1..."
                  exclude={team2Value}
                />
              )}
            />
            {errors.team1 && <p className="text-red-400 text-xs mt-1">{errors.team1.message}</p>}
          </div>
          <div>
            <label className="label">Team 2</label>
            <Controller
              name="team2"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <CountrySelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Select Team 2..."
                  exclude={team1Value}
                />
              )}
            />
            {errors.team2 && <p className="text-red-400 text-xs mt-1">{errors.team2.message}</p>}
          </div>
          <div>
            <label className="label">Match Date & Time (your local time)</label>
            <input
              {...register("match_datetime", { required: "Required" })}
              type="datetime-local"
              className="input"
            />
            {errors.match_datetime && <p className="text-red-400 text-xs mt-1">{errors.match_datetime.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-gold flex-1">
              {createMutation.isPending ? "Saving..." : existing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResultForm({ match, onClose }: { match: Match; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<ResultFormData>({
    defaultValues: {
      score_team1: match.score_team1 ?? 0,
      score_team2: match.score_team2 ?? 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ResultFormData) => adminApi.enterResult(match.id, {
      score_team1: Number(data.score_team1),
      score_team2: Number(data.score_team2),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });
      toast.success("Result entered and scores calculated!");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-bold text-xl text-white mb-2">Enter Result</h2>
        <p className="text-gray-400 text-sm mb-6">{match.team1} vs {match.team2}</p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">{match.team1}</label>
              <input
                {...register("score_team1", { required: true, min: 0, max: 30 })}
                type="number"
                min="0"
                max="30"
                className="input text-center text-2xl font-bold"
              />
            </div>
            <span className="text-gray-500 font-bold text-xl mt-6">–</span>
            <div className="flex-1">
              <label className="label">{match.team2}</label>
              <input
                {...register("score_team2", { required: true, min: 0, max: 30 })}
                type="number"
                min="0"
                max="30"
                className="input text-center text-2xl font-bold"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            This will mark the match as finished and automatically calculate points for all predictions.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-gold flex-1">
              {mutation.isPending ? "Saving..." : "Enter Result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMatches() {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: adminApi.listMatches,
  });

  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [resultMatch, setResultMatch] = useState<Match | null>(null);

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success("Match deleted");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusColors: Record<string, string> = {
    scheduled: "badge-scheduled",
    live: "badge-live",
    finished: "badge-finished",
    cancelled: "bg-gray-800 text-gray-500 text-xs px-2.5 py-0.5 rounded-full",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Matches</h1>
        <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-2 text-sm">
          <Plus size={16} /> Create Match
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : matches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No matches yet. Create the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="card-sm hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white">
                      {match.team1} vs {match.team2}
                    </span>
                    <span className={statusColors[match.status]}>{match.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatMatchDateTime(match.match_datetime)}
                    {match.status === "finished" && match.score_team1 !== null && (
                      <span className="ml-3 text-white font-bold">
                        {match.score_team1} – {match.score_team2}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {match.status !== "finished" && match.status !== "cancelled" && (
                    <button
                      onClick={() => setResultMatch(match)}
                      className="flex items-center gap-1 text-xs bg-gold-600/20 hover:bg-gold-600/40 text-gold-400 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Enter result"
                    >
                      <Trophy size={13} />
                      Result
                    </button>
                  )}
                  <button
                    onClick={() => setEditMatch(match)}
                    className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-700"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this match? All predictions will be lost.")) {
                        deleteMutation.mutate(match.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-gray-700"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <MatchForm onClose={() => setShowCreate(false)} />}
      {editMatch && <MatchForm onClose={() => setEditMatch(null)} existing={editMatch} />}
      {resultMatch && <ResultForm match={resultMatch} onClose={() => setResultMatch(null)} />}
    </div>
  );
}
