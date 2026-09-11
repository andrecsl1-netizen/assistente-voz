import React, { useState } from 'react';
import { VoiceOption, VoicePersona } from '../types';
import { AVAILABLE_VOICES, PERSONA_OPTIONS } from '../data/voices';
import { X, Volume2, Check, Sparkles, UserCheck } from 'lucide-react';
import { speakWithBrowser, playPcmAudio } from '../utils/audio';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  selectedPersona: VoicePersona;
  onSelectPersona: (persona: VoicePersona) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  selectedPersona,
  onSelectPersona,
}) => {
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestVoice = async (voice: VoiceOption) => {
    setTestingVoiceId(voice.id);
    const samplePhrase = `Olá! Sou a voz ${voice.label}. Estou pronta para conversar com você nesta chamada.`;

    try {
      // Try backend TTS first
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: samplePhrase, voiceName: voice.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          await playPcmAudio(data.audioBase64, data.sampleRate || 24000, () => setTestingVoiceId(null));
          return;
        }
      }
    } catch {}

    // Fallback to browser TTS
    await speakWithBrowser(samplePhrase, undefined, () => setTestingVoiceId(null));
  };

  return (
    <div
      id="voice-settings-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="voice-settings-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Configurações de Voz & Personalidade</h3>
          </div>
          <button
            id="close-voice-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Persona selector */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Personalidade do Assistente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONA_OPTIONS.map((item) => {
                const isSelected = selectedPersona === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPersona(item.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-sm text-white">{item.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-indigo-300/80 mb-1">{item.tagline}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice selector */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Voz de Síntese
            </h4>
            <div className="space-y-2">
              {AVAILABLE_VOICES.map((voice) => {
                const isSelected = selectedVoice === voice.id;
                const isTesting = testingVoiceId === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => onSelectVoice(voice.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {voice.label.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{voice.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {voice.accent}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{voice.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(voice);
                      }}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                        isTesting
                          ? 'bg-indigo-500 text-white border-indigo-400 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Ouvir demonstração"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{isTesting ? 'Tocando...' : 'Testar'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            Confirmar e Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
