export interface LoginResponse {
  user_id: number;
  role_id: number | null;
  access_token: string;
}