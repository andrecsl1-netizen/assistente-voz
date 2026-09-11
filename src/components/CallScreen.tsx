import React, { useState } from 'react';
import { SpeakingState, VoicePersona } from '../types';
import { AudioWaveform } from './AudioWaveform';
import { formatCallDuration } from '../utils/audio';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Radio,
  Sparkles,
  Settings2,
} from 'lucide-react';

interface CallScreenProps {
  status: 'calling' | 'connected';
  speakingState: SpeakingState;
  callDuration: number;
  isMuted: boolean;
  isSpeakerMuted: boolean;
  isHandsFree: boolean;
  isPushToTalking: boolean;
  volumeLevel: number;
  currentUserText: string;
  currentAiText: string;
  transcriptCount: number;
  personaTitle: string;
  voiceLabel: string;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleHandsFree: () => void;
  onPushToTalkStart: () => void;
  onPushToTalkEnd: () => void;
  onEndCall: () => void;
  onOpenTranscript: () => void;
  onOpenSettings: () => void;
  onSendTextMessage: (text: string) => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  status,
  speakingState,
  callDuration,
  isMuted,
  isSpeakerMuted,
  isHandsFree,
  isPushToTalking,
  volumeLevel,
  currentUserText,
  currentAiText,
  transcriptCount,
  personaTitle,
  voiceLabel,
  onToggleMute,
  onToggleSpeaker,
  onToggleHandsFree,
  onPushToTalkStart,
  onPushToTalkEnd,
  onEndCall,
  onOpenTranscript,
  onOpenSettings,
  onSendTextMessage,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      onSendTextMessage(typedInput.trim());
      setTypedInput('');
    }
  };

  return (
    <div
      id="active-call-screen"
      className="flex flex-col items-center justify-between min-h-[600px] max-w-3xl mx-auto w-full py-4 px-4 relative text-white"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{status === 'calling' ? 'Discando...' : 'Chamada Ativa'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <span>{personaTitle}</span>
            <span>•</span>
            <span>{voiceLabel}</span>
          </div>
        </div>

        {/* Call Duration Timer */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-mono tracking-wider font-semibold text-slate-200 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800">
            {formatCallDuration(callDuration)}
          </div>

          <button
            id="view-transcript-btn"
            onClick={onOpenTranscript}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Ver Transcrição"
          >
            <MessageSquare className="w-4 h-4" />
            {transcriptCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center font-bold text-white">
                {transcriptCount}
              </span>
            )}
          </button>

          <button
            id="open-settings-during-call-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Ajustes de Voz"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Stage: Audio Waveform Orb */}
      <div className="w-full flex-1 flex flex-col items-center justify-center py-6">
        {status === 'calling' ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-32 h-32 rounded-full bg-indigo-600/20 border-2 border-indigo-400 flex items-center justify-center">
              <Radio className="w-12 h-12 text-indigo-400 animate-spin" />
            </div>
            <p className="text-lg font-medium text-slate-300">Conectando chamada de voz...</p>
            <p className="text-xs text-slate-500">Aguardando atendimento do assistente IA</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <AudioWaveform
              volumeLevel={volumeLevel}
              speakingState={speakingState}
              isMuted={isMuted}
            />

            {/* Live Subtitle / Caption Card */}
            <div className="w-full max-w-xl mt-4 px-4">
              {currentUserText ? (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center animate-in fade-in duration-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block mb-1">
                    Você está dizendo:
                  </span>
                  <p className="text-sm text-indigo-100 font-medium italic">
                    "{currentUserText}"
                  </p>
                </div>
              ) : currentAiText ? (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center animate-in fade-in duration-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Assistente:
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {currentAiText}
                  </p>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500 py-2">
                  {isMuted
                    ? 'Microfone mutado. Clique no microfone abaixo para reativar.'
                    : isHandsFree
                    ? 'Fale normalmente pelo microfone. A IA responderá ao fazer uma pausa.'
                    : 'Segure o botão de falar para gravar e solte para enviar.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Optional In-Call Text Input Bar */}
      {showTextInput && (
        <form
          onSubmit={handleSendText}
          className="w-full max-w-xl mb-4 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200"
        >
          <input
            id="in-call-text-input"
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Digite algo para a IA responder por voz..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!typedInput.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-3">
        {/* Mode Selector Pill */}
        <div className="flex items-center justify-between w-full px-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleHandsFree}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                isHandsFree
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Mãos Livres
            </button>
            <button
              onClick={onToggleHandsFree}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                !isHandsFree
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Pressionar p/ Falar
            </button>
          </div>

          <button
            onClick={() => setShowTextInput((prev) => !prev)}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            {showTextInput ? 'Ocultar teclado' : 'Digitar mensagem'}
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 w-full pt-1">
          {/* Mute Microphone */}
          <button
            id="toggle-mic-btn"
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isMuted
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            <span className="text-[10px] mt-0.5 font-medium">
              {isMuted ? 'Mudo' : 'Mic'}
            </span>
          </button>

          {/* If Push to talk mode is active, show large push-to-talk trigger */}
          {!isHandsFree ? (
            <button
              id="push-to-talk-btn"
              onMouseDown={onPushToTalkStart}
              onMouseUp={onPushToTalkEnd}
              onTouchStart={onPushToTalkStart}
              onTouchEnd={onPushToTalkEnd}
              className={`flex-1 max-w-[200px] h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all select-none ${
                isPushToTalking
                  ? 'bg-indigo-500 text-white scale-95 shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-400/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Mic className={`w-5 h-5 ${isPushToTalking ? 'animate-bounce' : ''}`} />
              <span>{isPushToTalking ? 'Ouvindo...' : 'Segure p/ Falar'}</span>
            </button>
          ) : null}

          {/* Speaker Mute/Unmute */}
          <button
            id="toggle-speaker-btn"
            onClick={onToggleSpeaker}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
              isSpeakerMuted
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isSpeakerMuted ? 'Ligar Alto-falante' : 'Mutar Alto-falante'}
          >
            {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            <span className="text-[10px] mt-0.5 font-medium">
              {isSpeakerMuted ? 'Sem Som' : 'Som'}
            </span>
          </button>

          {/* Red Hangup Call Button */}
          <button
            id="hangup-call-btn"
            onClick={onEndCall}
            className="w-16 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
            title="Encerrar Chamada"
          >
            <PhoneOff className="w-6 h-6" />
            <span className="text-[10px] mt-0.5 font-medium">Desligar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
