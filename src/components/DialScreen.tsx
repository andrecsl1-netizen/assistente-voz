import React from 'react';
import { VoicePersona } from '../types';
import { PERSONA_OPTIONS, AVAILABLE_VOICES } from '../data/voices';
import { Phone, Mic, Settings2, Sparkles, Shield, Volume2 } from 'lucide-react';

interface DialScreenProps {
  onStartCall: () => void;
  selectedPersona: VoicePersona;
  selectedVoice: string;
  onOpenSettings: () => void;
}

export const DialScreen: React.FC<DialScreenProps> = ({
  onStartCall,
  selectedPersona,
  selectedVoice,
  onOpenSettings,
}) => {
  const currentPersona = PERSONA_OPTIONS.find((p) => p.id === selectedPersona) || PERSONA_OPTIONS[0];
  const currentVoice = AVAILABLE_VOICES.find((v) => v.id === selectedVoice) || AVAILABLE_VOICES[0];

  return (
    <div
      id="dial-screen"
      className="flex flex-col items-center justify-center max-w-xl mx-auto w-full py-6 px-4"
    >
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Chamada de Voz com IA em Tempo Real</span>
      </div>

      {/* Main Avatar Card */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Decorative lighting */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Avatar Ring */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-1 shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center border-2 border-white/10">
              <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-200">
                {currentVoice.label.split(' ')[0]}
              </span>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold mt-0.5">
                Assistente
              </span>
            </div>
          </div>
          {/* Status badge */}
          <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded-full text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        {/* Assistant details */}
        <h2 className="text-2xl font-bold text-white tracking-tight">{currentPersona.title}</h2>
        <p className="text-sm text-indigo-300/90 mt-1 max-w-sm">{currentPersona.tagline}</p>
        <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
          {currentPersona.description}
        </p>

        {/* Selected Voice tag */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Voz: {currentVoice.label}</span>
          </div>
          <button
            id="configure-voice-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs text-indigo-300 hover:text-white transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Alterar</span>
          </button>
        </div>

        {/* Call Features Highlight */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3 w-full text-left">
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <Mic className="w-4 h-4 text-emerald-400 mb-1" />
            <p className="text-xs font-semibold text-slate-200">Mãos Livres</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Conversa fluida e contínua</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <Volume2 className="w-4 h-4 text-cyan-400 mb-1" />
            <p className="text-xs font-semibold text-slate-200">Voz Realista</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Síntese vocal natural</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <Shield className="w-4 h-4 text-indigo-400 mb-1" />
            <p className="text-xs font-semibold text-slate-200">Privacidade</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Transmissão segura</p>
          </div>
        </div>

        {/* Dial Button */}
        <div className="mt-8 w-full flex flex-col items-center">
          <button
            id="start-call-btn"
            onClick={onStartCall}
            className="group relative flex items-center justify-center gap-3 w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-lg shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-4 h-4" />
            </div>
            <span>Iniciar Chamada de Voz</span>
          </button>
          <span className="text-xs text-slate-400 mt-2.5">
            Ao clicar, o navegador solicitará permissão para usar seu microfone.
          </span>
        </div>
      </div>
    </div>
  );
};
