export interface OutlookUser {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  avatarUrl?: string;
  isDemo: boolean;
  connectedAt: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

export interface OutlookEmail {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  toRecipients: {
    name: string;
    email: string;
  }[];
  receivedDateTime: string;
  bodyPreview: string;
  body: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive';
  isRead: boolean;
  isFlagged: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  auditResult?: EmailAuditResult;
  isAuditing?: boolean;
}

export interface ScopeAnalysis {
  status: 'optimal' | 'warning' | 'critical';
  verdict: string;
  objectiveClarity: number; // 0-100
  subjectMatchScore: number; // 0-100
  callToAction: {
    detected: boolean;
    description: string;
    deadlinesIdentified: string[];
  };
  scopeRisks: string[];
  recommendations: string[];
}

export interface InformationItem {
  id: string;
  label: string;
  status: 'valid' | 'invalid' | 'warning' | 'missing';
  extractedText: string;
  notes: string;
}

export interface InformationAnalysis {
  status: 'optimal' | 'warning' | 'critical';
  score: number; // 0-100
  itemsChecked: InformationItem[];
  missingElements: string[];
  datesAnalysis: {
    mentioned: string[];
    hasInconsistencies: boolean;
    details: string;
  };
  attachmentReferenceVsReality: {
    mentionedInText: boolean;
    isActuallyAttached: boolean;
    issueDetected: boolean;
    details: string;
  };
}

export interface TextError {
  id: string;
  type: 'orthography' | 'grammar' | 'punctuation' | 'tone' | 'placeholder';
  severity: 'low' | 'medium' | 'high';
  snippet: string;
  explanation: string;
  suggestion: string;
  line?: number;
}

export interface SpacingDiagnostic {
  hasExcessSpacing: boolean;
  score: number; // 0-100 (100 = perfectly formatted)
  doubleSpacesCount: number;
  excessBlankLinesCount: number;
  trailingSpacesCount: number;
  punctuationSpacingErrorsCount: number;
  totalIssuesCount: number;
  details: string[];
  lineIssues: {
    lineNumber: number;
    issueType: 'double-space' | 'trailing-space' | 'blank-line' | 'punctuation-space';
    description: string;
    rawLine: string;
  }[];
  cleanedBody: string;
}

export interface EmailAuditResult {
  auditedAt: string;
  overallScore: number; // 0-100
  overallVerdict: 'Excelente' | 'Atenção Necessária' | 'Erros Críticos';
  summary: string;
  scope: ScopeAnalysis;
  information: InformationAnalysis;
  errors: TextError[];
  spacing: SpacingDiagnostic;
  suggestedRevision: {
    subject: string;
    body: string;
    improvementsSummary: string[];
  };
}

export type FilterType = 'all' | 'unread' | 'issues' | 'spacing_issues' | 'scope_issues';
export type ViewTab = 'viewer' | 'audit' | 'diff' | 'reply';
