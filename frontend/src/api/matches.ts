import { apiClient } from "./client";
import type { Match } from "../types";

export const matchesApi = {
  list: async (): Promise<Match[]> => {
    const resp = await apiClient.get<Match[]>("/matches");
    return resp.data;
  },

  get: async (id: number): Promise<Match> => {
    const resp = await apiClient.get<Match>(`/matches/${id}`);
    return resp.data;
  },
};
