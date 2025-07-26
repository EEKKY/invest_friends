import { tokenCookies } from "@/lib/cookie";

export const logout = () => {
  tokenCookies.removeTokens();
    window.location.href = '/login';
  };