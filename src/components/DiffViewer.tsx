import React, { useState } from 'react';
import { ArrowLeftRight, Check, Copy, Sparkles, CheckCircle2 } from 'lucide-react';

interface DiffViewerProps {
  originalSubject: string;
  originalBody: string;
  revisedSubject: string;
  revisedBody: string;
  improvementsSummary: string[];
  onApplyRevision: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalSubject,
  originalBody,
  revisedSubject,
  revisedBody,
  improvementsSummary,
  onApplyRevision,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Assunto: ${revisedSubject}\n\n${revisedBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with improvements */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Versão Recomposta & Higienizada</span>
          </div>
          <p className="text-xs text-blue-800/80">
            Espaços sobrando removidos, pontuação padronizada e escopo otimizado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Revisão'}
          </button>

          <button
            onClick={onApplyRevision}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Substituir por Esta Versão
          </button>
        </div>
      </div>

      {/* Improvements list */}
      {improvementsSummary?.length > 0 && (
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
          <span className="font-semibold text-slate-700 text-[11px] uppercase">
            Melhorias Aplicadas:
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {improvementsSummary.map((imp, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
              >
                ✓ {imp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Original (Com Espaços & Erros)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              Texto Original
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg">
            Assunto: {originalSubject}
          </div>
          <div className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed p-2 bg-rose-50/20 rounded-lg border border-rose-100/60 min-h-[300px]">
            {originalBody}
          </div>
        </div>

        {/* Revised */}
        <div className="bg-white rounded-2xl border border-blue-200 p-4 space-y-3 shadow-2xs ring-1 ring-blue-100">
          <div className="flex items-center justify-between pb-2 border-b border-blue-100">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Revisão Polida (Limpa & Ajustada)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
              Otimizado
            </span>
          </div>
          <div className="text-xs font-semibold text-blue-950 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
            Assunto: {revisedSubject}
          </div>
          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed p-2 bg-emerald-50/20 rounded-lg border border-emerald-100/60 min-h-[300px]">
            {revisedBody}
          </div>
        </div>
      </div>
    </div>
  );
};
