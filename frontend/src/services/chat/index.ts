import { api } from "../axios";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types/chat";

export const chatApi = {
  sendMessage: async (
    message: string,
    context: ChatMessage[] = []
  ): Promise<ChatResponse> => {
    try {
      const request: ChatRequest = {
        message,
        context:
          context.length > 0
            ? context
            : [
                {
                  role: "user",
                  content: "string",
                },
              ],
      };

      // Chat API는 더 긴 타임아웃 설정 (60초)
      const { data } = await api.post<ChatResponse>("/agentica/chat", request, {
        timeout: 600000, // 60 seconds
      });
      return data;
    } catch (error: any) {
      console.error("Chat API error:", error);

      // 타임아웃 에러 처리
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          message:
            "응답 시간이 초과되었습니다. 더 간단한 질문으로 다시 시도해 주세요.",
        };
      }

      return {
        success: false,
        message: "메시지 전송 중 오류가 발생했습니다. 다시 시도해 주세요.",
      };
    }
  },
};
