import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Edit2, Plus, RefreshCw, Trash2, Trophy, X } from "lucide-react";
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
  const [actualWinner, setActualWinner] = useState<"team1" | "team2" | null>(
    match.actual_winner ?? null
  );
  const { register, handleSubmit, watch } = useForm<ResultFormData>({
    defaultValues: {
      score_team1: match.score_team1 ?? 0,
      score_team2: match.score_team2 ?? 0,
    },
  });

  const s1 = Number(watch("score_team1"));
  const s2 = Number(watch("score_team2"));
  const scoreConflict =
    (actualWinner === "team1" && s1 < s2) ||
    (actualWinner === "team2" && s2 < s1);

  const mutation = useMutation({
    mutationFn: (data: ResultFormData) => adminApi.enterResult(match.id, {
      score_team1: Number(data.score_team1),
      score_team2: Number(data.score_team2),
      actual_winner: actualWinner!,
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
        <form onSubmit={handleSubmit((d) => !scoreConflict && actualWinner && mutation.mutate(d))} className="space-y-4">
          {/* Score inputs */}
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

          {/* Winner selection */}
          <div>
            <label className="label mb-2">Winner (excl. penalties)</label>
            <div className="grid grid-cols-2 gap-2">
              {(["team1", "team2"] as const).map((side) => {
                const teamName = side === "team1" ? match.team1 : match.team2;
                const selected = actualWinner === side;
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setActualWinner(side)}
                    className="rounded-lg py-2.5 px-3 font-bold text-sm transition-all border-2"
                    style={selected ? {
                      background: "rgba(250,204,21,0.15)",
                      borderColor: "#ca8a04",
                      color: "#ca8a04",
                    } : {
                      background: "rgba(107,114,128,0.06)",
                      borderColor: "rgba(107,114,128,0.2)",
                      color: "#6b7280",
                    }}
                  >
                    {selected && "✓ "}{teamName}
                  </button>
                );
              })}
            </div>
            {!actualWinner && (
              <p className="text-xs text-amber-500 mt-1.5">Select the winner to continue</p>
            )}
            {scoreConflict && (
              <p className="text-xs text-red-400 mt-1.5">
                {actualWinner === "team1" ? match.team1 : match.team2} can't win with a lower score
              </p>
            )}
            {s1 === s2 && actualWinner && (
              <p className="text-xs text-gray-400 mt-1.5">
                Equal score — winner decided by penalties ({actualWinner === "team1" ? match.team1 : match.team2})
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Marks match as finished and auto-calculates points. Enter score excluding penalties.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={mutation.isPending || !actualWinner || scoreConflict}
              className="btn-gold flex-1"
            >
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

  const importMutation = useMutation({
    mutationFn: adminApi.importMatches,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      if (data.imported === 0) {
        toast.success(`No new matches — ${data.skipped} already imported`);
      } else {
        toast.success(`Imported ${data.imported} draft matches${data.skipped > 0 ? ` (${data.skipped} skipped)` : ""}`);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success("Match approved and scheduled");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const importResultsMutation = useMutation({
    mutationFn: adminApi.importResults,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leaderboard"] });
      if (data.updated === 0) {
        toast.success("No new results to import");
      } else {
        toast.success(`${data.updated} result${data.updated !== 1 ? "s" : ""} imported and scored`);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const approveAllMutation = useMutation({
    mutationFn: adminApi.approveAllMatches,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success(`${data.approved} matches approved`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusColors: Record<string, string> = {
    draft: "bg-blue-900/60 text-blue-300 text-xs px-2.5 py-0.5 rounded-full",
    scheduled: "badge-scheduled",
    live: "badge-live",
    finished: "badge-finished",
    cancelled: "bg-gray-800 text-gray-500 text-xs px-2.5 py-0.5 rounded-full",
  };

  const draftMatches = matches.filter((m) => m.status === "draft");
  const regularMatches = matches.filter((m) => m.status !== "draft");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-black text-white">Matches</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => importResultsMutation.mutate()}
            disabled={importResultsMutation.isPending}
            className="btn-secondary flex items-center gap-1.5 text-sm"
            title="Fetch finished match scores from TheSportsDB and auto-score predictions"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">{importResultsMutation.isPending ? "Importing..." : "Import Scores"}</span>
            <span className="sm:hidden">{importResultsMutation.isPending ? "..." : "Scores"}</span>
          </button>
          <button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
            className="btn-secondary flex items-center gap-1.5 text-sm"
            title="Fetch World Cup fixtures from TheSportsDB"
          >
            <Download size={15} />
            <span className="hidden sm:inline">{importMutation.isPending ? "Importing..." : "Import Fixtures"}</span>
            <span className="sm:hidden">{importMutation.isPending ? "..." : "Fixtures"}</span>
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-gold flex items-center gap-1.5 text-sm">
            <Plus size={15} />
            <span className="hidden sm:inline">Create Match</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {draftMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                  Pending Approval ({draftMatches.length})
                </h2>
                <button
                  onClick={() => {
                    if (confirm(`Approve all ${draftMatches.length} draft matches?`)) {
                      approveAllMutation.mutate();
                    }
                  }}
                  disabled={approveAllMutation.isPending}
                  className="flex items-center gap-1 text-xs bg-green-900/30 hover:bg-green-800/50 text-green-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Check size={13} />
                  {approveAllMutation.isPending ? "Approving..." : "Approve All"}
                </button>
              </div>
              {draftMatches.map((match) => (
                <div key={match.id} className="card-sm border-blue-900/40 hover:border-blue-800/60 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-black truncate">
                          {match.team1} vs {match.team2}
                        </span>
                        <span className={statusColors.draft}>draft</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatMatchDateTime(match.match_datetime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => approveMutation.mutate(match.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1 text-xs bg-green-900/30 hover:bg-green-800/50 text-green-400 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Approve — makes match visible to players"
                      >
                        <Check size={13} />
                        <span className="hidden xs:inline">Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Reject "${match.team1} vs ${match.team2}"? This will delete the draft.`)) {
                            deleteMutation.mutate(match.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Reject — deletes this draft"
                      >
                        <X size={13} />
                        <span className="hidden xs:inline">Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {regularMatches.length === 0 && draftMatches.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No matches yet. Create one or import from API!</p>
            </div>
          ) : regularMatches.length > 0 ? (
            <div className="space-y-3">
              {draftMatches.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Scheduled & Active
                </h2>
              )}
              {regularMatches.map((match) => (
                <div key={match.id} className="card-sm hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-black">
                          {match.team1} vs {match.team2}
                        </span>
                        <span className={statusColors[match.status]}>{match.status}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatMatchDateTime(match.match_datetime)}
                        {match.score_team1 !== null && match.score_team2 !== null && (
                          <span className="ml-3 text-gray-900 font-bold">
                            {match.score_team1} – {match.score_team2}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {match.status !== "cancelled" && match.status !== "draft" && (
                        <button
                          onClick={() => setResultMatch(match)}
                          className="flex items-center gap-1 text-xs bg-gold-600/20 hover:bg-gold-600/40 text-gold-400 px-2.5 py-1.5 rounded-lg transition-colors"
                          title={match.status === "finished" ? "Override result" : "Enter result"}
                        >
                          <Trophy size={13} />
                          <span className="hidden sm:inline">{match.status === "finished" ? "Override" : "Result"}</span>
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
          ) : null}
        </>
      )}

      {showCreate && <MatchForm onClose={() => setShowCreate(false)} />}
      {editMatch && <MatchForm onClose={() => setEditMatch(null)} existing={editMatch} />}
      {resultMatch && <ResultForm match={resultMatch} onClose={() => setResultMatch(null)} />}
    </div>
  );
}
