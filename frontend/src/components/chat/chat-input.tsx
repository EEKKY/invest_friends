import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Square,
  Sparkles,
  Plus,
  Image,
  FileText,
} from "lucide-react";

// 타입 정의 추가 (파일 상단에 추가)
type FileUploadType = "image" | "file";

const ChatInput = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // useRef 타입 명시
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 텍스트가 변경될 때 textarea 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  }, [message]);

  const handleSubmit = (): void => {
    if (message.trim()) {
      console.log("메시지 전송:", message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (type: FileUploadType): void => {
    if (type === "image") {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
    setShowAttachMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("파일 업로드:", files[0]);
    }
  };

  const toggleRecording = (): void => {
    setIsRecording(!isRecording);
    console.log(isRecording ? "녹음 중지" : "녹음 시작");
  };

  return (
    <div className="z-50 sticky bottom-0 b">
      <div className="relative px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* 첨부 메뉴 */}
          {showAttachMenu && (
            <div className="mb-4 flex justify-center">
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-3 shadow-xl">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFileUpload("image")}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      이미지
                    </span>
                  </button>
                  <button
                    onClick={() => handleFileUpload("file")}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      파일
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 메인 입력 영역 */}
          <div className="relative">
            <div
              className={`relative flex items-end bg-white/90 backdrop-blur-xl border-2 rounded-3xl shadow-2xl transition-all duration-300 ${
                isFocused
                  ? "border-blue-400 shadow-blue-200/50 shadow-2xl"
                  : "border-gray-200/50 hover:border-gray-300/50"
              }`}
            >
              {/* AI 아이콘 (왼쪽) */}
              <div className="flex-shrink-0 p-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* 텍스트 입력 영역 */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder=""
                  className="w-full bg-transparent border-0 outline-none resize-none py-4 pr-4 text-gray-900 placeholder-gray-400 text-base leading-6 max-h-44 overflow-y-auto font-medium"
                  rows={1}
                  style={{ minHeight: "24px" }}
                />

                {/* 플레이스홀더 애니메이션 */}
                {!message && !isFocused && (
                  <div className="absolute top-4 left-0 pointer-events-none">
                    <div className="animate-pulse text-gray-300">
                      <span className="inline-block">부자가 되고싶다!</span>
                      <span className="inline-block animate-bounce ml-1">
                        ✨
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽 컨트롤 버튼들 */}
              <div className="flex items-center gap-1 p-2">
                {/* 첨부 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    showAttachMenu
                      ? "bg-blue-100 text-blue-600 rotate-45"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label="파일 첨부"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* 음성 녹음 버튼 */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isRecording
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label={isRecording ? "녹음 중지" : "음성 녹음"}
                >
                  {isRecording ? (
                    <Square className="w-5 h-5 fill-current" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* 전송 버튼 */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!message.trim()}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    message.trim()
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                  aria-label="메시지 전송"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 숨겨진 파일 입력들 */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
              multiple
            />
            <input
              ref={imageInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />

            {/* 안내 텍스트 */}
            <div className="flex items-center justify-center mt-3">
              <div className="text-xs text-gray-400 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/30">
                <span className="font-medium">Enter</span>로 전송 •
                <span className="font-medium"> Shift + Enter</span>로 줄바꿈
              </div>
            </div>
          </div>

          {/* 녹음 중 표시 */}
          {isRecording && (
            <div className="flex items-center justify-center mt-4">
              <div className="bg-red-50 border border-red-200 rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 text-sm font-medium">
                  녹음 중...
                </span>
                <div className="flex gap-1">
                  <div
                    className="w-1 h-3 bg-red-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1 h-4 bg-red-500 rounded-full animate-pulse"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1 h-2 bg-red-400 rounded-full animate-pulse"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                  <div
                    className="w-1 h-5 bg-red-500 rounded-full animate-pulse"
                    style={{ animationDelay: "450ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ChatInput };
