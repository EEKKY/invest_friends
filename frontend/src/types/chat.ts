export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  context: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  stockInfo?: {
    code: string;
    name: string | null;
    detectedFrom: string;
  };
  structuredData?: any; // Structured data from backend (investment analysis, etc.)
}

export interface ChatHistoryItem extends ChatMessage {
  id: string;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
}

export type ChatMessageType = 'user' | 'ai';

export interface DisplayMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  status?: 'sending' | 'sent' | 'error';
}