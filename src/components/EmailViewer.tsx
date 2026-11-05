import React, { useState } from 'react';
import {
  Sparkles,
  AlignLeft,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Paperclip,
  Clock,
  User,
  ArrowRight,
  Eye,
  Check,
  Copy,
  Loader2,
  Send,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { OutlookEmail, ViewTab } from '../types';
import { AuditDetailPanel } from './AuditDetailPanel';
import { WhitespaceXRay } from './WhitespaceXRay';
import { DiffViewer } from './DiffViewer';

interface EmailViewerProps {
  email: OutlookEmail | null;
  onAuditEmail: (email: OutlookEmail) => void;
  isAuditing: boolean;
  onUpdateEmailBody: (emailId: string, newBody: string, newSubject?: string) => void;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  onAuditEmail,
  isAuditing,
  onUpdateEmailBody,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('viewer');
  const [copied, setCopied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyCopied, setReplyCopied] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs border border-blue-100">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Nenhum e-mail selecionado
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Escolha um e-mail na lista lateral para inspecionar escopo, dados, erros e espaços sobrando.
        </p>
      </div>
    );
  }

  const audit = email.auditResult;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Assunto: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCleanSpacing = () => {
    if (audit?.spacing?.cleanedBody) {
      onUpdateEmailBody(email.id, audit.spacing.cleanedBody);
    }
  };

  const handleApplyRevision = () => {
    if (audit?.suggestedRevision) {
      onUpdateEmailBody(
        email.id,
        audit.suggestedRevision.body,
        audit.suggestedRevision.subject
      );
    }
  };

  // Generate a draft reply based on scope
  const generateReplyDraft = () => {
    const senderName = email.sender.name.split(' ')[0] || 'Colega';
    const hasAttachmentIssue = audit?.information?.attachmentReferenceVsReality?.issueDetected;

    let draft = `Olá ${senderName},\n\nObrigado pelo envio da mensagem referente a "${email.subject}".\n\n`;

    if (hasAttachmentIssue) {
      draft += `Gostaria de informar que no e-mail recebido foi mencionado o arquivo em anexo, porém o documento não veio anexado. Poderia por gentileza reenviar com o arquivo anexo para que eu possa prosseguir com a avaliação?\n\n`;
    } else {
      draft += `Revisei os pontos apresentados e as informações detalhadas no escopo. Estamos de acordo com o direcionamento e alinharemos os próximos passos conforme planejado.\n\n`;
    }

    draft += `Qualquer dúvida adicional, permaneço à disposição.\n\nAtenciosamente,\nGustavo Alves`;
    setReplyText(draft);
    setActiveTab('reply');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-50 overflow-y-auto">
      {/* Top Email Header */}
      <div className="bg-white border-b border-slate-200 p-5 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Email Metadata */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {email.folder === 'inbox'
                  ? 'Caixa de Entrada'
                  : email.folder === 'sent'
                  ? 'Enviados'
                  : 'Rascunho'}
              </span>

              {audit && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    audit.overallScore >= 85
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : audit.overallScore >= 60
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Score: {audit.overallScore}/100 - {audit.overallVerdict}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {email.subject}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>De: {email.sender.name}</span>
                <span className="text-slate-400 font-normal">({email.sender.email})</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(email.receivedDateTime).toLocaleString('pt-BR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {email.hasAttachments && (
                <div className="flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{email.attachments?.length || 1} anexo(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onAuditEmail(email)}
              disabled={isAuditing}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditando E-mail...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{audit ? 'Reauditar com IA' : 'Auditar E-mail com IA'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleApplyCleanSpacing}
              title="Remove múltiplos espaços e linhas vazias desnecessárias"
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>Limpar Espaços</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('viewer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'viewer'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Raio-X de Espaços & Leitura</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors relative ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoria Detalhada (4 Pilares)</span>
            {audit && audit.overallScore < 85 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
            )}
          </button>

          {audit?.suggestedRevision && (
            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'diff'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Comparativo Antes & Depois</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!replyText) generateReplyDraft();
              setActiveTab('reply');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'reply'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Sugerir Resposta</span>
          </button>
        </div>
      </div>

      {/* Main Tab Viewport */}
      <div className="p-6 max-w-6xl w-full mx-auto">
        {/* Not Audited Prompt Card */}
        {!audit && !isAuditing && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-transparent border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Auditoria Inteligente Pronta</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                Clique abaixo para disparar a verificação de <strong>escopo</strong>,{' '}
                <strong>conferência de dados/datas</strong>, <strong>detecção de erros</strong> e{' '}
                <strong>espaços sobrando</strong> neste e-mail.
              </p>
            </div>
            <button
              onClick={() => onAuditEmail(email)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Executar Auditoria Agora
            </button>
          </div>
        )}

        {/* Tab 1: Raio-X de Espaços e Leitura */}
        {activeTab === 'viewer' && (
          <div className="space-y-6">
            <WhitespaceXRay
              text={email.body}
              onTextCleaned={(cleaned) => onUpdateEmailBody(email.id, cleaned)}
            />

            {/* If audit exists, show quick highlights below */}
            {audit && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Escopo</div>
                  <div className="text-xs font-semibold text-slate-800">{audit.scope.verdict}</div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Checagem de Anexos
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {audit.information.attachmentReferenceVsReality.details}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Espaços</div>
                  <div className="text-xs font-semibold text-slate-800">
                    {audit.spacing.totalIssuesCount > 0
                      ? `${audit.spacing.totalIssuesCount} resíduos de espaçamento detectados.`
                      : 'Espaçamento limpo e padronizado!'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Auditoria Detalhada dos 4 Pilares */}
        {activeTab === 'audit' && (
          <div>
            {audit ? (
              <AuditDetailPanel
                audit={audit}
                onApplyCleanedSpacing={handleApplyCleanSpacing}
                onCopyCorrected={() => {
                  navigator.clipboard.writeText(
                    `Assunto: ${audit.suggestedRevision.subject}\n\n${audit.suggestedRevision.body}`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                copied={copied}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Este e-mail ainda não foi auditado
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Clique no botão para gerar o relatório completo com escopo, informações e espaços.
                </p>
                <button
                  onClick={() => onAuditEmail(email)}
                  disabled={isAuditing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Auditar Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Comparativo Diff */}
        {activeTab === 'diff' && audit?.suggestedRevision && (
          <DiffViewer
            originalSubject={email.subject}
            originalBody={email.body}
            revisedSubject={audit.suggestedRevision.subject}
            revisedBody={audit.suggestedRevision.body}
            improvementsSummary={audit.suggestedRevision.improvementsSummary}
            onApplyRevision={handleApplyRevision}
          />
        )}

        {/* Tab 4: Sugerir Resposta */}
        {activeTab === 'reply' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Rascunho de Resposta Profissional
                </h3>
                <p className="text-xs text-slate-500">
                  Resposta formulada alinhada ao escopo e pendências do e-mail recebido.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateReplyDraft()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regerar
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(replyText);
                    setReplyCopied(true);
                    setTimeout(() => setReplyCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  {replyCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {replyCopied ? 'Copiado!' : 'Copiar Resposta'}
                </button>
              </div>
            </div>

            <textarea
              rows={12}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-4 text-xs font-sans text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
};
