import {
  useRef,
  useState,
  useEffect,
  memo,
  useCallback,
  useDeferredValue,
} from "react";
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Share,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { type Message } from "@/contexts/chat-context.types";
import { useChatContext } from "@/contexts/chat-context.hooks";
import { toast } from "sonner";

// Memoized message bubble component for better performance
const MessageBubble = memo(
  ({
    message,
    showActions = true,
    onRegenerate,
  }: {
    message: Message;
    showActions: boolean;
    onRegenerate?: (id: string) => void;
  }) => {
    const isUser = message.type === "user";
    const [showFullActions, setShowFullActions] = useState(false);
    const [liked, setLiked] = useState<boolean | null>(null);

    const formatTime = useCallback((timestamp: Date) => {
      return timestamp.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, []);

    const copyMessage = useCallback((content: string) => {
      navigator.clipboard.writeText(content).then(() => {
        toast.success("메시지가 복사되었습니다");
      });
    }, []);

    const handleShare = useCallback(
      async (content: string) => {
        if (navigator.share) {
          try {
            await navigator.share({
              text: content,
              title: "AI 대화 공유",
            });
          } catch (err) {
            console.log("Share failed:", err);
          }
        } else {
          copyMessage(content);
        }
      },
      [copyMessage]
    );

    const handleLike = useCallback((isLike: boolean) => {
      setLiked(isLike);
      toast.success(isLike ? "피드백 감사합니다!" : "피드백이 기록되었습니다");
    }, []);

    return (
      <div
        className={`flex gap-4 mb-6 group ${
          isUser ? "flex-row-reverse" : "flex-row"
        } ${message.status === "sending" ? "opacity-70" : ""}`}
      >
        {/* Avatar - Only show for AI */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Message Content */}
        <div
          className={`flex-1 max-w-3xl ${isUser ? "text-right" : "text-left"}`}
        >
          {/* Message Bubble */}
          <div
            className={`inline-block p-4 rounded-2xl ${
              isUser
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                : "bg-white border border-gray-200 shadow-sm mr-12"
            }`}
          >
            {message.isTyping ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-gray-500 text-sm">분석 중입니다...</span>
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

          {/* Timestamp & Status */}
          <div
            className={`mt-2 text-xs text-gray-400 flex items-center gap-2 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {formatTime(message.timestamp)}
            {message.status === "sending" && (
              <span className="text-blue-500">전송 중...</span>
            )}
            {message.status === "error" && (
              <span className="text-red-500">전송 실패</span>
            )}
          </div>

          {/* AI Message Actions */}
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
                onClick={() => handleLike(true)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  liked === true
                    ? "text-green-500 bg-green-50"
                    : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                }`}
                title="좋아요"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleLike(false)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  liked === false
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                }`}
                title="싫어요"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="다시 생성"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleShare(message.content)}
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
  }
);

MessageBubble.displayName = "MessageBubble";

const ChatArea = () => {
  const { optimisticMessages, isTyping, regenerateMessage, isPending } =
    useChatContext();
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use deferred value for messages to keep UI responsive
  const deferredMessages = useDeferredValue(optimisticMessages);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle scroll detection
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setIsScrolledUp(!isAtBottom);
  }, []);

  // Auto scroll on new messages or when typing status changes
  useEffect(() => {
    // Scroll to bottom when messages change
    if (deferredMessages.length > 0) {
      // Longer delay for content changes to ensure DOM is fully updated
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [deferredMessages, scrollToBottom]);

  // Additional scroll trigger for typing indicator changes
  useEffect(() => {
    if (!isTyping && deferredMessages.length > 0) {
      // When typing stops (AI response arrives), scroll to bottom
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isTyping, scrollToBottom, deferredMessages.length]);

  // Setup scroll listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
        style={{
          scrollbarWidth: "thin",
          overscrollBehavior: "contain",
        }}
      >
        <div className="max-w-4xl mx-auto min-h-full flex flex-col">
          {/* Welcome Message - Only show when no messages */}
          {deferredMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  아젠티카와함께하는 투자친구 AI
                </h2>
                <p className="text-gray-500 max-w-md">
                  궁금한 것이 있으면 무엇이든 물어보세요. 주식정보를 물어보세요!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              {/* Message List */}
              {deferredMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showActions={!isPending}
                  onRegenerate={regenerateMessage}
                />
              ))}
              {/* Scroll Anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {isScrolledUp && (
        <div className="absolute bottom-8 right-8 z-30">
          <button
            onClick={() => {
              scrollToBottom();
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
