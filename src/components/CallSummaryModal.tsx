import React from 'react';
import { CallSummaryData } from '../types';
import { formatCallDuration } from '../utils/audio';
import { CheckCircle2, PhoneCall, Clock, MessageSquare, ArrowRight, RotateCcw } from 'lucide-react';

interface CallSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: CallSummaryData | null;
  isLoading: boolean;
  onStartNewCall: () => void;
  onViewTranscript: () => void;
}

export const CallSummaryModal: React.FC<CallSummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading,
  onStartNewCall,
  onViewTranscript,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="call-summary-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="call-summary-card"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative background blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Chamada Concluída</h2>
            <p className="text-xs text-slate-400">Resumo da sua sessão de voz com a IA</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Duração</p>
              <p className="text-base font-semibold text-white">
                {summary ? formatCallDuration(summary.durationSeconds) : '00:00'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Interações</p>
              <p className="text-base font-semibold text-white">
                {summary ? summary.totalMessages : 0} falas
              </p>
            </div>
          </div>
        </div>

        {/* Summary Content */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
            Resumo dos Tópicos Conversados
          </h4>
          {isLoading ? (
            <div className="flex items-center gap-3 py-3 text-slate-400 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              <span>Gerando síntese inteligente da conversa...</span>
            </div>
          ) : summary?.summaryText ? (
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {summary.summaryText}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              A chamada foi encerrada. Nenhuma fala suficiente para gerar resumo.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="start-new-call-btn"
            onClick={onStartNewCall}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Iniciar Nova Chamada</span>
          </button>
          <button
            id="view-transcript-btn"
            onClick={onViewTranscript}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ver Transcrição</span>
          </button>
        </div>
      </div>
    </div>
  );
};
