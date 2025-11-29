export interface ProfileUser {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  phone: string | null;
  avatar_type: string | null;
  role: {
    id: number | null;
    name: string | null;
  };
}