// lib/cookie.ts

interface CookieOptions {
  expires?: number; // days
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  httpOnly?: boolean; // 프론트엔드에서는 설정 불가
}

export const cookieUtils = {
  // 쿠키 설정
  set(name: string, value: string, options?: CookieOptions) {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}`;

    if (options?.expires) {
      const date = new Date();
      date.setTime(date.getTime() + options.expires);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (options?.path) {
      cookieString += `; path=${options.path}`;
    } else {
      cookieString += "; path=/"; // 기본값
    }

    if (options?.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options?.secure) {
      cookieString += "; secure";
    }

    if (options?.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  },

  // 쿠키 가져오기
  get(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }

    return null;
  },

  // 쿠키 삭제
  remove(name: string, options?: Pick<CookieOptions, "path" | "domain">) {
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;

    if (options?.path) {
      cookieString += `; path=${options.path}`;
    } else {
      cookieString += "; path=/";
    }

    if (options?.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    document.cookie = cookieString;
  },

  // 모든 쿠키 가져오기
  getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};

    document.cookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    });

    return cookies;
  },
};

// 토큰 전용 쿠키 관리 함수
export const tokenCookies = {
  setAccessToken(token: string) {
    cookieUtils.set("access_token", token, {
      expires: 60 * 60, // 1시간으로 변경해줘야함
      //   secure: true, // HTTPS에서만
      sameSite: "strict",
      path: "/",
    });
  },

  setRefreshToken(token: string) {
    cookieUtils.set("refresh_token", token, {
      expires: 60 * 60 * 24 * 7, // 7일
      //   secure: true,
      sameSite: "strict",
      path: "/",
    });
  },

  getAccessToken(): string | null {
    return cookieUtils.get("access_token");
  },

  getRefreshToken(): string | null {
    return cookieUtils.get("refresh_token");
  },

  removeTokens() {
    cookieUtils.remove("access_token");
    cookieUtils.remove("refresh_token");
  },
};
