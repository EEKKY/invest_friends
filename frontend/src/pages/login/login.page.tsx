import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { toast } from "sonner";
import { api } from '@/services/axios';

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

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<LoginFormData>({
    mode: 'onChange'
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    setSubmitError('');

    try {
      const response = await api.post<LoginResponse>('/login', data);

      if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("tokenType", response.data.tokenType);
        localStorage.setItem("expiresIn", response.data.expiresIn);
        
        toast.success("로그인 성공!");
        navigate("/");
      }
    } catch (error: unknown) {
      console.error("로그인 실패:", error);
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 401) {
        setSubmitError('이메일 또는 비밀번호가 일치하지 않습니다.');
      } else if (apiError.response?.status === 400) {
        const errorData = apiError.response.data;
        
        if (errorData.message && Array.isArray(errorData.message)) {
          setSubmitError(errorData.message.join(', '));
        } else if (typeof errorData.message === 'string') {
          setSubmitError(errorData.message);
        } else {
          setSubmitError('입력값을 확인해주세요');
        }
      } else {
        setSubmitError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    navigate('/signup');
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
                {...register('userEmail', {
                  required: '이메일을 입력해주세요'
                })}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userEmail 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>
            {errors.userEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.userEmail.message}</p>
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
                type={showPassword ? 'text' : 'password'}
                {...register('userPassword', {
                  required: '비밀번호를 입력해주세요'
                })}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userPassword 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.userPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.userPassword.message}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
              isValid && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            계정이 없으신가요?{' '}
            <button 
              onClick={handleSignupRedirect}
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              회원가입하기
            </button>
          </p>
        </div>

        {/* 개발용 테스트 버튼들 (프로덕션에서는 제거) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-2 px-4 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}