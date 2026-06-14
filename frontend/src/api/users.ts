import { apiClient } from "./client";
import type { PredictedWinner, MatchStatus } from "../types";

export interface UserPredictionPublic {
  match_id: number;
  match_team1: string;
  match_team2: string;
  match_datetime: string;
  match_status: MatchStatus;
  match_score_team1: number | null;
  match_score_team2: number | null;
  predicted_score_team1: number;
  predicted_score_team2: number;
  predicted_winner: PredictedWinner;
  joker_applied: boolean;
  points_earned: number | null;
}

export const usersApi = {
  getPredictions: async (userId: number): Promise<UserPredictionPublic[]> => {
    const resp = await apiClient.get<UserPredictionPublic[]>(`/users/${userId}/predictions`);
    return resp.data;
  },
};
