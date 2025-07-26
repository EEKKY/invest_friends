import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth(); // AuthContext에서 토큰 설정 함수를 가져옵니다.

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      // 현재의 임시 로그인 성공 처리
      toast.success("성공적으로 리디렉션되었습니다!");
      // 필요하다면 여기서 로그인 상태를 true로 설정하는 등의 처리를 할 수 있습니다.
      // 예: setIsLoggedIn(true);
      navigate("/");
    } else {
      toast.error("로그인에 실패했습니다.");
      navigate("/login");
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>로그인 처리 중...</p>
    </div>
  );
}
