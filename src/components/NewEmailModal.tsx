import React, { useState } from 'react';
import { X, Sparkles, Plus, Paperclip } from 'lucide-react';
import { OutlookEmail } from '../types';

interface NewEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmail: (email: OutlookEmail) => void;
}

export const NewEmailModal: React.FC<NewEmailModalProps> = ({ isOpen, onClose, onAddEmail }) => {
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState('Cliente Exemplo');
  const [senderEmail, setSenderEmail] = useState('cliente@empresa.com');
  const [body, setBody] = useState('');
  const [hasAttachments, setHasAttachments] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    const newEmail: OutlookEmail = {
      id: `custom_${Date.now()}`,
      subject: subject.trim(),
      sender: {
        name: senderName.trim() || 'Remetente',
        email: senderEmail.trim() || 'contato@dominio.com',
      },
      toRecipients: [{ name: 'Gustavo Alves', email: 'gustavo.alves@eicon.com.br' }],
      receivedDateTime: new Date().toISOString(),
      bodyPreview: body.substring(0, 120),
      body: body,
      folder: 'inbox',
      isRead: false,
      isFlagged: false,
      hasAttachments: hasAttachments,
      attachments: hasAttachments
        ? [{ id: 'custom_att_1', name: 'Documento_Anexo.pdf', size: 104000, contentType: 'application/pdf' }]
        : [],
    };

    onAddEmail(newEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="p-5 bg-gradient-to-r from-blue-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold text-sm">Adicionar ou Colar E-mail para Auditoria</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assunto do E-mail</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Proposta Comercial e Cronograma de Entrega"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome do Remetente</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail do Remetente</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="Ex: carlos@empresa.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Corpo do E-mail</label>
              <span className="text-[10px] text-slate-400">
                Pode colar textos com espaços sobrando ou erros para testar
              </span>
            </div>
            <textarea
              required
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Cole aqui o conteúdo do e-mail..."
              className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAttachments}
                onChange={(e) => setHasAttachments(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                Simular anexo presente no Outlook
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Adicionar e Inspecionar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
