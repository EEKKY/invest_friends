import type { User } from "./user";

export type AuthContextType = {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  socialLogin: (provider: string) => void;
  logout: () => void;
};
