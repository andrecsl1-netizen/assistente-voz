import React, { useState } from 'react';
import { VoicePersona } from './types';
import { AVAILABLE_VOICES, PERSONA_OPTIONS } from './data/voices';
import { useVoiceCall } from './hooks/useVoiceCall';
import { DialScreen } from './components/DialScreen';
import { CallScreen } from './components/CallScreen';
import { CallHistoryDrawer } from './components/CallHistoryDrawer';
import { CallSummaryModal } from './components/CallSummaryModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { PhoneCall, Settings2, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>('friendly');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    status,
    speakingState,
    isMuted,
    isSpeakerMuted,
    callDuration,
    transcript,
    currentUserText,
    currentAiText,
    isHandsFree,
    isPushToTalking,
    volumeLevel,
    errorNotice,
    callSummary,
    isGeneratingSummary,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    setIsHandsFree,
    handlePushToTalkStart,
    handlePushToTalkEnd,
    sendVoiceQuery,
    setErrorNotice,
    setStatus,
  } = useVoiceCall({ voiceName: selectedVoice, persona: selectedPersona });

  const currentPersonaObj = PERSONA_OPTIONS.find((p) => p.id === selectedPersona) || PERSONA_OPTIONS[0];
  const currentVoiceObj = AVAILABLE_VOICES.find((v) => v.id === selectedVoice) || AVAILABLE_VOICES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* App Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>VozChat</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                  Chamada IA
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="header-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Voz & IA</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error / Alert notice banner */}
      {errorNotice && (
        <div className="max-w-xl mx-auto px-4 mt-3 w-full">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-400 hover:text-rose-200 ml-2 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {status === 'idle' ? (
          <DialScreen
            onStartCall={startCall}
            selectedPersona={selectedPersona}
            selectedVoice={selectedVoice}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : (
          <CallScreen
            status={status === 'calling' ? 'calling' : 'connected'}
            speakingState={speakingState}
            callDuration={callDuration}
            isMuted={isMuted}
            isSpeakerMuted={isSpeakerMuted}
            isHandsFree={isHandsFree}
            isPushToTalking={isPushToTalking}
            volumeLevel={volumeLevel}
            currentUserText={currentUserText}
            currentAiText={currentAiText}
            transcriptCount={transcript.length}
            personaTitle={currentPersonaObj.title}
            voiceLabel={currentVoiceObj.label}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onToggleHandsFree={() => setIsHandsFree(!isHandsFree)}
            onPushToTalkStart={handlePushToTalkStart}
            onPushToTalkEnd={handlePushToTalkEnd}
            onEndCall={endCall}
            onOpenTranscript={() => setIsTranscriptOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSendTextMessage={sendVoiceQuery}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Conversação por chamada de voz em tempo real alimentada pelo Google Gemini</p>
      </footer>

      {/* Transcript Drawer */}
      <CallHistoryDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        messages={transcript}
        currentPersonaName={currentVoiceObj.label.split(' ')[0]}
      />

      {/* Voice & Persona Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        selectedPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
      />

      {/* Call Summary Modal (shown after call ends) */}
      <CallSummaryModal
        isOpen={status === 'ended'}
        onClose={() => setStatus('idle')}
        summary={callSummary}
        isLoading={isGeneratingSummary}
        onStartNewCall={() => {
          setStatus('idle');
          startCall();
        }}
        onViewTranscript={() => {
          setIsTranscriptOpen(true);
        }}
      />
    </div>
  );
}
