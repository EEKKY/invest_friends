import { useState } from "react";
import type { User } from "@/types/user";
import { AuthContext } from "./auth-context";
import { useEffect } from "react";
import { tokenCookies } from "@/lib/cookie";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 새로고침시 토큰 체크
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = tokenCookies.getAccessToken();
      if (accessToken) {
        setToken(accessToken);
      } else {
        //TODO: 리프레쉬로 엑세스토큰 갱신 구현
        // TODO: 리프레쉬 만료및 엑세스토큰 만료시 로그아웃 구현
        // setToken(null);
      }
    };

    initAuth();
  }, []);

  // const login = (user: User) => {
  //   setUser(user);
  // };

  const socialLogin = (provider: string) => {
    // 소셜 로그인 로직 구현
    // console.log(provider);

    const url = `${import.meta.env.VITE_API_BASE_URL}/auth/${provider}`;
    console.log(url);

    window.location.href = url;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, setToken, socialLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
