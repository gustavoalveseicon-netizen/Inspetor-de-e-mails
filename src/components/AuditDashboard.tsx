import React from 'react';
import {
  Sparkles,
  AlignLeft,
  Target,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  CheckCircle2,
  XCircle,
  Paperclip,
  Clock,
  Filter,
} from 'lucide-react';
import { OutlookEmail } from '../types';

interface AuditDashboardProps {
  emails: OutlookEmail[];
  onSelectEmail: (email: OutlookEmail) => void;
  onBatchAuditAll: () => void;
  isBatchAuditing: boolean;
  senderFilter: string;
  onSetSenderFilter: (senderEmail: string) => void;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  emails,
  onSelectEmail,
  onBatchAuditAll,
  isBatchAuditing,
  senderFilter,
  onSetSenderFilter,
}) => {
  // Aggregate statistics
  const totalEmails = emails.length;
  const auditedEmails = emails.filter((e) => !!e.auditResult);
  const pendingAuditCount = totalEmails - auditedEmails.length;

  // Average score
  const avgScore =
    auditedEmails.length > 0
      ? Math.round(
          auditedEmails.reduce((acc, curr) => acc + (curr.auditResult?.overallScore || 0), 0) /
            auditedEmails.length
        )
      : 76;

  // Spacing issues stats
  let totalDoubleSpaces = 0;
  let totalExcessBlankLines = 0;
  let totalTrailingSpaces = 0;
  let totalPunctuationSpacing = 0;
  let emailsWithSpacingIssues = 0;

  emails.forEach((e) => {
    if (e.auditResult) {
      const s = e.auditResult.spacing;
      if (s.hasExcessSpacing) emailsWithSpacingIssues++;
      totalDoubleSpaces += s.doubleSpacesCount;
      totalExcessBlankLines += s.excessBlankLinesCount;
      totalTrailingSpaces += s.trailingSpacesCount;
      totalPunctuationSpacing += s.punctuationSpacingErrorsCount;
    } else {
      // Fast heuristic count for unaudited
      const dbl = (e.body.match(/(?<=\S)[ ]{2,}(?=\S)/g) || []).length;
      const blk = (e.body.match(/\n{3,}/g) || []).length;
      if (dbl > 0 || blk > 0) {
        emailsWithSpacingIssues++;
        totalDoubleSpaces += dbl;
        totalExcessBlankLines += blk;
      }
    }
  });

  const totalSpacingResidues =
    totalDoubleSpaces + totalExcessBlankLines + totalTrailingSpaces + totalPunctuationSpacing;

  // Pillar scores
  const avgScopeScore =
    auditedEmails.length > 0
      ? Math.round(
          auditedEmails.reduce(
            (acc, curr) => acc + (curr.auditResult?.scope?.objectiveClarity || 70),
            0
          ) / auditedEmails.length
        )
      : 80;

  const avgInfoScore =
    auditedEmails.length > 0
      ? Math.round(
          auditedEmails.reduce((acc, curr) => acc + (curr.auditResult?.information?.score || 70), 0) /
            auditedEmails.length
        )
      : 75;

  const avgSpacingScore =
    auditedEmails.length > 0
      ? Math.round(
          auditedEmails.reduce((acc, curr) => acc + (curr.auditResult?.spacing?.score || 65), 0) /
            auditedEmails.length
        )
      : 65;

  const avgTextQualityScore =
    auditedEmails.length > 0
      ? Math.round(
          auditedEmails.reduce(
            (acc, curr) => acc + Math.max(30, 100 - (curr.auditResult?.errors.length || 0) * 12),
            0
          ) / auditedEmails.length
        )
      : 85;

  // Group by Senders for Sender Quality Ranking
  const sendersMap: {
    [email: string]: {
      name: string;
      email: string;
      count: number;
      scores: number[];
      spacingIssues: number;
      scopeIssues: number;
    };
  } = {};

  emails.forEach((e) => {
    const sEmail = e.sender.email.toLowerCase();
    if (!sendersMap[sEmail]) {
      sendersMap[sEmail] = {
        name: e.sender.name,
        email: e.sender.email,
        count: 0,
        scores: [],
        spacingIssues: 0,
        scopeIssues: 0,
      };
    }
    sendersMap[sEmail].count++;
    if (e.auditResult) {
      sendersMap[sEmail].scores.push(e.auditResult.overallScore);
      if (e.auditResult.spacing.hasExcessSpacing) {
        sendersMap[sEmail].spacingIssues += e.auditResult.spacing.totalIssuesCount;
      }
      if (e.auditResult.scope.status !== 'optimal') {
        sendersMap[sEmail].scopeIssues++;
      }
    } else {
      const dbl = (e.body.match(/(?<=\S)[ ]{2,}(?=\S)/g) || []).length;
      sendersMap[sEmail].spacingIssues += dbl;
    }
  });

  const sendersList = Object.values(sendersMap);

  // Critical emails needing attention
  const criticalEmails = emails.filter((e) => {
    if (e.auditResult) {
      return (
        e.auditResult.overallScore < 80 ||
        e.auditResult.spacing.hasExcessSpacing ||
        e.auditResult.information.attachmentReferenceVsReality.issueDetected
      );
    }
    return /[ ]{2,}|\n{3,}/.test(e.body);
  });

  // SVG circular gauge calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgScore / 100) * circumference;

  return (
    <div className="flex-1 bg-slate-50/60 overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs border border-blue-400/30 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Painel Geral de Auditoria da Caixa Postal
            </span>
            {senderFilter && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-400/30 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtro Ativo: {senderFilter}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Diagnóstico de Qualidade, Escopo e Espaços
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Nenhum e-mail individual selecionado no momento. Acompanhe abaixo os indicadores consolidados
            ou clique em qualquer e-mail na lista lateral para inspecioná-lo a fundo.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {senderFilter && (
            <button
              onClick={() => onSetSenderFilter('')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-colors"
            >
              Limpar Filtro de Remetente
            </button>
          )}

          <button
            onClick={onBatchAuditAll}
            disabled={isBatchAuditing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isBatchAuditing
                ? 'Processando Auditorias...'
                : pendingAuditCount > 0
                ? `Auditar ${pendingAuditCount} E-mails Pendentes`
                : 'Reauditar Todos os E-mails'}
            </span>
          </button>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-blue-600/30 to-transparent pointer-events-none" />
      </div>

      {/* Top 4 Key Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Score Geral Gauge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Score Médio da Caixa
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{avgScore}/100</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{avgScore >= 80 ? 'Qualidade Alta' : 'Atenção Necessária'}</span>
            </div>
          </div>
          {/* Circular SVG Gauge */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800">{avgScore}%</span>
          </div>
        </div>

        {/* Card 2: Espaços Sobrando */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Espaços Sobrando
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlignLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {totalSpacingResidues} <span className="text-xs font-normal text-slate-500">resíduos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Detectados em <strong>{emailsWithSpacingIssues}</strong> de {totalEmails} e-mails
          </p>
        </div>

        {/* Card 3: Escopo e Clareza */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Alinhamento de Escopo
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">{avgScopeScore}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Concordância entre assunto, corpo e chamadas para ação (CTA)
          </p>
        </div>

        {/* Card 4: Precisão das Informações */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Precisão de Dados & Anexos
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{avgInfoScore}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Conferência de datas, valores monetários e verificação de anexos
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Distribuição dos 4 Pilares de Auditoria */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Desempenho dos 4 Pilares de Auditoria
                </h3>
                <p className="text-[11px] text-slate-500">Média de conformidade dos e-mails da caixa</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Métricas 0-100%</span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Pillar 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  1. Escopo e Objetividade
                </span>
                <span className="font-bold text-indigo-700">{avgScopeScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${avgScopeScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                  2. Precisão de Informações e Anexos
                </span>
                <span className="font-bold text-emerald-700">{avgInfoScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${avgInfoScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  3. Correção Textual, Gramática e Tom
                </span>
                <span className="font-bold text-rose-700">{avgTextQualityScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${avgTextQualityScore}%` }}
                />
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-amber-500" />
                  4. Formatação Limpa (Sem Espaços Sobrando)
                </span>
                <span className="font-bold text-amber-700">{avgSpacingScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${avgSpacingScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: Decomposição das Falhas de Espaço Sobrando */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Tipos de Espaços Sobrando Detectados
                </h3>
                <p className="text-[11px] text-slate-500">
                  {totalSpacingResidues} resíduos invisíveis encontrados
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              Raio-X de Espaços
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/60 text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Espaços Duplos
              </div>
              <div className="text-xl font-extrabold text-red-900">{totalDoubleSpaces}</div>
              <p className="text-[10px] text-red-700/80">Entre palavras consecutivas (ex: "olá  amigo")</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Linhas Vazias Excedentes
              </div>
              <div className="text-xl font-extrabold text-amber-900">{totalExcessBlankLines}</div>
              <p className="text-[10px] text-amber-700/80">3 ou mais quebras de linha acumuladas</p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-blue-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Fim de Linha (Trailing)
              </div>
              <div className="text-xl font-extrabold text-blue-900">{totalTrailingSpaces}</div>
              <p className="text-[10px] text-blue-700/80">Espaços invisíveis antes da quebra</p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-purple-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Pontuação Incorreta
              </div>
              <div className="text-xl font-extrabold text-purple-900">{totalPunctuationSpacing}</div>
              <p className="text-[10px] text-purple-700/80">Falta de espaço após vírgula ou espaço antes</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHART 3: Ranking e Auditoria Específica por Remetente */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Auditar E-mails por Remetente Específico
              </h3>
              <p className="text-[11px] text-slate-500">
                Filtre e audite exclusivamente as mensagens recebidas de determinado remetente
              </p>
            </div>
          </div>

          {senderFilter && (
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
              <span>Auditoria focada em: <strong>{senderFilter}</strong></span>
              <button
                onClick={() => onSetSenderFilter('')}
                className="text-blue-500 hover:text-blue-900 font-bold ml-1"
                title="Remover filtro"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Senders Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pl-2">Remetente</th>
                <th className="pb-3 text-center">E-mails</th>
                <th className="pb-3 text-center">Espaços Sobrando</th>
                <th className="pb-3 text-center">Score Médio</th>
                <th className="pb-3 text-right pr-2">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sendersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum e-mail registrado ainda. Clique em Sincronizar ou Analisar Outro E-mail.
                  </td>
                </tr>
              ) : (
                sendersList.map((s) => {
                  const avgSenderScore =
                    s.scores.length > 0
                      ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
                      : 70;
                  const isCurrentFilter = senderFilter.toLowerCase() === s.email.toLowerCase();

                  return (
                    <tr
                      key={s.email}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrentFilter ? 'bg-blue-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 pl-2">
                        <div className="font-semibold text-slate-800">{s.name}</div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>

                      <td className="py-3 text-center text-slate-600 font-medium">
                        {s.count}
                      </td>

                      <td className="py-3 text-center">
                        {s.spacingIssues > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            {s.spacingIssues} espaços
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">0</span>
                        )}
                      </td>

                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            avgSenderScore >= 85
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : avgSenderScore >= 60
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {avgSenderScore}/100
                        </span>
                      </td>

                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={() => onSetSenderFilter(isCurrentFilter ? '' : s.email)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isCurrentFilter
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                          }`}
                        >
                          {isCurrentFilter ? 'Filtrando ✓' : 'Auditar Apenas Este'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Emails Section - Direct Entry */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              E-mails que Requerem Correção Imediata
            </h3>
            <p className="text-[11px] text-slate-500">
              Clique em qualquer e-mail para entrar nele e aplicar a auditoria e correções
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{criticalEmails.length} mensagens</span>
        </div>

        {criticalEmails.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            Nenhum e-mail com problemas detectado no momento. Sua caixa está em conformidade!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalEmails.slice(0, 4).map((email) => {
              const audit = email.auditResult;
              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-800 text-xs truncate">
                      {email.sender.name}
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(email.receivedDateTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {email.subject}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {email.bodyPreview || email.body.substring(0, 100)}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {audit?.spacing?.hasExcessSpacing && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {audit.spacing.totalIssuesCount} espaços
                        </span>
                      )}
                      {audit?.information?.attachmentReferenceVsReality?.issueDetected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                          Sem anexo
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Entrar e Inspecionar
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
