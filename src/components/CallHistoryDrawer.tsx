import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { X, Copy, Check, Volume2, Bot, User, MessageSquare } from 'lucide-react';
import { speakWithBrowser, playPcmAudio } from '../utils/audio';

interface CallHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentPersonaName: string;
}

export const CallHistoryDrawer: React.FC<CallHistoryDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  currentPersonaName,
}) => {
  const [copied, setCopied] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'user' ? 'Você' : currentPersonaName}: ${m.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplayAudio = async (msg: ChatMessage) => {
    if (playingId === msg.id) return;
    setPlayingId(msg.id);

    try {
      if (msg.audioBase64) {
        await playPcmAudio(msg.audioBase64, 24000, () => setPlayingId(null));
      } else {
        await speakWithBrowser(msg.text, undefined, () => setPlayingId(null));
      }
    } catch {
      setPlayingId(null);
    }
  };

  return (
    <div
      id="call-history-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity"
    >
      <div
        id="call-history-drawer"
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base text-white">Transcrição da Chamada</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="copy-transcript-btn"
              onClick={handleCopyTranscript}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs"
              title="Copiar transcrição"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              id="close-transcript-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 text-sm">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <p>Nenhuma fala registrada até o momento.</p>
              <p className="text-xs text-slate-500 mt-1">Fale pelo microfone durante a chamada para ver a transcrição em tempo real.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs text-slate-400">
                  {msg.sender === 'user' ? (
                    <>
                      <span>{msg.timestamp}</span>
                      <span className="font-medium text-slate-300">Você</span>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-medium text-indigo-300">{currentPersonaName}</span>
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.sender === 'ai' && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                      <button
                        onClick={() => handleReplayAudio(msg)}
                        disabled={playingId === msg.id}
                        className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${playingId === msg.id ? 'animate-pulse text-indigo-400' : ''}`} />
                        <span>{playingId === msg.id ? 'Ouvindo...' : 'Ouvir novamente'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
