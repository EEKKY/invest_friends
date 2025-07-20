import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

interface CreateUserInput {
  userEmail: string;
  userNick: string;
  userPassword: string;
}

interface FormData extends CreateUserInput {
  confirmPassword: string;
}

interface FormErrors {
  userEmail?: string;
  userNick?: string;
  userPassword?: string;
  confirmPassword?: string;
  submit?: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    userEmail: '',
    userNick: '',
    userPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    const input = document.createElement('input');
    input.type = 'email';
    input.value = email;
    return input.validity.valid;
  };

  const validateField = (name: keyof FormData, value: string): void => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'userEmail':
        if (!value) {
          newErrors.userEmail = '이메일을 입력해주세요';
        } else if (!validateEmail(value)) {
          newErrors.userEmail = '올바른 이메일 형식을 입력해주세요';
        } else if (value.length > 50) {
          newErrors.userEmail = '이메일은 50자 이하로 입력해주세요';
        } else {
          delete newErrors.userEmail;
        }
        break;
        
      case 'userNick':
        if (!value) {
          newErrors.userNick = '닉네임을 입력해주세요';
        } else if (value.length > 20) {
          newErrors.userNick = '닉네임은 20자 이하로 입력해주세요';
        } else {
          delete newErrors.userNick;
        }
        break;
        
      case 'userPassword':
        if (!value) {
          newErrors.userPassword = '비밀번호를 입력해주세요';
        } else if (value.length < 10) {
          newErrors.userPassword = '비밀번호는 10자 이상이어야 합니다';
        } else {
          delete newErrors.userPassword;
        }
        
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
        } else if (value !== formData.userPassword) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    validateField(name as keyof FormData, value);
  };

  const handleSubmit = async (): Promise<void> => {
    const requiredFields: (keyof FormData)[] = ['userEmail', 'userNick', 'userPassword', 'confirmPassword'];
    
    const newErrors: FormErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field]) {
        switch (field) {
          case 'userEmail':
            newErrors.userEmail = '이메일을 입력해주세요';
            break;
          case 'userNick':
            newErrors.userNick = '닉네임을 입력해주세요';
            break;
          case 'userPassword':
            newErrors.userPassword = '비밀번호를 입력해주세요';
            break;
          case 'confirmPassword':
            newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
            break;
        }
      } else {
        validateField(field, formData[field]);
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsLoading(true);
    setSuccess(false);
    setErrors({}); 
    
    try {
      const requestBody: CreateUserInput = {
        userEmail: formData.userEmail,
        userNick: formData.userNick,
        userPassword: formData.userPassword
      };

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('User created:', requestBody);
      setSuccess(true);
      setFormData({
        userEmail: '',
        userNick: '',
        userPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setErrors({ submit: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = (): boolean => {
    return Boolean(
      formData.userEmail && 
      formData.userNick && 
      formData.userPassword && 
      formData.confirmPassword && 
      Object.keys(errors).length === 0
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">가입 완료!</h2>
          <p className="text-gray-600 mb-6">회원가입이 성공적으로 완료되었습니다.</p>
          <button
            onClick={() => setSuccess(false)}
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

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700 text-sm">{errors.submit}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* 이메일 - HTML5 validity API로 검증 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userEmail 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="example@email.com"
                maxLength={50}
              />
            </div>
            {errors.userEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.userEmail}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">HTML5 validity API로 이메일 형식을 검증합니다</p>
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
                name="userNick"
                value={formData.userNick}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userNick 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
              />
            </div>
            {errors.userNick && (
              <p className="mt-1 text-sm text-red-600">{errors.userNick}</p>
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
                name="userPassword"
                value={formData.userPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.userPassword 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="10자 이상 입력하세요"
                minLength={10}
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
              <p className="mt-1 text-sm text-red-600">{errors.userPassword}</p>
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
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="비밀번호를 다시 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
              isFormValid() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button className="text-blue-600 font-semibold hover:text-blue-700">
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;