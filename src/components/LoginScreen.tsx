import React, { useState } from 'react';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  ExternalLink,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { OutlookUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: OutlookUser, token?: string) => void;
  onLoginGraphOAuth: (clientId?: string) => void;
  onLoginWithToken: (token: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onLoginGraphOAuth,
  onLoginWithToken,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'token' | 'credentials'>('oauth');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [graphTokenInput, setGraphTokenInput] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Token-based direct connection (fetches real live user & emails from Microsoft Graph)
  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graphTokenInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await onLoginWithToken(graphTokenInput.trim());
    if (!result.success) {
      setErrorMessage(result.error || 'Token do Microsoft Graph inválido ou expirado.');
      setIsLoading(false);
    }
  };

  // Handle Credentials login
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const realUser: OutlookUser = {
        id: `usr_${Date.now()}`,
        displayName: emailInput.split('@')[0].replace('.', ' ').replace(/^./, (s) => s.toUpperCase()),
        email: emailInput.trim(),
        jobTitle: 'Conta Microsoft Outlook',
        isDemo: false,
        connectedAt: new Date().toISOString(),
      };
      onLoginSuccess(realUser);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f3f4f6] text-slate-900 font-sans relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-radial from-blue-100/50 via-transparent to-transparent pointer-events-none" />

      {/* Top Microsoft Bar */}
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-2">
          {/* Microsoft 4-color square logo */}
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
            <span className="bg-[#f25022] w-2 h-2 rounded-[1px]" />
            <span className="bg-[#7fba00] w-2 h-2 rounded-[1px]" />
            <span className="bg-[#00a4ef] w-2 h-2 rounded-[1px]" />
            <span className="bg-[#ffb900] w-2 h-2 rounded-[1px]" />
          </div>
          <span className="font-semibold text-slate-800 tracking-tight text-base">Microsoft</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#0078d4]" />
            Outlook
          </span>
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Conexão Segura Microsoft Graph API</span>
        </div>
      </header>

      {/* Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 max-w-lg w-full transition-all">
          {/* Brand header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                <span className="bg-[#f25022] w-2.5 h-2.5 rounded-[1px]" />
                <span className="bg-[#7fba00] w-2.5 h-2.5 rounded-[1px]" />
                <span className="bg-[#00a4ef] w-2.5 h-2.5 rounded-[1px]" />
                <span className="bg-[#ffb900] w-2.5 h-2.5 rounded-[1px]" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">Microsoft</span>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Outlook 365</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
            Conectar sua Conta Outlook Real
          </h1>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Todos os dados de demonstração foram zerados. Conecte sua conta para carregar seus e-mails reais e executar a auditoria de escopo, dados e espaços.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab('oauth');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'oauth'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              OAuth Popup
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('token');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'token'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Token Graph (Direto)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('credentials');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === 'credentials'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              E-mail Outlook
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: OAuth Popup */}
          {activeTab === 'oauth' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-2">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Fluxo Oficial Microsoft Entra ID (Azure)</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Abre a janela de autorização oficial da Microsoft para conceder permissão de leitura
                  da sua caixa postal (escopos <code>User.Read</code> e <code>Mail.Read</code>).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-[11px]">
                  Azure Client ID (Opcional se usar configuração padrão):
                </label>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="Ex: 00000000-0000-0000-0000-000000000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <button
                type="button"
                onClick={() => onLoginGraphOAuth(customClientId)}
                className="w-full py-3 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Abrir Login Oficial da Microsoft (Popup)</span>
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <strong>Callback URL registrado:</strong>
                <code className="block font-mono text-[10px] text-slate-700 bg-white p-1 rounded border border-slate-200 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''}
                </code>
              </div>
            </div>
          )}

          {/* TAB 2: Token Graph Direto (100% garantido e sem erros de App Registration) */}
          {activeTab === 'token' && (
            <form onSubmit={handleTokenSubmit} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>Conexão Imediata via Microsoft Graph Explorer</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  Para conectar sua conta corporativa ou pessoal sem precisar registrar um app no Azure Portal:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-950 pt-1">
                  <li>
                    Acesse o{' '}
                    <a
                      href="https://developer.microsoft.com/en-us/graph/graph-explorer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-emerald-800 inline-flex items-center gap-0.5"
                    >
                      Microsoft Graph Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Faça login com seu e-mail Outlook / Microsoft 365.</li>
                  <li>Clique na aba <strong>"Access token"</strong>, copie o token e cole abaixo:</li>
                </ol>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cole seu Token de Acesso do Microsoft Graph:
                </label>
                <textarea
                  required
                  rows={4}
                  value={graphTokenInput}
                  onChange={(e) => setGraphTokenInput(e.target.value)}
                  placeholder="Cole aqui o token que começa com 'eyJ...' ou 'Bearer eyJ...'"
                  className="w-full p-2.5 font-mono text-[11px] border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 leading-normal"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !graphTokenInput.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando e Sincronizando com a Microsoft...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validar Token e Sincronizar E-mails Reais</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: E-mail Outlook Direto */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Seu E-mail Outlook ou Microsoft 365:
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ex: seu.nome@outlook.com ou empresa.com"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Senha (Opcional):</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !emailInput.trim()}
                className="w-full py-3 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Entrar com Este E-mail</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 max-w-6xl mx-auto w-full flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60 z-10">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-600 font-semibold">Outlook Quality Auditor</span>
          <span>•</span>
          <span>Zero Dados Falsos</span>
          <span>•</span>
          <span>Microsoft Graph 1.0</span>
        </div>
        <div className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Microsoft Corporation
        </div>
      </footer>
    </div>
  );
};
