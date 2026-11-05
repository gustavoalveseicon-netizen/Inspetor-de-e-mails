import React, { useState } from 'react';
import {
  Search,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Loader2,
  Clock,
  ArrowUpDown,
  AlignLeft,
} from 'lucide-react';
import { OutlookEmail } from '../types';

interface EmailListProps {
  emails: OutlookEmail[];
  selectedEmailId: string | null;
  onSelectEmail: (email: OutlookEmail) => void;
  onBatchAuditAll: () => void;
  isBatchAuditing: boolean;
  senderFilter: string;
  onSetSenderFilter: (sender: string) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onBatchAuditAll,
  isBatchAuditing,
  senderFilter,
  onSetSenderFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmails = emails.filter((email) => {
    // If senderFilter is active, only include matching sender
    if (senderFilter && email.sender.email.toLowerCase() !== senderFilter.toLowerCase()) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(q) ||
      email.sender.name.toLowerCase().includes(q) ||
      email.sender.email.toLowerCase().includes(q) ||
      email.body.toLowerCase().includes(q)
    );
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 60) {
        return `há ${Math.max(1, diffMins)} min`;
      }
      if (diffHours < 24) {
        return `há ${diffHours} h`;
      }
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'recente';
    }
  };

  return (
    <div className="w-80 sm:w-96 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-4rem)]">
      {/* Top search and batch bar */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por assunto, remetente ou texto..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs rounded-lg border border-transparent focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>{filteredEmails.length} e-mails encontrados</span>
          <button
            onClick={onBatchAuditAll}
            disabled={isBatchAuditing}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors disabled:opacity-50"
          >
            {isBatchAuditing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Auditando...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                {senderFilter ? 'Auditar Apenas Deste Remetente' : 'Auditar Todos'}
              </>
            )}
          </button>
        </div>

        {senderFilter && (
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
            <div className="truncate text-blue-900 text-[11px]">
              Filtro: <strong>{senderFilter}</strong>
            </div>
            <button
              onClick={() => onSetSenderFilter('')}
              className="text-blue-600 hover:text-blue-900 text-xs font-bold px-1"
              title="Remover filtro de remetente"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Emails Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum e-mail corresponde aos filtros ou busca.
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = email.id === selectedEmailId;
            const audit = email.auditResult;

            // Check if has extra spaces directly in text if not yet audited
            const hasRawExtraSpaces = !audit && (/[ ]{2,}/.test(email.body) || /\n{3,}/.test(email.body));

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`p-3.5 cursor-pointer transition-all border-l-4 text-left relative ${
                  isSelected
                    ? 'bg-blue-50/70 border-l-blue-600 shadow-2xs'
                    : !email.isRead
                    ? 'bg-sky-50/20 hover:bg-slate-50 border-l-sky-500'
                    : 'hover:bg-slate-50 border-l-transparent'
                }`}
              >
                {/* Header row: Sender + Date */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {!email.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs truncate ${
                        !email.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                      }`}
                    >
                      {email.sender.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] text-slate-400">
                    {email.hasAttachments && (
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{formatTimestamp(email.receivedDateTime)}</span>
                  </div>
                </div>

                {/* Subject */}
                <div
                  className={`text-xs line-clamp-1 mb-1.5 ${
                    !email.isRead ? 'font-semibold text-slate-900' : 'text-slate-800'
                  }`}
                >
                  {email.subject}
                </div>

                {/* Snippet preview */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                  {email.bodyPreview || email.body.substring(0, 100)}
                </p>

                {/* Audit Badges and Diagnostics */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {email.isAuditing ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Analisando...
                    </span>
                  ) : audit ? (
                    <>
                      {/* Overall score badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          audit.overallScore >= 85
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/40'
                            : audit.overallScore >= 60
                            ? 'bg-amber-100 text-amber-800 border border-amber-300/40'
                            : 'bg-rose-100 text-rose-800 border border-rose-300/40'
                        }`}
                      >
                        {audit.overallScore >= 85 ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : audit.overallScore >= 60 ? (
                          <AlertTriangle className="w-2.5 h-2.5" />
                        ) : (
                          <XCircle className="w-2.5 h-2.5" />
                        )}
                        {audit.overallScore}/100
                      </span>

                      {/* Spacing alert pill */}
                      {audit.spacing.hasExcessSpacing && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                          <AlignLeft className="w-2.5 h-2.5" />
                          {audit.spacing.totalIssuesCount} espaços
                        </span>
                      )}

                      {/* Attachment issue */}
                      {audit.information.attachmentReferenceVsReality.issueDetected && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 border border-red-200 font-semibold">
                          ⚠️ Sem anexo
                        </span>
                      )}

                      {/* Scope issue */}
                      {audit.scope.status !== 'optimal' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          Escopo vago
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                        Não auditado
                      </span>
                      {hasRawExtraSpaces && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600 border border-amber-200">
                          Espaço detectado
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
