import React from 'react';
import { Mail, ShieldCheck, Sparkles, LogOut, PlusCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { OutlookUser } from '../types';

interface HeaderProps {
  user: OutlookUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenNewEmail: () => void;
  onRefreshEmails: () => void;
  isRefreshing: boolean;
  totalEmails: number;
  auditedCount: number;
  issuesCount: number;
  onShowDashboard: () => void;
  isShowingDashboard: boolean;
  onClearAllData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenLogin,
  onLogout,
  onOpenNewEmail,
  onRefreshEmails,
  isRefreshing,
  totalEmails,
  auditedCount,
  issuesCount,
  onShowDashboard,
  isShowingDashboard,
  onClearAllData,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Outlook Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onShowDashboard}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100 hover:opacity-90 transition-opacity"
            title="Ir para o Dashboard de Gráficos"
          >
            <Mail className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">Outlook</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Auditor & Inspector
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Validador de escopo, dados e espaços sobrando
            </p>
          </div>
        </div>

        {/* Center: Live Stats Indicators & Dashboard button */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onShowDashboard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              isShowingDashboard
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gráficos da Auditoria</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/80 text-xs font-medium text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Total: <strong>{totalEmails}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-xs font-medium text-emerald-700 border border-emerald-200/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auditados: <strong>{auditedCount}</strong></span>
          </div>

          {issuesCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-xs font-medium text-amber-700 border border-amber-200/50">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Alertas: <strong>{issuesCount}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Actions and User Account */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshEmails}
            disabled={isRefreshing}
            title="Sincronizar e-mails reais do Outlook"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          <button
            onClick={onClearAllData}
            title="Limpar e zerar todos os dados da sessão"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 font-medium"
          >
            <span>Zerar Dados</span>
          </button>

          <button
            onClick={onOpenNewEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Analisar Outro E-mail</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center gap-1">
                    {user.displayName}
                    {user.isDemo && (
                      <span className="text-[10px] font-normal bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                        Demo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight truncate max-w-[150px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sair ou trocar de conta"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Entrar com Outlook
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
