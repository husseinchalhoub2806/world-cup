import { apiClient } from "./client";
import type { TokenResponse, User } from "../types";

export const authApi = {
  register: async (data: {
    nickname: string;
    real_name: string;
    password: string;
  }): Promise<User> => {
    const resp = await apiClient.post<User>("/auth/register", data);
    return resp.data;
  },

  login: async (data: { nickname: string; password: string }): Promise<TokenResponse> => {
    const resp = await apiClient.post<TokenResponse>("/auth/login", data);
    return resp.data;
  },

  me: async (): Promise<User> => {
    const resp = await apiClient.get<User>("/auth/me");
    return resp.data;
  },
};
