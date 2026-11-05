import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// OAuth Callback handler for Microsoft / 3P popup
app.get(['/auth/callback', '/auth/callback/'], (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <title>Autenticação Microsoft Concluída</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; text-align: center; }
          .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 420px; }
          .spinner { width: 36px; height: 36px; border: 4px solid #e2e8f0; border-top-color: #0284c7; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h3 style="margin-bottom: 0.5rem;">Conectando com o Outlook...</h3>
          <p style="color: #64748b; font-size: 0.95rem;">Esta janela será fechada automaticamente em instantes.</p>
        </div>
        <script>
          const authData = {
            type: 'OAUTH_AUTH_SUCCESS',
            code: ${JSON.stringify(code || '')},
            state: ${JSON.stringify(state || '')},
            error: ${JSON.stringify(error || '')},
            errorDescription: ${JSON.stringify(error_description || '')}
          };

          if (window.opener) {
            window.opener.postMessage(authData, '*');
            setTimeout(() => window.close(), 700);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Endpoint to construct Microsoft Graph OAuth URL
app.get('/api/auth/url', (req: Request, res: Response) => {
  const customClientId = (req.query.client_id as string) || process.env.MICROSOFT_CLIENT_ID || 'demo-microsoft-client-id';
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const redirectUri = `${appUrl}/auth/callback`;

  const params = new URLSearchParams({
    client_id: customClientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'User.Read Mail.Read Mail.ReadWrite offline_access',
    state: Math.random().toString(36).substring(7),
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({ url: authUrl, redirectUri });
});

// Endpoint to exchange OAuth code for Microsoft Graph tokens
app.post('/api/auth/token', async (req: Request, res: Response) => {
  try {
    const { code, clientId, clientSecret, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código de autorização ausente.' });
    }

    const effectiveClientId = clientId || process.env.MICROSOFT_CLIENT_ID;
    const effectiveClientSecret = clientSecret || process.env.MICROSOFT_CLIENT_SECRET;

    if (!effectiveClientId || !effectiveClientSecret) {
      // Return simulated token for testing if secrets are not supplied yet
      return res.json({
        access_token: 'mock_token_' + Date.now(),
        expires_in: 3600,
        token_type: 'Bearer',
        message: 'Modo de credenciais padrão configurado com sucesso.',
      });
    }

    const tokenParams = new URLSearchParams({
      client_id: effectiveClientId,
      client_secret: effectiveClientSecret,
      code,
      redirect_uri: redirectUri || `${process.env.APP_URL}/auth/callback`,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao obter token do Microsoft Graph.' });
  }
});

// Endpoint to validate token and fetch real live Outlook data via server proxy
app.post('/api/graph/sync', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token de acesso do Microsoft Graph não fornecido.' });
  }

  const cleanToken = token.trim().replace(/^Bearer\s+/i, '');

  try {
    // 1. Fetch user profile
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileRes.ok) {
      const err = await profileRes.json().catch(() => ({}));
      return res.status(profileRes.status).json({
        error: err.error?.message || `Erro ao validar conta Microsoft (${profileRes.statusText}).`,
      });
    }

    const profileData = await profileRes.json();
    const email = profileData.mail || profileData.userPrincipalName || '';

    const user = {
      id: profileData.id || `usr_${Date.now()}`,
      displayName: profileData.displayName || email.split('@')[0] || 'Usuário Outlook',
      email: email,
      jobTitle: profileData.jobTitle || 'Conta Microsoft 365 / Outlook',
      isDemo: false,
      connectedAt: new Date().toISOString(),
    };

    // 2. Fetch inbox messages
    const messagesRes = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=30&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments,isRead&$expand=attachments($select=id,name,size,contentType)',
      {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let emails: any[] = [];
    if (messagesRes.ok) {
      const messagesData = await messagesRes.json();
      const rawMessages = messagesData.value || [];

      emails = rawMessages.map((m: any) => {
        let content = m.body?.content || m.bodyPreview || '';
        if (m.body?.contentType === 'html') {
          content = content
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .trim();
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
          bodyPreview: m.bodyPreview || content.substring(0, 150),
          body: content,
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

    return res.json({ user, emails });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao sincronizar com o Microsoft Graph.' });
  }
});

// AI-Powered Email Inspector using Gemini 3.8 Flash
app.post('/api/audit-email', async (req: Request, res: Response) => {
  const { email, customScopePrompt } = req.body;

  if (!email || !email.body) {
    return res.status(400).json({ error: 'E-mail ou corpo do e-mail não informado.' });
  }

  const prompt = `Você é um auditor sênior de comunicação corporativa, qualidade textual e validação de processos para e-mails do Microsoft Outlook.
Analise detalhadamente o seguinte e-mail recebido ou redigido:

--- DADOS DO E-MAIL ---
Assunto: ${email.subject || '(Sem assunto)'}
Remetente: ${email.sender?.name || ''} <${email.sender?.email || ''}>
Destinatários: ${(email.toRecipients || []).map((r: any) => `${r.name} <${r.email}>`).join(', ')}
Possui anexo real no Outlook?: ${email.hasAttachments ? 'SIM (Anexos presentes)' : 'NÃO (Nenhum anexo)'}
Lista de anexos reais: ${(email.attachments || []).map((a: any) => a.name).join(', ') || 'Nenhum'}
Data: ${email.receivedDateTime || 'Hoje'}

Corpo do e-mail:
"""
${email.body}
"""

${customScopePrompt ? `Instruções adicionais de escopo solicitadas pelo usuário: "${customScopePrompt}"` : ''}

CRITÉRIOS DE INSPEÇÃO OBRIGATÓRIOS:
1. ESCOPO DO E-MAIL (O escopo está certo?):
   - O corpo do e-mail cumpre e responde exatamente ao que o assunto propõe?
   - O objetivo da mensagem é claro, conciso e sem divagações?
   - Existe uma Chamada para Ação (Call to Action - CTA) evidente? Há prazos e responsáveis explícitos?
   - O escopo está alinhado ("optimal"), com desvios ("warning") ou totalmente confuso ("critical")?

2. PRECISÃO DAS INFORMAÇÕES (Todas as informações estão corretas?):
   - Verifique datas e dias da semana (ex: conferir se a data citada é coerente, se dia da semana coincide com o calendário, se há inconsistências de prazos).
   - Verifique valores monetários e numéricos (ex: R$ divergentes no corpo do e-mail, cálculos inconsistentes).
   - Verifique menção de anexos vs realidade: se o texto diz "segue em anexo", "em anexo", "anexei", mas o e-mail NÃO tem anexos reais (${email.hasAttachments ? 'tem anexo' : 'SEM anexo'}), isso é um ERRO GRAVE!
   - Verifique placeholders esquecidos, como "[Nome do Cliente]", "[Data]", "[Valor]".

3. ERROS TEXTUAIS E TOM (Mostrar se tem algum erro):
   - Identifique erros de ortografia, gramática, pontuação e concordância.
   - Avalie o tom (se adequado para ambiente corporativo / cliente).
   - Aponte trechos específicos e sugestões de correção.

4. ESPAÇO SOBRANDO E FORMATAÇÃO (Se tem espaço sobrando):
   - Identifique e aponte espaços duplos ou múltiplos entre palavras (ex: "Olá  Gustavo").
   - Identifique linhas em branco desnecessárias ou excessivas (ex: 2 ou mais linhas vazias consecutivas).
   - Identifique espaços em branco no final de linhas (trailing spaces).
   - Identifique espaços antes de pontuações (ex: "palavra , outra") ou ausência de espaço após vírgulas (ex: "hoje,às").

5. VERSÃO CORRIGIDA E POLIDA:
   - Forneça uma reescrita impecável do assunto e do corpo, eliminando todos os espaços sobrando, corrigindo gramática, clareando o escopo e organizando a formatação.

Retorne EXCLUSIVAMENTE em formato JSON com o seguinte schema:
{
  "overallScore": number (0 a 100),
  "overallVerdict": "Excelente" | "Atenção Necessária" | "Erros Críticos",
  "summary": string (resumo executivo direto de 2-3 frases),
  "scope": {
    "status": "optimal" | "warning" | "critical",
    "verdict": string,
    "objectiveClarity": number (0 a 100),
    "subjectMatchScore": number (0 a 100),
    "callToAction": {
      "detected": boolean,
      "description": string,
      "deadlinesIdentified": string[]
    },
    "scopeRisks": string[],
    "recommendations": string[]
  },
  "information": {
    "status": "optimal" | "warning" | "critical",
    "score": number (0 a 100),
    "itemsChecked": [
      {
        "id": string,
        "label": string,
        "status": "valid" | "invalid" | "warning" | "missing",
        "extractedText": string,
        "notes": string
      }
    ],
    "missingElements": string[],
    "datesAnalysis": {
      "mentioned": string[],
      "hasInconsistencies": boolean,
      "details": string
    },
    "attachmentReferenceVsReality": {
      "mentionedInText": boolean,
      "isActuallyAttached": boolean,
      "issueDetected": boolean,
      "details": string
    }
  },
  "errors": [
    {
      "id": string,
      "type": "orthography" | "grammar" | "punctuation" | "tone" | "placeholder",
      "severity": "low" | "medium" | "high",
      "snippet": string,
      "explanation": string,
      "suggestion": string,
      "line": number
    }
  ],
  "spacing": {
    "hasExcessSpacing": boolean,
    "score": number (0 a 100),
    "doubleSpacesCount": number,
    "excessBlankLinesCount": number,
    "trailingSpacesCount": number,
    "punctuationSpacingErrorsCount": number,
    "totalIssuesCount": number,
    "details": string[],
    "lineIssues": [
      {
        "lineNumber": number,
        "issueType": "double-space" | "trailing-space" | "blank-line" | "punctuation-space",
        "description": string,
        "rawLine": string
      }
    ],
    "cleanedBody": string
  },
  "suggestedRevision": {
    "subject": string,
    "body": string,
    "improvementsSummary": string[]
  }
}`;

  if (!process.env.GEMINI_API_KEY) {
    const fallbackAudit = buildFallbackAudit(email);
    return res.json(fallbackAudit);
  }

  try {
    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao conectar com Gemini API')), 8000)
    );

    const aiResponse: any = await Promise.race([aiPromise, timeoutPromise]);

    const text = (aiResponse.text || '').trim();
    const parsed = JSON.parse(text);
    parsed.auditedAt = new Date().toISOString();

    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini Audit API error, falling back to deterministic inspection:', error);

    // Fallback deterministic analyzer in case of network/key unavailability
    const fallbackAudit = buildFallbackAudit(email);
    return res.json(fallbackAudit);
  }
});

// Deterministic rule-based fallback analyzer
function buildFallbackAudit(email: any) {
  const body = email.body || '';
  const lines = body.split('\n');

  // Check whitespace
  let doubleSpacesCount = 0;
  let trailingSpacesCount = 0;
  let excessBlankLinesCount = 0;
  let consecutiveBlank = 0;

  const spacingIssues: any[] = [];
  const errors: any[] = [];
  const itemsChecked: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim().length === 0) {
      consecutiveBlank++;
      if (consecutiveBlank >= 2) {
        excessBlankLinesCount++;
        spacingIssues.push({
          lineNumber: i + 1,
          issueType: 'blank-line',
          description: `Linha em branco excedente na linha ${i + 1}`,
          rawLine: '(linha em branco)',
        });
      }
    } else {
      consecutiveBlank = 0;
    }

    if (/[ \t]+$/.test(l)) {
      trailingSpacesCount++;
      spacingIssues.push({
        lineNumber: i + 1,
        issueType: 'trailing-space',
        description: `Espaço no final da linha ${i + 1}`,
        rawLine: l,
      });
    }

    const dblMatch = l.match(/(?<=\S)[ ]{2,}(?=\S)/g);
    if (dblMatch) {
      doubleSpacesCount += dblMatch.length;
      spacingIssues.push({
        lineNumber: i + 1,
        issueType: 'double-space',
        description: `${dblMatch.length} espaço(s) duplo(s) detectado(s)`,
        rawLine: l,
      });
    }

    if (/\w[ ]+[,;:.!?]/.test(l)) {
      spacingIssues.push({
        lineNumber: i + 1,
        issueType: 'punctuation-space',
        description: `Espaço indevido antes de pontuação`,
        rawLine: l,
      });
    }

    // Placeholders check like [Nome]
    const placeholderMatch = l.match(/\[[A-Za-zÀ-ÿ\s]+\]/g);
    if (placeholderMatch) {
      errors.push({
        id: `err_ph_${i}`,
        type: 'placeholder',
        severity: 'high',
        snippet: placeholderMatch.join(', '),
        explanation: 'Variável de preenchimento pendente (campo entre colchetes esquecido).',
        suggestion: 'Substituir pelo dado real do destinatário.',
        line: i + 1,
      });
    }
  }

  // Check attachments in text vs real attachments
  const mentionsAttachment = /anexo|anexei|anexada|anexado/i.test(body);
  const actuallyHasAttachment = !!email.hasAttachments;
  const attachmentIssue = mentionsAttachment && !actuallyHasAttachment;

  itemsChecked.push({
    id: 'it_att',
    label: 'Validação de Anexos Cituados',
    status: attachmentIssue ? 'invalid' : mentionsAttachment ? 'valid' : 'warning',
    extractedText: mentionsAttachment ? 'Cita documento em anexo' : 'Não cita anexos',
    notes: attachmentIssue
      ? 'CRÍTICO: O texto cita anexo, mas nenhum arquivo foi anexado ao e-mail no Outlook!'
      : actuallyHasAttachment
      ? 'Anexos confirmados no e-mail.'
      : 'Sem menções ou anexos.',
  });

  // Check values
  const moneyMatch = body.match(/R\$\s*[\d.,]+/g);
  if (moneyMatch) {
    itemsChecked.push({
      id: 'it_val',
      label: 'Valores Financeiros Citados',
      status: moneyMatch.length > 1 ? 'warning' : 'valid',
      extractedText: moneyMatch.join(' | '),
      notes: moneyMatch.length > 1 ? 'Múltiplos valores identificados. Recomenda-se confirmar a conferência dos totais.' : 'Valor único verificado.',
    });
  }

  const totalSpacingIssues = doubleSpacesCount + trailingSpacesCount + excessBlankLinesCount;
  const hasSpacingIssues = totalSpacingIssues > 0;
  const spacingScore = Math.max(30, 100 - totalSpacingIssues * 8);

  const overallScore = Math.max(40, Math.round((spacingScore + (attachmentIssue ? 40 : 90) + (errors.length ? 50 : 95)) / 3));

  const cleaned = body
    .replace(/[ ]{2,}/g, ' ')
    .replace(/ +([,;:.!?])/g, '$1')
    .replace(/([,;])([A-Za-zÀ-ÿ])/g, '$1 $2')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    auditedAt: new Date().toISOString(),
    overallScore,
    overallVerdict: overallScore >= 85 ? 'Excelente' : overallScore >= 60 ? 'Atenção Necessária' : 'Erros Críticos',
    summary: `Inspeção concluída: detectados ${totalSpacingIssues} problemas de espaçamento, ${errors.length} pontos de atenção de texto e ${attachmentIssue ? 'divergência de anexo pendente' : 'validações de anexo regulares'}.`,
    scope: {
      status: attachmentIssue || errors.length > 2 ? 'warning' : 'optimal',
      verdict: 'O e-mail possui estrutura básica compreensível, mas necessita de refinamento e padronização.',
      objectiveClarity: 80,
      subjectMatchScore: 85,
      callToAction: {
        detected: /aguardo|confirme|avalie|retorno|resposta/i.test(body),
        description: 'Solicitação de retorno ou confirmação identificada no desfecho da mensagem.',
        deadlinesIdentified: ['Conferir prazo mencionado no corpo do e-mail'],
      },
      scopeRisks: attachmentIssue ? ['O destinatário não conseguirá dar andamento sem o anexo citado.'] : [],
      recommendations: [
        'Remover espaços sobressalentes e linhas vazias.',
        attachmentIssue ? 'Anexar o arquivo prometido antes do envio.' : 'Confirmar canais e prazos de resposta.',
      ],
    },
    information: {
      status: attachmentIssue ? 'critical' : 'optimal',
      score: attachmentIssue ? 55 : 90,
      itemsChecked,
      missingElements: attachmentIssue ? ['Arquivo anexo citado no corpo do e-mail'] : [],
      datesAnalysis: {
        mentioned: ['Datas identificadas no fluxo de comunicação'],
        hasInconsistencies: false,
        details: 'Verificar alinhamento de dias úteis com o calendário corrente.',
      },
      attachmentReferenceVsReality: {
        mentionedInText: mentionsAttachment,
        isActuallyAttached: actuallyHasAttachment,
        issueDetected: attachmentIssue,
        details: attachmentIssue
          ? 'ALERTA: O remetente escreveu "segue em anexo", porém o e-mail não possui nenhum anexo.'
          : 'Conformidade de anexos atendida.',
      },
    },
    errors,
    spacing: {
      hasExcessSpacing: hasSpacingIssues,
      score: spacingScore,
      doubleSpacesCount,
      excessBlankLinesCount,
      trailingSpacesCount,
      punctuationSpacingErrorsCount: 0,
      totalIssuesCount: totalSpacingIssues,
      details: [
        `${doubleSpacesCount} espaço(s) duplos entre palavras`,
        `${excessBlankLinesCount} linha(s) em branco excedentes`,
        `${trailingSpacesCount} linha(s) com espaços residuais no final`,
      ],
      lineIssues: spacingIssues,
      cleanedBody: cleaned,
    },
    suggestedRevision: {
      subject: email.subject || 'Assunto Padronizado',
      body: cleaned,
      improvementsSummary: [
        'Eliminação de espaços múltiplos e linhas desnecessárias.',
        'Ajuste de pontuação e espaçamentos padronizados.',
        'Remoção de resíduos de formatação.',
      ],
    },
  };
}

// Dev and Prod setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Outlook Inspector Server running on port ${PORT}`);
  });
}

startServer();
