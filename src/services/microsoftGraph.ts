import { OutlookEmail, OutlookUser } from '../types';

// Zero initial data - completely clean state
export const INITIAL_EMAILS: OutlookEmail[] = [];

/**
 * Validates Microsoft Graph token and retrieves real user profile
 */
export async function fetchGraphUserProfile(accessToken: string): Promise<OutlookUser> {
  const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message ||
        `Erro de autenticação no Microsoft Graph (${res.status} ${res.statusText}). Verifique se o token é válido.`
    );
  }

  const data = await res.json();
  const email = data.mail || data.userPrincipalName || '';

  return {
    id: data.id || `usr_${Date.now()}`,
    displayName: data.displayName || email.split('@')[0] || 'Usuário Microsoft Outlook',
    email: email,
    jobTitle: data.jobTitle || 'Conta Microsoft 365 / Outlook',
    isDemo: false,
    connectedAt: new Date().toISOString(),
  };
}

/**
 * Fetches real live inbox messages from Microsoft Graph API
 */
export async function fetchGraphEmails(accessToken: string): Promise<OutlookEmail[]> {
  const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');

  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=30&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments,isRead&$expand=attachments($select=id,name,size,contentType)',
    {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message ||
        `Erro ao buscar e-mails do Outlook (${res.status} ${res.statusText}).`
    );
  }

  const data = await res.json();
  const messages = data.value || [];

  return messages.map((m: any) => {
    // Strip HTML tags to get pure body text for analysis, while preserving spacing & line breaks
    let rawBody = m.body?.content || m.bodyPreview || '';
    if (m.body?.contentType === 'html') {
      rawBody = htmlToPlainText(rawBody);
    }

    return {
      id: m.id,
      subject: m.subject || '(Sem assunto)',
      sender: {
        name: m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Remetente Desconhecido',
        email: m.from?.emailAddress?.address || '',
      },
      toRecipients: (m.toRecipients || []).map((r: any) => ({
        name: r.emailAddress?.name || r.emailAddress?.address || '',
        email: r.emailAddress?.address || '',
      })),
      receivedDateTime: m.receivedDateTime || new Date().toISOString(),
      bodyPreview: m.bodyPreview || rawBody.substring(0, 150),
      body: rawBody,
      folder: 'inbox',
      isRead: m.isRead ?? true,
      isFlagged: false,
      hasAttachments: !!m.hasAttachments,
      attachments: (m.attachments || []).map((a: any) => ({
        id: a.id,
        name: a.name || 'anexo',
        size: a.size || 0,
        contentType: a.contentType || 'application/octet-stream',
      })),
    };
  });
}

/**
 * Converts HTML email content to plain text preserving paragraph breaks & spacing
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}
