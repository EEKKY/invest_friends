import { useRef, useState } from "react";
import {
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Share,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
} from "lucide-react";

type Message = {
  id: number;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  isTyping: boolean;
};

const ChatArea = () => {
  const [messages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content:
        "안녕하세요! 무엇을 도와드릴까요? 궁금한 것이 있으면 언제든지 물어보세요.",
      timestamp: new Date(Date.now() - 10000),
      isTyping: false,
    },
    {
      id: 2,
      type: "user",
      content: "React에서 상태 관리는 어떻게 하는게 좋을까요?",
      timestamp: new Date(Date.now() - 5000),
      isTyping: false,
    },
    {
      id: 3,
      type: "ai",
      content: `React에서 상태 관리 방법은 여러 가지가 있어요:

**1. 로컬 상태 (useState, useReducer)**
- 컴포넌트 내부에서만 사용하는 간단한 상태
- 폼 입력, 토글 상태 등

**2. 전역 상태 관리**
- **Context API**: React 내장, 간단한 전역 상태
- **Redux Toolkit**: 복잡한 앱, 디버깅 도구 강력
- **Zustand**: 가볍고 사용하기 쉬움
- **Jotai**: 원자 단위 상태 관리

**3. 서버 상태**
- **React Query/TanStack Query**: 서버 데이터 캐싱
- **SWR**: 간단한 데이터 페칭

어떤 종류의 프로젝트를 하고 계신가요? 상황에 맞는 더 구체적인 추천을 해드릴 수 있어요!`,
      timestamp: new Date(),
      isTyping: false,
    },
  ]);

  const [typingMessage] = useState(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 스크롤을 맨 아래로
  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // };

  // 스크롤 위치 감지
  // const handleScroll = () => {
  //   const container = chatContainerRef.current;
  //   if (!container) return;

  //   const { scrollTop, scrollHeight, clientHeight } = container;
  //   const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px 여유

  //   setIsScrolledUp(!isAtBottom);
  // };

  // useEffect(() => {
  //   const container = chatContainerRef.current;
  //   if (container) {
  //     container.addEventListener("scroll", handleScroll);
  //     return () => {
  //       container.removeEventListener("scroll", handleScroll);
  //     };
  //   }
  // }, []);

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages, typingMessage]);

  // 메시지 복사
  const copyMessage = (content: string): void => {
    navigator.clipboard.writeText(content);
    console.log("메시지 복사됨:", content);
  };

  // 타이핑 애니메이션 시뮬레이션
  // const simulateTyping = () => {
  //   setTypingMessage({
  //     id: Date.now(),
  //     type: "ai",
  //     content: "",
  //     isTyping: true,
  //   });

  //   // 3초 후 실제 메시지로 변환
  //   setTimeout(() => {
  //     setTypingMessage(null);
  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         id: Date.now(),
  //         type: "ai",
  //         content: "새로운 메시지입니다! 타이핑 애니메이션이 완료되었어요.",
  //         timestamp: new Date(),
  //         isTyping: false,
  //       },
  //     ]);
  //   }, 3000);
  // };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MessageBubble = ({
    message,
    showActions = true,
  }: {
    message: Message;
    showActions: boolean;
  }) => {
    const isUser = message.type === "user";
    const [showFullActions, setShowFullActions] = useState(false);

    return (
      <div
        className={`flex gap-4 mb-6 group ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* 아바타 */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600"
              : "bg-gradient-to-br from-purple-500 to-purple-600"
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>

        {/* 메시지 콘텐츠 */}
        <div
          className={`flex-1 max-w-3xl ${isUser ? "text-right" : "text-left"}`}
        >
          {/* 메시지 버블 */}
          <div
            className={`inline-block p-4 rounded-2xl ${
              isUser
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-12"
                : "bg-white border border-gray-200 shadow-sm mr-12"
            }`}
          >
            {message.isTyping ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-gray-500 text-sm">AI가 입력 중...</span>
              </div>
            ) : (
              <div
                className={`prose prose-sm max-w-none ${
                  isUser ? "prose-invert" : ""
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            )}
          </div>

          {/* 타임스탬프 */}
          <div
            className={`mt-2 text-xs text-gray-400 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>

          {/* AI 메시지 액션 버튼들 */}
          {!isUser && !message.isTyping && showActions && (
            <div
              className={`mt-3 flex items-center gap-2 transition-opacity duration-200 ${
                showFullActions
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <button
                onClick={() => copyMessage(message.content)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="복사"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all duration-200"
                title="좋아요"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="싫어요"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="다시 생성"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all duration-200"
                title="공유"
              >
                <Share className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFullActions(!showFullActions)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="더보기"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* 헤더 */}
      {/* <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">AI 어시스턴트</h1>
              <p className="text-sm text-gray-500">온라인</p>
            </div>
          </div>
          <button
            onClick={simulateTyping}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
          >
            새 대화 시작
          </button>
        </div>
      </div> */}

      {/* 메시지 영역 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-40"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* 환영 메시지 */}
          <div className="text-center mb-8 py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI 어시스턴트와 대화하기
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              궁금한 것이 있으면 무엇이든 물어보세요. 코딩, 학습, 창작 등 다양한
              주제로 도움을 드릴 수 있어요.
            </p>
          </div>

          {/* 메시지 목록 */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showActions={true}
            />
          ))}

          {/* 타이핑 중 메시지 */}
          {typingMessage && (
            <MessageBubble message={typingMessage} showActions={false} />
          )}

          {/* 스크롤 앵커 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 스크롤 그라데이션 오버레이 */}
      <div className="fixed bottom-0 left-0 right-0 h-32 to-transparent pointer-events-none z-10"></div>

      {/* 아래로 스크롤 버튼 */}
      {isScrolledUp && (
        <div className="fixed bottom-36 right-8 z-20">
          <button
            onClick={() => {
              // scrollToBottom();
              setIsScrolledUp(false);
            }}
            className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group"
            title="최신 메시지로 이동"
          >
            <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
