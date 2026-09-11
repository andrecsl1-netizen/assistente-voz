export type CallStatus = 'idle' | 'calling' | 'connected' | 'ended';

export type SpeakingState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted';

export type VoicePersona = 'friendly' | 'professional' | 'mentor' | 'storyteller';

export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  description: string;
  gender: 'female' | 'male' | 'neutral';
  accent: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  audioBase64?: string | null;
  duration?: number;
}

export interface CallSummaryData {
  durationSeconds: number;
  totalMessages: number;
  summaryText: string;
  endedAt: string;
}
