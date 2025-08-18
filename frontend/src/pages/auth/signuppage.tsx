import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
} from "lucide-react";
import { api } from "@/services/axios";

interface FormData {
  userEmail: string;
  userNick: string;
  userPassword: string;
  confirmPassword: string;
}

interface CreateUserInput {
  userEmail: string;
  userNick: string;
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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: "onChange",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

  const password = watch("userPassword");

  const onSubmit = async (data: FormData): Promise<void> => {
    setIsLoading(true);
    setSuccess(false);
    setSubmitError("");

    try {
      const requestBody: CreateUserInput = {
        userEmail: data.userEmail,
        userNick: data.userNick,
        userPassword: data.userPassword,
      };

      const response = await api.post("/auth", requestBody);

      console.log("User created:", response.data);
      setSuccess(true);
      reset();
    } catch (error: unknown) {
      console.error("Signup error:", error);
      const apiError = error as ApiError;

      if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;
        if (errorData.message && Array.isArray(errorData.message)) {
          setSubmitError(errorData.message.join(", "));
        } else if (typeof errorData.message === "string") {
          setSubmitError(errorData.message);
        } else {
          setSubmitError("입력값을 확인해주세요");
        }
      } else if (apiError.response?.status === 409) {
        setSubmitError("이미 존재하는 이메일 또는 닉네임입니다.");
      } else if (apiError.response?.status === 500) {
        setSubmitError(
          "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      } else {
        setSubmitError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 페이지로 이동하는 함수 추가
  const handleLoginRedirect = () => {
    navigate("/login");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">가입 완료!</h2>
          <p className="text-gray-600 mb-6">
            회원가입이 성공적으로 완료되었습니다.
          </p>
          <button
            onClick={handleLoginRedirect}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">회원가입</h1>
          <p className="text-gray-600 mt-2">새로운 계정을 만들어보세요</p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700 text-sm">{submitError}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* 이메일 - React Hook Form과 HTML5 validation */}
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
                  maxLength: {
                    value: 50,
                    message: "이메일은 50자 이하로 입력해주세요",
                  },
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "올바른 이메일 형식을 입력해주세요",
                  },
                })}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userEmail
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="example@email.com"
              />
            </div>
            {errors.userEmail && (
              <p className="mt-1 text-sm text-red-600">
                {errors.userEmail.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
            </p>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임 *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                {...register("userNick", {
                  required: "닉네임을 입력해주세요",
                  maxLength: {
                    value: 20,
                    message: "닉네임은 20자 이하로 입력해주세요",
                  },
                })}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userNick
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="닉네임을 입력하세요"
              />
            </div>
            {errors.userNick && (
              <p className="mt-1 text-sm text-red-600">
                {errors.userNick.message}
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
                    value: 10,
                    message: "비밀번호는 10자 이상이어야 합니다",
                  },
                })}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userPassword
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="10자 이상 입력하세요"
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

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 확인 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "비밀번호 확인을 입력해주세요",
                  validate: (value) =>
                    value === password || "비밀번호가 일치하지 않습니다",
                })}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirmPassword
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="비밀번호를 다시 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
              isValid && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{" "}
            <button
              onClick={handleLoginRedirect} // 함수 호출로 변경
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
