import { apiClient } from "./client";
import type { LeaderboardResponse } from "../types";

export const leaderboardApi = {
  get: async (): Promise<LeaderboardResponse> => {
    const resp = await apiClient.get<LeaderboardResponse>("/leaderboard");
    return resp.data;
  },

  getPublic: async (): Promise<LeaderboardResponse> => {
    const resp = await apiClient.get<LeaderboardResponse>("/leaderboard/public");
    return resp.data;
  },
};
