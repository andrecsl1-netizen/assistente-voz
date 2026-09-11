import React from 'react';
import { SpeakingState } from '../types';
import { Mic, Volume2, Sparkles, MicOff } from 'lucide-react';

interface AudioWaveformProps {
  volumeLevel: number;
  speakingState: SpeakingState;
  isMuted: boolean;
  avatarSeed?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  volumeLevel,
  speakingState,
  isMuted,
}) => {
  // Normalize volume level (0 to 100)
  const normalizedVol = Math.max(8, Math.min(100, volumeLevel));
  const scale = 1 + (normalizedVol / 100) * 0.35;
  const outerScale = 1 + (normalizedVol / 100) * 0.7;

  // Visual cues based on current state
  const getStateConfig = () => {
    if (isMuted) {
      return {
        ringColor: 'border-amber-400/40 bg-amber-500/10',
        coreBg: 'from-amber-600 to-amber-800',
        glow: 'rgba(245, 158, 11, 0.25)',
        statusText: 'Microfone Mutado',
        statusColor: 'text-amber-300',
        icon: <MicOff className="w-8 h-8 text-white" />,
      };
    }
    switch (speakingState) {
      case 'listening':
        return {
          ringColor: 'border-emerald-400/40 bg-emerald-500/10',
          coreBg: 'from-emerald-500 to-teal-700',
          glow: 'rgba(16, 185, 129, 0.35)',
          statusText: 'Ouvindo sua voz...',
          statusColor: 'text-emerald-300',
          icon: <Mic className="w-8 h-8 text-white animate-pulse" />,
        };
      case 'thinking':
        return {
          ringColor: 'border-cyan-400/40 bg-cyan-500/10',
          coreBg: 'from-cyan-600 to-blue-700',
          glow: 'rgba(6, 182, 212, 0.35)',
          statusText: 'Processando resposta...',
          statusColor: 'text-cyan-300',
          icon: <Sparkles className="w-8 h-8 text-white animate-spin" />,
        };
      case 'speaking':
        return {
          ringColor: 'border-indigo-400/50 bg-indigo-500/15',
          coreBg: 'from-indigo-600 to-violet-700',
          glow: 'rgba(99, 102, 241, 0.45)',
          statusText: 'Assistente falando...',
          statusColor: 'text-indigo-300',
          icon: <Volume2 className="w-8 h-8 text-white animate-bounce" />,
        };
      default:
        return {
          ringColor: 'border-slate-500/30 bg-slate-700/10',
          coreBg: 'from-slate-700 to-slate-800',
          glow: 'rgba(148, 163, 184, 0.2)',
          statusText: 'Pronto para conversar',
          statusColor: 'text-slate-300',
          icon: <Mic className="w-8 h-8 text-slate-300" />,
        };
    }
  };

  const config = getStateConfig();

  // Generate 20 sound wave bars for lower visualizer
  const barHeights = React.useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const offset = Math.sin((i / 24) * Math.PI) * 0.8;
      const randomJitter = ((i % 3) + 1) * 0.15;
      return Math.max(12, Math.round(normalizedVol * offset * randomJitter + 14));
    });
  }, [normalizedVol]);

  return (
    <div id="audio-waveform-container" className="flex flex-col items-center justify-center relative py-6">
      {/* Dynamic Halo Rings */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
        {/* Outermost expanding pulse ring */}
        <div
          className={`absolute rounded-full border transition-all duration-200 pointer-events-none ${config.ringColor}`}
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${outerScale})`,
            boxShadow: `0 0 50px ${config.glow}`,
          }}
        />

        {/* Middle secondary pulse ring */}
        <div
          className={`absolute rounded-full border transition-all duration-150 pointer-events-none ${config.ringColor}`}
          style={{
            width: '80%',
            height: '80%',
            transform: `scale(${scale})`,
          }}
        />

        {/* Central Voice Orb Core */}
        <div
          className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br ${config.coreBg} shadow-2xl flex flex-col items-center justify-center transition-transform duration-150 border-2 border-white/20`}
          style={{
            transform: `scale(${1 + (normalizedVol / 100) * 0.15})`,
          }}
        >
          {config.icon}
          <div className="mt-2 text-xs font-semibold tracking-wider text-white/90 uppercase">
            Voz HD
          </div>
        </div>
      </div>

      {/* Real-time Frequency Waveform Bars */}
      <div className="flex items-center gap-1.5 h-12 mt-6 px-4 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50">
        {barHeights.map((h, idx) => (
          <div
            key={idx}
            className="w-1 rounded-full transition-all duration-75 bg-gradient-to-t from-indigo-400 to-cyan-300"
            style={{
              height: `${Math.min(40, h)}px`,
              opacity: 0.3 + (h / 40) * 0.7,
            }}
          />
        ))}
      </div>

      {/* Sub-label state */}
      <div className="mt-4 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              speakingState === 'speaking'
                ? 'bg-indigo-400'
                : speakingState === 'listening'
                ? 'bg-emerald-400'
                : 'bg-slate-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              speakingState === 'speaking'
                ? 'bg-indigo-500'
                : speakingState === 'listening'
                ? 'bg-emerald-500'
                : 'bg-slate-500'
            }`}
          />
        </span>
        <span className={`text-sm font-medium tracking-wide ${config.statusColor}`}>
          {config.statusText}
        </span>
      </div>
    </div>
  );
};
