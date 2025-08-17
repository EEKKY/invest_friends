import { ChatInput } from "@/components/chat/chat-input";
import ChatArea from "@/components/chat/chat-area";
import ChatProvider from "@/contexts/chat-context";

export function AppLeft() {
  return (
    <ChatProvider>
      <div className="flex flex-col h-full w-full overflow-hidden">
        <ChatArea />
        <ChatInput />
      </div>
    </ChatProvider>
  );
}
