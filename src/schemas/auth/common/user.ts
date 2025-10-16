export interface PublicUser {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  phone: string | null;
  role: {
    id: number | null;
    name: string | null;
  };
}