import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Check, Copy, AlignLeft } from 'lucide-react';
import { tokenizeForVisualInspection, cleanExcessWhitespace } from '../services/whitespaceAnalyzer';

interface WhitespaceXRayProps {
  text: string;
  onTextCleaned: (cleaned: string) => void;
}

export const WhitespaceXRay: React.FC<WhitespaceXRayProps> = ({ text, onTextCleaned }) => {
  const [showXRay, setShowXRay] = useState(true);
  const [copied, setCopied] = useState(false);

  const tokenLines = tokenizeForVisualInspection(text);

  const handleClean = () => {
    const cleaned = cleanExcessWhitespace(text);
    onTextCleaned(cleaned);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top control bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowXRay(!showXRay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
              showXRay
                ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {showXRay ? <Eye className="w-3.5 h-3.5 text-amber-700" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showXRay ? 'Raio-X de Espaços Ativado' : 'Ativar Raio-X de Espaços'}
          </button>

          <span className="text-slate-400 hidden sm:inline">|</span>

          {showXRay && (
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-red-100 text-red-700 font-mono font-bold">··</span>
                Espaço duplo
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-mono font-bold">·⇥</span>
                Fim de linha
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-bold">¶</span>
                Linha vazia
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClean}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Limpar Espaços Sobrando
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
        {showXRay ? (
          <div className="space-y-1">
            {tokenLines.map((lineTokens, lineIdx) => (
              <div key={lineIdx} className="flex items-start gap-3 py-0.5 group">
                <span className="text-slate-300 select-none text-[10px] w-6 text-right font-sans pt-0.5 flex-shrink-0 group-hover:text-slate-400">
                  {lineIdx + 1}
                </span>
                <div className="flex-1">
                  {lineTokens.map((token, tokenIdx) => {
                    if (token.type === 'excess-space') {
                      return (
                        <span
                          key={tokenIdx}
                          title={`Espaço duplo detectado (${token.original.length} espaços)`}
                          className="bg-red-100 text-red-700 border-b-2 border-red-500 font-bold px-0.5 rounded-xs"
                        >
                          {token.content}
                        </span>
                      );
                    }
                    if (token.type === 'trailing-space') {
                      return (
                        <span
                          key={tokenIdx}
                          title="Espaço em branco desnecessário no fim da linha"
                          className="bg-blue-100 text-blue-700 border-b-2 border-blue-400 text-[11px] px-1 rounded-xs ml-1"
                        >
                          {token.content}
                        </span>
                      );
                    }
                    if (token.type === 'blank-line') {
                      return (
                        <span
                          key={tokenIdx}
                          className="inline-block w-full bg-amber-50 text-amber-700 border-l-4 border-amber-400 px-2 py-0.5 rounded text-[11px] font-sans italic"
                        >
                          {token.content}
                        </span>
                      );
                    }
                    return <span key={tokenIdx}>{token.content}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-800 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};
