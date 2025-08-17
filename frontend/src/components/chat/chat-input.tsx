import React, { useState, useRef, useEffect, useCallback, useId, memo } from "react";
import {
  Send,
  Mic,
  Square,
  Sparkles,
  Plus,
  Image,
  FileText,
  Trash2,
} from "lucide-react";
import { useChatContext } from "@/contexts/chat-context.hooks";
import { toast } from "sonner";

type FileUploadType = "image" | "file";

interface AttachedFile {
  id: string;
  file: File;
  type: "image" | "document";
  preview?: string;
}

// Memoized attachment preview component
const AttachmentPreview = memo(({ 
  attachments, 
  onRemove 
}: { 
  attachments: AttachedFile[]; 
  onRemove: (id: string) => void;
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className="mb-3 px-4">
      <div className="flex gap-2 flex-wrap">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative group bg-white rounded-lg border border-gray-200 p-2 flex items-center gap-2"
          >
            {attachment.type === "image" && attachment.preview ? (
              <img
                src={attachment.preview}
                alt={attachment.file.name}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {attachment.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(attachment.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => onRemove(attachment.id)}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 rounded"
              title="제거"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

AttachmentPreview.displayName = "AttachmentPreview";

const ChatInput = () => {
  const { sendMessage, isPending, clearChat } = useChatContext();
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Generate unique IDs for file inputs
  const fileInputId = useId();
  const imageInputId = useId();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  }, [message]);

  // Handle message submission
  const handleSubmit = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    
    // Prevent double submission
    if (isSending || isPending) return;

    // Build message with attachments info
    let fullMessage = trimmedMessage;
    if (attachments.length > 0) {
      fullMessage += `\n\n[첨부 파일: ${attachments.map(a => a.file.name).join(", ")}]`;
    }

    try {
      setIsSending(true);
      await sendMessage(fullMessage);
      setMessage("");
      setAttachments([]);
      setShowAttachMenu(false);
    } catch {
      toast.error("메시지 전송에 실패했습니다");
    } finally {
      setIsSending(false);
    }
  }, [message, attachments, sendMessage, isSending, isPending]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && !isPending) {
        handleSubmit();
      }
    }
    // Cmd/Ctrl + K to clear chat
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      clearChat();
      toast.success("대화가 초기화되었습니다");
    }
  }, [handleSubmit, clearChat, isSending, isPending]);

  // Handle file upload
  const handleFileUpload = useCallback((type: FileUploadType) => {
    if (type === "image") {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
    setShowAttachMenu(false);
  }, []);

  // Process file attachments
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachedFile[] = [];

    Array.from(files).forEach(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}는 10MB를 초과합니다`);
        return;
      }

      const attachment: AttachedFile = {
        id: crypto.randomUUID(),
        file,
        type,
      };

      // Create preview for images
      if (type === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push(attachment);
      }
    });

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }

    // Reset input
    e.target.value = "";
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Voice recording with Web Audio API
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          file: audioFile,
          type: "document",
        }]);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("녹음을 시작합니다");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("마이크 접근 권한이 필요합니다");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("녹음이 완료되었습니다");
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200">
      <div className="relative px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Attachment Menu */}
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
                    <span className="text-xs text-gray-600 font-medium">이미지</span>
                  </button>
                  <button
                    onClick={() => handleFileUpload("file")}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">파일</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attachment Previews */}
          <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

          {/* Main Input Area */}
          <div className="relative">
            <div
              className={`relative flex items-end bg-white/90 backdrop-blur-xl border-2 rounded-3xl shadow-2xl transition-all duration-300 ${
                isPending 
                  ? "border-gray-300 bg-gray-50/90"
                  : isFocused
                  ? "border-blue-400 shadow-blue-200/50 shadow-2xl"
                  : "border-gray-200/50 hover:border-gray-300/50"
              }`}
            >
              {/* AI Icon */}
              <div className="flex-shrink-0 p-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={isPending ? "AI가 응답 중입니다..." : "메시지를 입력하세요"}
                  disabled={isPending || isSending}
                  className="w-full bg-transparent border-0 outline-none resize-none py-4 pr-4 text-gray-900 placeholder-gray-400 text-base leading-6 max-h-44 overflow-y-auto font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={1}
                  style={{ minHeight: "24px" }}
                />

              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-1 p-2">
                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  disabled={isPending || isSending}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    showAttachMenu
                      ? "bg-blue-100 text-blue-600 rotate-45"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label="파일 첨부"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Voice Recording Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isPending || isSending}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isRecording
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={isRecording ? "녹음 중지" : "음성 녹음"}
                >
                  {isRecording ? (
                    <Square className="w-5 h-5 fill-current" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={(!message.trim() && attachments.length === 0) || isPending || isSending}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    (message.trim() || attachments.length > 0) && !isSending
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                      : "text-gray-300 cursor-not-allowed"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label="메시지 전송"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              onChange={(e) => handleFileChange(e, "document")}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
              multiple
            />
            <input
              ref={imageInputRef}
              id={imageInputId}
              type="file"
              onChange={(e) => handleFileChange(e, "image")}
              className="hidden"
              accept="image/*"
              multiple
            />

            {/* Help Text */}
            <div className="flex items-center justify-center mt-3">
              <div className="text-xs text-gray-400 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/30">
                <span className="font-medium">Enter</span>로 전송 •
                <span className="font-medium"> Shift + Enter</span>로 줄바꿈 •
                <span className="font-medium"> Cmd/Ctrl + K</span>로 초기화
              </div>
            </div>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center justify-center mt-4">
              <div className="bg-red-50 border border-red-200 rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 text-sm font-medium">녹음 중...</span>
                <div className="flex gap-1">
                  {[0, 150, 300, 450].map((delay) => (
                    <div
                      key={delay}
                      className="w-1 h-4 bg-red-400 rounded-full animate-pulse"
                      style={{ 
                        animationDelay: `${delay}ms`,
                        height: `${Math.random() * 12 + 8}px` 
                      }}
                    />
                  ))}
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