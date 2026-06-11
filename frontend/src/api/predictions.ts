import { apiClient } from "./client";
import type { MatchPredictionPublic, Prediction, PredictionWithMatch, PredictedWinner } from "../types";

export interface PredictionInput {
  predicted_winner: PredictedWinner;
  predicted_score_team1: number;
  predicted_score_team2: number;
}

export const predictionsApi = {
  mine: async (): Promise<PredictionWithMatch[]> => {
    const resp = await apiClient.get<PredictionWithMatch[]>("/predictions");
    return resp.data;
  },

  submit: async (matchId: number, data: PredictionInput): Promise<Prediction> => {
    const resp = await apiClient.post<Prediction>(`/predictions/${matchId}`, data);
    return resp.data;
  },

  matchPredictions: async (matchId: number): Promise<MatchPredictionPublic[]> => {
    const resp = await apiClient.get<MatchPredictionPublic[]>(`/predictions/match/${matchId}`);
    return resp.data;
  },
};
