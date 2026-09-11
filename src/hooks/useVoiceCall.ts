import { useState, useEffect, useRef, useCallback } from 'react';
import { CallStatus, SpeakingState, ChatMessage, VoicePersona, CallSummaryData } from '../types';
import {
  playRingtone,
  playConnectChime,
  playHangupSound,
  playMicToggleBeep,
  playPcmAudio,
  speakWithBrowser,
  stopCurrentAudio,
  getAudioContext,
} from '../utils/audio';

interface UseVoiceCallOptions {
  voiceName: string;
  persona: VoicePersona;
}

export function useVoiceCall({ voiceName, persona }: UseVoiceCallOptions) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [speakingState, setSpeakingState] = useState<SpeakingState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [currentUserText, setCurrentUserText] = useState('');
  const [currentAiText, setCurrentAiText] = useState('');
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [isPushToTalking, setIsPushToTalking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [callSummary, setCallSummary] = useState<CallSummaryData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Refs for stable access in callbacks
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const isProcessingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const isHandsFreeRef = useRef(isHandsFree);
  const transcriptRef = useRef(transcript);
  const speakingStateRef = useRef(speakingState);
  const statusRef = useRef(status);

  // Keep refs updated
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  useEffect(() => {
    speakingStateRef.current = speakingState;
  }, [speakingState]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Audio level monitoring loop
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current || statusRef.current !== 'connected') {
          setVolumeLevel(0);
          return;
        }

        // If AI is speaking, generate animated pulse wave
        if (speakingStateRef.current === 'speaking') {
          const wave = 35 + Math.sin(Date.now() / 80) * 25 + Math.cos(Date.now() / 140) * 15;
          setVolumeLevel(Math.max(10, Math.min(95, wave)));
        } else if (speakingStateRef.current === 'thinking') {
          const gentle = 20 + Math.sin(Date.now() / 200) * 10;
          setVolumeLevel(gentle);
        } else if (isMutedRef.current) {
          setVolumeLevel(0);
        } else {
          // Microphone volume
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Scale from 0 to 100
          const level = Math.min(100, Math.round((average / 128) * 100));
          setVolumeLevel(level);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Audio analysis setup error:', err);
    }
  }, []);

  // Send message to voice chat API
  const sendVoiceQuery = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setSpeakingState('thinking');
    setCurrentUserText(text);

    // Add user message to transcript
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscript((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: transcriptRef.current,
          voiceName,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.replyText || 'Desculpe, não consegui processar a resposta.';

      setCurrentAiText(reply);

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: data.audioBase64,
      };

      setTranscript((prev) => [...prev, aiMsg]);

      // If speaker is muted, just finish speaking
      if (isSpeakerMuted) {
        setSpeakingState('listening');
        isProcessingRef.current = false;
        return;
      }

      // Play audio response: prefer Gemini TTS PCM audio, fallback to Web Speech
      setSpeakingState('speaking');

      const onAudioFinished = () => {
        setSpeakingState('listening');
        isProcessingRef.current = false;
      };

      if (data.audioBase64) {
        try {
          await playPcmAudio(data.audioBase64, data.sampleRate || 24000, onAudioFinished);
        } catch {
          await speakWithBrowser(reply, undefined, onAudioFinished);
        }
      } else {
        await speakWithBrowser(reply, undefined, onAudioFinished);
      }
    } catch (err: any) {
      console.error('Error during voice chat:', err);
      setErrorNotice('Falha na comunicação de voz. Tente falar novamente.');
      setSpeakingState('listening');
      isProcessingRef.current = false;
    }
  }, [voiceName, persona, isSpeakerMuted]);

  // Initialize Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in this browser');
      setErrorNotice('Navegador sem suporte nativo a reconhecimento de voz. Você ainda pode interagir por texto e ouvir a IA.');
      return null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      // Don't listen if muted or AI is currently talking
      if (isMutedRef.current || speakingStateRef.current === 'speaking' || speakingStateRef.current === 'thinking') {
        return;
      }

      let interim = '';
      let finalSentence = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalSentence += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const spokenText = (finalSentence || interim).trim();
      if (spokenText) {
        setCurrentUserText(spokenText);
        setSpeakingState('listening');

        // Reset silence detection timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // In hands-free mode, trigger query after pause
        if (isHandsFreeRef.current) {
          silenceTimerRef.current = window.setTimeout(() => {
            if (spokenText && !isProcessingRef.current && speakingStateRef.current !== 'speaking') {
              sendVoiceQuery(spokenText);
              setCurrentUserText('');
            }
          }, 1400);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        setErrorNotice('Permissão de microfone negada. Autorize o microfone para conversar por voz.');
      }
    };

    recognition.onend = () => {
      // Auto-restart if call is still active
      if (statusRef.current === 'connected' && !isMutedRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    return recognition;
  }, [sendVoiceQuery]);

  // Start Call Flow
  const startCall = useCallback(async () => {
    setErrorNotice(null);
    setTranscript([]);
    setCallSummary(null);
    setCallDuration(0);
    setCurrentUserText('');
    setCurrentAiText('');
    setStatus('calling');
    setSpeakingState('idle');

    // Play ringing tone
    ringtoneStopRef.current = playRingtone();

    // Request microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      startAudioAnalysis(stream);
    } catch (err: any) {
      console.warn('Microphone access warning:', err);
      // Even without mic, we allow call to start (user can type or use fallback)
    }

    // Simulate call pickup after 1.8s
    setTimeout(async () => {
      if (ringtoneStopRef.current) {
        ringtoneStopRef.current();
        ringtoneStopRef.current = null;
      }

      playConnectChime();
      setStatus('connected');
      setSpeakingState('speaking');

      // Start call duration timer
      callTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Start speech recognition
      const rec = initSpeechRecognition();
      recognitionRef.current = rec;
      if (rec) {
        try {
          rec.start();
        } catch {}
      }

      // Initial friendly greeting
      let greeting = 'Olá! Que bom falar com você. Como posso te ajudar hoje?';
      if (persona === 'professional') {
        greeting = 'Olá! Chamada iniciada com sucesso. Em que posso ser útil neste momento?';
      } else if (persona === 'mentor') {
        greeting = 'Olá, é ótimo ter esse tempo com você. O que está passando pela sua mente hoje?';
      } else if (persona === 'storyteller') {
        greeting = 'Olá! Voz e mente conectadas. Sobre qual tema fascinante vamos conversar?';
      }

      setCurrentAiText(greeting);
      const greetingMsg: ChatMessage = {
        id: 'msg_welcome',
        sender: 'ai',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscript([greetingMsg]);

      // Speak greeting
      if (!isSpeakerMuted) {
        await speakWithBrowser(greeting, undefined, () => {
          setSpeakingState('listening');
        });
      } else {
        setSpeakingState('listening');
      }
    }, 1800);
  }, [persona, isSpeakerMuted, initSpeechRecognition, startAudioAnalysis]);

  // End Call Flow
  const endCall = useCallback(async () => {
    if (ringtoneStopRef.current) {
      ringtoneStopRef.current();
      ringtoneStopRef.current = null;
    }

    playHangupSound();
    stopCurrentAudio();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setStatus('ended');
    setSpeakingState('idle');
    setVolumeLevel(0);

    // Generate call summary if there were interactions
    const currentMessages = transcriptRef.current;
    if (currentMessages.length > 1) {
      setIsGeneratingSummary(true);
      try {
        const res = await fetch('/api/call-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callLog: currentMessages }),
        });
        const summaryData = await res.json();

        setCallSummary({
          durationSeconds: callDuration,
          totalMessages: currentMessages.length,
          summaryText: summaryData.summary || 'Chamada concluída com sucesso.',
          endedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (err) {
        console.warn('Call summary generation error:', err);
      } finally {
        setIsGeneratingSummary(false);
      }
    }
  }, [callDuration]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      playMicToggleBeep(!next);
      if (next) {
        setSpeakingState('muted');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
      } else {
        setSpeakingState('listening');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      }
      return next;
    });
  }, []);

  // Toggle speaker mute
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      if (next) {
        stopCurrentAudio();
      }
      return next;
    });
  }, []);

  // Push to talk handlers
  const handlePushToTalkStart = useCallback(() => {
    if (isHandsFree) return;
    setIsPushToTalking(true);
    playMicToggleBeep(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  }, [isHandsFree]);

  const handlePushToTalkEnd = useCallback(() => {
    if (isHandsFree) return;
    setIsPushToTalking(false);
    playMicToggleBeep(false);
    if (currentUserText.trim()) {
      sendVoiceQuery(currentUserText);
      setCurrentUserText('');
    }
  }, [isHandsFree, currentUserText, sendVoiceQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ringtoneStopRef.current) ringtoneStopRef.current();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopCurrentAudio();
    };
  }, []);

  return {
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
  };
}
