import React, { useState } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Filter,
  AlertOctagon,
  AlignLeft,
  Target,
  Sparkles,
  Info,
  CheckCircle,
  BarChart3,
  UserCheck,
  X,
} from 'lucide-react';
import { FilterType, OutlookEmail } from '../types';

interface SidebarProps {
  currentFolder: string;
  onSelectFolder: (folder: 'inbox' | 'sent' | 'drafts' | 'archive') => void;
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  emails: OutlookEmail[];
  onOpenLogin: () => void;
  isDemo: boolean;
  onShowDashboard: () => void;
  isShowingDashboard: boolean;
  senderFilter: string;
  onSetSenderFilter: (sender: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  currentFilter,
  onSelectFilter,
  emails,
  onOpenLogin,
  isDemo,
  onShowDashboard,
  isShowingDashboard,
  senderFilter,
  onSetSenderFilter,
}) => {
  // Compute counts
  const inboxCount = emails.filter((e) => e.folder === 'inbox').length;
  const sentCount = emails.filter((e) => e.folder === 'sent').length;
  const draftsCount = emails.filter((e) => e.folder === 'drafts').length;

  const unreadCount = emails.filter((e) => !e.isRead).length;
  const spacingIssuesCount = emails.filter(
    (e) => e.auditResult?.spacing?.hasExcessSpacing || (!e.auditResult && /\s{2,}|\n{3,}/.test(e.body))
  ).length;
  const scopeIssuesCount = emails.filter(
    (e) => e.auditResult?.scope?.status === 'warning' || e.auditResult?.scope?.status === 'critical'
  ).length;
  const allIssuesCount = emails.filter((e) => {
    const res = e.auditResult;
    if (!res) return false;
    return (
      res.overallVerdict !== 'Excelente' ||
      res.spacing.hasExcessSpacing ||
      res.errors.length > 0 ||
      res.information.attachmentReferenceVsReality.issueDetected
    );
  }).length;

  // Extract unique senders
  const uniqueSenders = Array.from(
    new Set(emails.map((e) => e.sender.email.toLowerCase()))
  ).map((email) => {
    const found = emails.find((e) => e.sender.email.toLowerCase() === email);
    return {
      email,
      name: found?.sender.name || email,
      count: emails.filter((e) => e.sender.email.toLowerCase() === email).length,
    };
  });

  return (
    <aside className="w-64 bg-slate-50/80 border-r border-slate-200 flex flex-col justify-between p-4 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-6">
        {/* Main Dashboard Button */}
        <div>
          <button
            onClick={onShowDashboard}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isShowingDashboard
                ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-blue-500/20'
                : 'bg-white border border-slate-200/80 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Painel de Gráficos</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                isShowingDashboard ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
              }`}
            >
              Geral
            </span>
          </button>
        </div>

        {/* Sender Specific Filter / Rule: "Auditar e-mail que vem apenas de tal e-mail" */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Auditar por Remetente</span>
            </div>
            {senderFilter && (
              <button
                onClick={() => onSetSenderFilter('')}
                className="text-[10px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-0.5"
                title="Limpar filtro"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            Filtre e audite apenas e-mails recebidos de um remetente:
          </p>

          <select
            value={senderFilter}
            onChange={(e) => onSetSenderFilter(e.target.value)}
            className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 truncate"
          >
            <option value="">Todos os remetentes</option>
            {uniqueSenders.map((s) => (
              <option key={s.email} value={s.email}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>
        </div>

        {/* Folders Navigation */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Pastas Outlook
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectFolder('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentFolder === 'inbox'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Caixa de Entrada</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentFolder === 'inbox' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {inboxCount}
              </span>
            </button>

            <button
              onClick={() => onSelectFolder('sent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentFolder === 'sent'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Enviados</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentFolder === 'sent' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {sentCount}
              </span>
            </button>

            <button
              onClick={() => onSelectFolder('drafts')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentFolder === 'drafts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Rascunhos</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentFolder === 'drafts' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {draftsCount}
              </span>
            </button>

            <button
              onClick={() => onSelectFolder('archive')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                currentFolder === 'archive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4" />
                <span>Arquivo Morto</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Audit Filters */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Filtros do Auditor
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectFilter('all')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <span>Todos os e-mails</span>
              <span className="text-[10px] opacity-80">{emails.length}</span>
            </button>

            <button
              onClick={() => onSelectFilter('unread')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentFilter === 'unread'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <span>Não lidos</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectFilter('spacing_issues')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentFilter === 'spacing_issues'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlignLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>Espaços Sobrando</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {spacingIssuesCount}
              </span>
            </button>

            <button
              onClick={() => onSelectFilter('scope_issues')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentFilter === 'scope_issues'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>Desvio de Escopo</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
                {scopeIssuesCount}
              </span>
            </button>

            <button
              onClick={() => onSelectFilter('issues')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentFilter === 'issues'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                <span>Qualquer Alerta</span>
              </div>
              {allIssuesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 font-bold">
                  {allIssuesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Card: Outlook Status & Switcher */}
      <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/60 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Auditoria Automática</span>
          </div>
          <p className="text-[11px] text-blue-800/80 leading-relaxed">
            Selecione qualquer e-mail para validar escopo, dados e espaços sobrando.
          </p>
        </div>

        {isDemo ? (
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Conectar Outlook Real
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Conectado ao Microsoft 365
          </div>
        )}
      </div>
    </aside>
  );
};
