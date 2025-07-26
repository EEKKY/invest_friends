import { useState } from "react";
import type { User } from "@/types/user";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 새로고침시 토큰 체크
  // useEffect(() => {
  //   const initAuth = async () => {
  //     const token = localStorage.getItem("token");
  //     if (token) {
  //       const user = await getUser(token);
  //       setUser(user);
  //     }
  //   };

  //   initAuth();
  // }, []);

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
