import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  ExternalLink,
  Key,
  Copy,
  Check,
  Building,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginDemo: () => void;
  onLoginGraphOAuth: (clientId?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginDemo,
  onLoginGraphOAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'graph'>('demo');
  const [customClientId, setCustomClientId] = useState('');
  const [copiedCallback, setCopiedCallback] = useState(false);

  if (!isOpen) return null;

  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-sky-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold">Conectar E-mail Outlook 365</h2>
          <p className="text-xs text-blue-100/90 mt-1">
            Selecione como deseja acessar e auditar seus e-mails.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'demo'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Demonstração Corporativa (Instantâneo)
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex-1 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'graph'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Microsoft Graph Real (OAuth 2.0)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'demo' ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Ambiente Pronto com Casos Reais</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Carrega instantaneamente uma caixa postal com e-mails corporativos realistas em
                  português, configurados especificamente com casos de teste:
                </p>
                <ul className="space-y-1 text-slate-600 list-disc list-inside pt-1">
                  <li>E-mail com excesso de espaços duplos e linhas vazias</li>
                  <li>E-mail com texto citando anexo mas sem nenhum anexo real</li>
                  <li>E-mail com desvio de escopo e falta de prazos</li>
                  <li>E-mail com placeholders pendentes como [Nome]</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  onLoginDemo();
                  onClose();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Building className="w-4 h-4" />
                Entrar com Conta Outlook de Demonstração
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Configuração do Azure App Registration</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Para ler e-mails da sua conta corporativa Microsoft 365, cadastre o Redirect URI no
                  portal do Azure:
                </p>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <code className="text-[10px] text-slate-700 font-mono truncate flex-1">
                    {callbackUrl}
                  </code>
                  <button
                    onClick={handleCopyCallback}
                    className="p-1 text-slate-500 hover:text-blue-600 flex-shrink-0"
                    title="Copiar URL de Retorno"
                  >
                    {copiedCallback ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-[11px]">
                  Microsoft Azure Client ID (Opcional):
                </label>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="Ex: 00000000-0000-0000-0000-000000000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  onLoginGraphOAuth(customClientId);
                  onClose();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-sky-400" />
                Abrir Popup de Login Microsoft
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
