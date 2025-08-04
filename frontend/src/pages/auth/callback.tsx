import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const handleLoginSuccess = () => {
      try {
        const accessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('accessToken='))
          ?.split('=')[1];

        const refreshToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('refreshToken='))
          ?.split('=')[1];

        console.log('🔍 찾은 accessToken:', accessToken);
        console.log('🔍 찾은 refreshToken:', refreshToken);

        if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          console.log('🔍 JWT 페이로드:', payload);
          
          setToken(accessToken);
          toast.success("로그인 성공!");
          navigate("/");
        } else {
          console.error('❌ 토큰이 쿠키에 없음');
          throw new Error('인증 토큰이 없습니다.');
        }
      } catch (error) {
        console.error('❌ 로그인 처리 에러:', error);
        toast.error("로그인 처리 중 오류가 발생했습니다.");
        navigate("/login");
      }
    };

    if (searchParams.get("login") === "success") {
      handleLoginSuccess();
    } else {
      toast.error("로그인에 실패했습니다.");
      navigate("/login");
    }
  }, [searchParams, navigate, setToken]);


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>로그인 처리 중...</p>
      </div>
    </div>
  );
}