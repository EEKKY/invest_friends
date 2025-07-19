import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  name: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  socialLogin: (provider: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const login = (user: User) => {
    setUser(user);
  };

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

export { AuthContext };

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { useAuth };
