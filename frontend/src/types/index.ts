export type UserRole = "admin" | "regular_user";
export type UserStatus = "pending" | "approved" | "rejected";
export type MatchStatus = "draft" | "scheduled" | "live" | "finished" | "cancelled";
export type PredictedWinner = "team1" | "team2" | "tie";

export interface User {
  id: number;
  nickname: string;
  real_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Match {
  id: number;
  team1: string;
  team2: string;
  match_datetime: string; // ISO UTC string
  status: MatchStatus;
  score_team1: number | null;
  score_team2: number | null;
  external_id: string | null;
  created_at: string;
}

export interface Prediction {
  id: number;
  user_id: number;
  match_id: number;
  predicted_winner: PredictedWinner;
  predicted_score_team1: number;
  predicted_score_team2: number;
  points_earned: number | null;
  created_at: string;
}

export interface PredictionWithMatch extends Prediction {
  match_team1: string;
  match_team2: string;
  match_datetime: string;
  match_status: MatchStatus;
  user_nickname: string;
  user_real_name: string;
}

export interface MatchPredictionPublic {
  nickname: string;
  predicted_score_team1: number;
  predicted_score_team2: number;
  predicted_winner: PredictedWinner;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  nickname: string;
  real_name: string;
  total_points: number;
  prediction_count: number;
  title: string | null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total_users: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[];
}
