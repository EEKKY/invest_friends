import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/axios";
import { tokenCookies } from "@/lib/cookie";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

interface LoginFormData {
  userEmail: string;
  userPassword: string;
}

interface ApiError {
  response?: {
    status: number;
    data: {
      message: string | string[];
    };
  };
}

export function UnifiedLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: "onChange",
  });

  // 일반 로그인 처리
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await api.post<LoginResponse>("/login", data);

      if (response.data?.accessToken) {
        // 토큰을 쿠키에 저장
        tokenCookies.setAccessToken(response.data.accessToken);
        tokenCookies.setRefreshToken(response.data.refreshToken);
        toast.success("로그인 성공!");
        navigate("/");
      }
    } catch (error: unknown) {
      console.error("로그인 실패:", error);
      const apiError = error as ApiError;

      if (apiError.response?.status === 401) {
        setSubmitError("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;

        if (errorData.message && Array.isArray(errorData.message)) {
          setSubmitError(errorData.message.join(", "));
        } else if (typeof errorData.message === "string") {
          setSubmitError(errorData.message);
        } else {
          setSubmitError("입력값을 확인해주세요");
        }
      } else {
        setSubmitError(
          "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = (provider: "google" | "kakao" | "naver") => {
    try {
      // 백엔드 소셜 로그인 엔드포인트로 직접 리다이렉트
      // 백엔드에서 OAuth 처리 후 쿠키 설정하고 /auth/callback으로 리다이렉트
      const backendURL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' // 개발 환경 백엔드 URL
        : window.location.origin; // 프로덕션에서는 동일 도메인
      
      // OAuth 프로세스 시작
      window.location.href = `${backendURL}/sociallogin/${provider}`;
    } catch (error) {
      console.error(`${provider} 로그인 실패:`, error);
      toast.error(`${provider} 로그인에 실패했습니다.`);
    }
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">로그인</h1>
          <p className="text-gray-600 mt-2">계정에 로그인하세요</p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700 text-sm">{submitError}</span>
          </div>
        )}

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google로 로그인</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 border border-yellow-300 rounded-xl hover:bg-yellow-50 transition-colors"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-sm flex items-center justify-center">
              <span className="text-xs font-bold text-black">K</span>
            </div>
            <span>카카오로 로그인</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("naver")}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 border border-green-300 rounded-xl hover:bg-green-50 transition-colors"
          >
            <div className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center">
              <span className="text-xs font-bold text-white">N</span>
            </div>
            <span>네이버로 로그인</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* 일반 로그인 폼 */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                {...register("userEmail", {
                  required: "이메일을 입력해주세요",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "올바른 이메일 형식을 입력해주세요",
                  },
                })}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userEmail
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>
            {errors.userEmail && (
              <p className="mt-1 text-sm text-red-600">
                {errors.userEmail.message}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("userPassword", {
                  required: "비밀번호를 입력해주세요",
                  minLength: {
                    value: 6,
                    message: "비밀번호는 최소 6자 이상이어야 합니다",
                  },
                })}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userPassword
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.userPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.userPassword.message}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
              isValid && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "로그인 중..." : "이메일로 로그인"}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            계정이 없으신가요?{" "}
            <button
              onClick={handleSignupRedirect}
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              회원가입하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}