import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Target,
  FileCheck2,
  AlertTriangle,
  AlignLeft,
  Sparkles,
  Calendar,
  DollarSign,
  Paperclip,
  Check,
  ChevronRight,
  ArrowRight,
  Copy,
  Info,
} from 'lucide-react';
import { EmailAuditResult } from '../types';

interface AuditDetailPanelProps {
  audit: EmailAuditResult;
  onApplyCleanedSpacing: () => void;
  onCopyCorrected: () => void;
  copied: boolean;
}

export const AuditDetailPanel: React.FC<AuditDetailPanelProps> = ({
  audit,
  onApplyCleanedSpacing,
  onCopyCorrected,
  copied,
}) => {
  const { scope, information, errors, spacing, overallScore, overallVerdict, summary } = audit;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Summary Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(
                overallScore
              )}`}
            >
              {overallVerdict}
            </span>
            <span className="text-xs text-slate-400">
              Auditado em {new Date(audit.auditedAt).toLocaleTimeString('pt-BR')}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Diagnóstico Geral do E-mail
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{summary}</p>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-slate-900">{overallScore}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Score de Qualidade
            </div>
          </div>
          <button
            onClick={onCopyCorrected}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Versão Corrigida'}
          </button>
        </div>
      </div>

      {/* Grid of the 4 Key Inspection Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PILLAR 1: ESCOPO DO E-MAIL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  1. Validação de Escopo
                </h4>
                <p className="text-[11px] text-slate-500">
                  O objetivo está claro e cumpre o prometido?
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                scope.status === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : scope.status === 'warning'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {scope.status === 'optimal' ? 'Alinhado' : scope.status === 'warning' ? 'Atenção' : 'Desalinhado'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <span className="font-semibold text-slate-800">Veredito do Escopo:</span>
              <p className="text-slate-600 leading-relaxed">{scope.verdict}</p>
            </div>

            {/* CTA and Deadlines */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                  Chamada para Ação (CTA):
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    scope.callToAction.detected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {scope.callToAction.detected ? 'CTA Presente' : 'CTA Ausente'}
                </span>
              </div>
              <p className="text-indigo-900/80">{scope.callToAction.description}</p>
              {scope.callToAction.deadlinesIdentified?.length > 0 && (
                <div className="text-[11px] text-indigo-800 pt-1 border-t border-indigo-100">
                  <strong>Prazos identificados:</strong>{' '}
                  {scope.callToAction.deadlinesIdentified.join(', ')}
                </div>
              )}
            </div>

            {/* Scope Risks if any */}
            {scope.scopeRisks?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-rose-800 text-[11px] uppercase tracking-wide">
                  Riscos de Escopo:
                </span>
                <ul className="space-y-1">
                  {scope.scopeRisks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 text-rose-700 text-[11px] bg-rose-50/60 p-2 rounded-lg border border-rose-100"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* PILLAR 2: PRECISÃO DAS INFORMAÇÕES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  2. Precisão das Informações
                </h4>
                <p className="text-[11px] text-slate-500">
                  Datas, valores, links e anexos conferem?
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                information.status === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : information.status === 'warning'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {information.score}% Precisão
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Attachment Check: Mentions vs Reality */}
            <div
              className={`p-3 rounded-xl border space-y-1 ${
                information.attachmentReferenceVsReality.issueDetected
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Checagem de Anexos Citados:</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    information.attachmentReferenceVsReality.issueDetected
                      ? 'bg-rose-200 text-rose-800'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}
                >
                  {information.attachmentReferenceVsReality.issueDetected
                    ? '⚠️ Falha Crítica'
                    : 'Regular'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {information.attachmentReferenceVsReality.details}
              </p>
            </div>

            {/* Dates & Times */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Datas e Calendário:</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {information.datesAnalysis.details}
              </p>
              {information.datesAnalysis.mentioned?.length > 0 && (
                <div className="text-[10px] text-slate-500 pt-1">
                  Citadas:{' '}
                  <span className="font-mono text-slate-700">
                    {information.datesAnalysis.mentioned.join(' | ')}
                  </span>
                </div>
              )}
            </div>

            {/* Checked items list */}
            {information.itemsChecked?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 text-[11px]">
                  Itens Auditados:
                </span>
                <div className="space-y-1">
                  {information.itemsChecked.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                    >
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          item.status === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status === 'valid'
                          ? 'Validado'
                          : item.status === 'warning'
                          ? 'Atenção'
                          : 'Incorreto'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PILLAR 3: ERROS DE TEXTO, TOM E ORTOGRAFIA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  3. Erros Textuais e Gramaticais
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ortografia, concordância, placeholders e tom
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                errors.length === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {errors.length} {errors.length === 1 ? 'Erro' : 'Erros'}
            </span>
          </div>

          <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
            {errors.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-emerald-800 text-center space-y-1">
                <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600" />
                <p className="font-semibold">Nenhum erro de ortografia ou gramática!</p>
                <p className="text-[11px] text-emerald-700">O texto está bem redigido e polido.</p>
              </div>
            ) : (
              errors.map((err, idx) => (
                <div
                  key={err.id || idx}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                      {err.snippet}
                    </span>
                    {err.line && (
                      <span className="text-[10px] text-slate-400">Linha {err.line}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600">{err.explanation}</p>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-white p-1.5 rounded-lg border border-slate-200">
                    <ArrowRight className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>
                      Sugestão: <strong>{err.suggestion}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PILLAR 4: ESPAÇOS SOBRANDO E FORMATAÇÃO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlignLeft className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  4. Espaços Sobrando & Quebras
                </h4>
                <p className="text-[11px] text-slate-500">
                  Espaços duplos, trailing spaces e linhas vazias
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                !spacing.hasExcessSpacing
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {spacing.totalIssuesCount} detectados
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-bold text-slate-800">
                  {spacing.doubleSpacesCount}
                </div>
                <div className="text-[10px] text-slate-500">Espaços Duplos</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-bold text-slate-800">
                  {spacing.excessBlankLinesCount}
                </div>
                <div className="text-[10px] text-slate-500">Linhas Vazias</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-lg font-bold text-slate-800">
                  {spacing.trailingSpacesCount}
                </div>
                <div className="text-[10px] text-slate-500">Fim de Linha</div>
              </div>
            </div>

            {/* List of details */}
            <div className="space-y-1">
              {spacing.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="text-[11px] text-slate-600 flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-50/30 border border-amber-100/50"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {/* One-click action */}
            {spacing.hasExcessSpacing && (
              <button
                onClick={onApplyCleanedSpacing}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Limpar Todos os Espaços Sobrando Agora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
