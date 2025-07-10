import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// 로그인 응답 타입
type LoginResponse = {
  user: {
    id: number;
    email: string;
    name: string;
  };
  token: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const { loading, post, error } = useApi<LoginResponse>();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await post("/auth/login", formData);

      // 로그인 성공 시 토큰 저장
      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
        toast.success("로그인 성공!");
        navigate("/");
      }
    } catch (error) {
      // 에러는 전역에서 처리됨
      console.error("로그인 실패:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTestError = async () => {
    try {
      // 존재하지 않는 엔드포인트로 테스트
      await post("/test/error", { test: "data" });
    } catch (error) {
      console.error("테스트 에러:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인 테스트
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            useApi 훅 테스트 페이지
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="test@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
                className="mt-1"
              />
            </div>
          </div>

          {/* 에러 메시지 표시 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "로그인 중..." : "로그인"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTestError}
              className="w-full"
            >
              에러 테스트
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
