import { apiClient } from "./client";
import type { LeaderboardResponse, Match, PredictionWithMatch, User, UserRole, UserStatus } from "../types";

export interface MatchCreateInput {
  team1: string;
  team2: string;
  match_datetime: string; // ISO UTC string
}

export interface MatchUpdateInput {
  team1?: string;
  team2?: string;
  match_datetime?: string;
  status?: string;
}

export interface MatchResultInput {
  score_team1: number;
  score_team2: number;
}

export const adminApi = {
  // Users
  listUsers: async (): Promise<User[]> => {
    const resp = await apiClient.get<User[]>("/admin/users");
    return resp.data;
  },

  updateUser: async (userId: number, data: { status?: UserStatus; role?: UserRole }): Promise<User> => {
    const resp = await apiClient.patch<User>(`/admin/users/${userId}`, data);
    return resp.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  // Matches
  listMatches: async (): Promise<Match[]> => {
    const resp = await apiClient.get<Match[]>("/admin/matches");
    return resp.data;
  },

  createMatch: async (data: MatchCreateInput): Promise<Match> => {
    const resp = await apiClient.post<Match>("/admin/matches", data);
    return resp.data;
  },

  updateMatch: async (matchId: number, data: MatchUpdateInput): Promise<Match> => {
    const resp = await apiClient.patch<Match>(`/admin/matches/${matchId}`, data);
    return resp.data;
  },

  deleteMatch: async (matchId: number): Promise<void> => {
    await apiClient.delete(`/admin/matches/${matchId}`);
  },

  enterResult: async (matchId: number, data: MatchResultInput): Promise<Match> => {
    const resp = await apiClient.post<Match>(`/admin/matches/${matchId}/result`, data);
    return resp.data;
  },

  // Predictions
  listPredictions: async (): Promise<PredictionWithMatch[]> => {
    const resp = await apiClient.get<PredictionWithMatch[]>("/admin/predictions");
    return resp.data;
  },

  // Analytics
  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const resp = await apiClient.get<LeaderboardResponse>("/admin/leaderboard");
    return resp.data;
  },
};
