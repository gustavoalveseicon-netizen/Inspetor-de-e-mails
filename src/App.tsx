import React, { useState, useEffect } from 'react';
import { OutlookUser, OutlookEmail, FilterType } from './types';
import { INITIAL_EMAILS, fetchGraphEmails, fetchGraphUserProfile } from './services/microsoftGraph';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { AuditDashboard } from './components/AuditDashboard';
import { LoginScreen } from './components/LoginScreen';
import { LoginModal } from './components/LoginModal';
import { NewEmailModal } from './components/NewEmailModal';

export default function App() {
  // Completely clean initial state - zero mock data
  const [user, setUser] = useState<OutlookUser | null>(() => {
    const saved = localStorage.getItem('outlook_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isDemo || parsed.id?.startsWith('usr_demo_')) {
          localStorage.removeItem('outlook_user');
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [emails, setEmails] = useState<OutlookEmail[]>(() => {
    const saved = localStorage.getItem('outlook_emails');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean out any legacy mock data containing msg_001
        if (Array.isArray(parsed) && parsed.some((e: any) => e.id?.startsWith('msg_00'))) {
          localStorage.removeItem('outlook_emails');
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'drafts' | 'archive'>('inbox');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  // Starts with NO email selected so the Audit Dashboard with charts is shown
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  // Sender filter: "Auditar e-mail que vem apenas de tal e-mail"
  const [senderFilter, setSenderFilter] = useState<string>('');

  const [isAuditing, setIsAuditing] = useState(false);
  const [isBatchAuditing, setIsBatchAuditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNewEmailModalOpen, setIsNewEmailModalOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('outlook_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('outlook_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('outlook_emails', JSON.stringify(emails));
  }, [emails]);

  // Listen for OAuth postMessage popup event
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('3000')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { code } = event.data;
        if (code) {
          try {
            setIsRefreshing(true);
            const tokenRes = await fetch('/api/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code }),
            });
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
              localStorage.setItem('graph_token', tokenData.access_token);
              const profile = await fetchGraphUserProfile(tokenData.access_token);
              setUser(profile);
              const graphEmails = await fetchGraphEmails(tokenData.access_token);
              setEmails(graphEmails);
              setSelectedEmailId(null);
            }
          } catch (err) {
            console.error('Erro na autenticação OAuth:', err);
          } finally {
            setIsRefreshing(false);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Connect directly with real Microsoft Graph Token
  const handleLoginWithToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      const res = await fetch('/api/graph/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao autenticar com Microsoft Graph.' };
      }

      localStorage.setItem('graph_token', cleanToken);
      setUser(data.user);
      setEmails(data.emails || []);
      setSelectedEmailId(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com o servidor.' };
    }
  };

  // Filter emails according to folder, audit filter, and sender filter
  const visibleEmails = emails.filter((email) => {
    if (email.folder !== currentFolder) return false;

    // Filter by specific sender if active
    if (senderFilter && email.sender.email.toLowerCase() !== senderFilter.toLowerCase()) {
      return false;
    }

    if (currentFilter === 'unread') return !email.isRead;
    if (currentFilter === 'spacing_issues') {
      return (
        email.auditResult?.spacing?.hasExcessSpacing ||
        (!email.auditResult && /[ ]{2,}|\n{3,}/.test(email.body))
      );
    }
    if (currentFilter === 'scope_issues') {
      return (
        email.auditResult?.scope?.status === 'warning' ||
        email.auditResult?.scope?.status === 'critical'
      );
    }
    if (currentFilter === 'issues') {
      const a = email.auditResult;
      if (!a) return /[ ]{2,}|\n{3,}/.test(email.body);
      return (
        a.overallScore < 85 ||
        a.spacing.hasExcessSpacing ||
        a.errors.length > 0 ||
        a.information.attachmentReferenceVsReality.issueDetected
      );
    }

    return true;
  });

  const selectedEmail = selectedEmailId ? emails.find((e) => e.id === selectedEmailId) || null : null;

  // Handle email selection and mark as read
  const handleSelectEmail = (email: OutlookEmail) => {
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
      );
    }
  };

  // Perform single email audit via backend Gemini API
  const handleAuditEmail = async (emailToAudit: OutlookEmail) => {
    setIsAuditing(true);
    setEmails((prev) =>
      prev.map((e) => (e.id === emailToAudit.id ? { ...e, isAuditing: true } : e))
    );

    try {
      const response = await fetch('/api/audit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToAudit }),
      });

      if (!response.ok) {
        throw new Error(`Falha na requisição de auditoria: ${response.statusText}`);
      }

      const auditResult = await response.json();

      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailToAudit.id
            ? { ...e, auditResult, isAuditing: false, isRead: true }
            : e
        )
      );
    } catch (err) {
      console.error('Erro ao auditar e-mail:', err);
      setEmails((prev) =>
        prev.map((e) => (e.id === emailToAudit.id ? { ...e, isAuditing: false } : e))
      );
    } finally {
      setIsAuditing(false);
    }
  };

  // Perform batch audit on visible emails (respects senderFilter if active!)
  const handleBatchAuditAll = async () => {
    setIsBatchAuditing(true);
    const targetEmails = visibleEmails.filter((e) => !e.auditResult);
    for (const email of targetEmails) {
      await handleAuditEmail(email);
    }
    setIsBatchAuditing(false);
  };

  // Update email text (e.g. after cleaning whitespace or applying revision)
  const handleUpdateEmailBody = (emailId: string, newBody: string, newSubject?: string) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id === emailId) {
          const updated: OutlookEmail = {
            ...e,
            body: newBody,
            subject: newSubject || e.subject,
          };
          return updated;
        }
        return e;
      })
    );

    // Trigger re-audit to verify newly cleaned text
    const target = emails.find((e) => e.id === emailId);
    if (target) {
      handleAuditEmail({
        ...target,
        body: newBody,
        subject: newSubject || target.subject,
      });
    }
  };

  // Login handlers
  const handleLoginGraphOAuth = async (customClientId?: string) => {
    try {
      const query = customClientId ? `?client_id=${encodeURIComponent(customClientId)}` : '';
      const res = await fetch(`/api/auth/url${query}`);
      const { url } = await res.json();

      const authWindow = window.open(url, 'microsoft_oauth_popup', 'width=600,height=720');
      if (!authWindow) {
        alert('Por favor, permita popups neste navegador para conectar sua conta Microsoft.');
      }
    } catch (err) {
      console.error('Falha ao abrir popup Microsoft:', err);
    }
  };

  // Wipes all data completely
  const handleClearAllData = () => {
    localStorage.removeItem('outlook_user');
    localStorage.removeItem('outlook_emails');
    localStorage.removeItem('graph_token');
    sessionStorage.clear();
    setUser(null);
    setEmails([]);
    setSelectedEmailId(null);
    setSenderFilter('');
  };

  const handleLogout = () => {
    handleClearAllData();
  };

  const handleAddCustomEmail = (newEmail: OutlookEmail) => {
    setEmails((prev) => [newEmail, ...prev]);
    setSelectedEmailId(newEmail.id);
    handleAuditEmail(newEmail);
  };

  // Refresh live emails from Microsoft Graph API if token is present
  const handleRefreshEmails = async () => {
    setIsRefreshing(true);
    const token = localStorage.getItem('graph_token');
    if (token) {
      try {
        const res = await fetch('/api/graph/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.emails) {
            setEmails(data.emails);
          }
        }
      } catch (err) {
        console.error('Erro ao atualizar e-mails:', err);
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // If user is not logged in, show the dedicated Microsoft Outlook Login Screen!
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={(loggedInUser, token) => {
          setUser(loggedInUser);
          setSelectedEmailId(null);
          if (token) {
            handleLoginWithToken(token);
          }
        }}
        onLoginGraphOAuth={handleLoginGraphOAuth}
        onLoginWithToken={handleLoginWithToken}
      />
    );
  }

  // Stats calculation
  const totalEmailsCount = emails.length;
  const auditedCount = emails.filter((e) => !!e.auditResult).length;
  const issuesCount = emails.filter(
    (e) =>
      e.auditResult &&
      (e.auditResult.overallScore < 85 ||
        e.auditResult.spacing.hasExcessSpacing ||
        e.auditResult.information.attachmentReferenceVsReality.issueDetected)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Outlook Header */}
      <Header
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenNewEmail={() => setIsNewEmailModalOpen(true)}
        onRefreshEmails={handleRefreshEmails}
        isRefreshing={isRefreshing}
        totalEmails={totalEmailsCount}
        auditedCount={auditedCount}
        issuesCount={issuesCount}
        onShowDashboard={() => setSelectedEmailId(null)}
        isShowingDashboard={selectedEmailId === null}
        onClearAllData={handleClearAllData}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders & Filters Sidebar */}
        <Sidebar
          currentFolder={currentFolder}
          onSelectFolder={setCurrentFolder}
          currentFilter={currentFilter}
          onSelectFilter={setCurrentFilter}
          emails={emails}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          isDemo={false}
          onShowDashboard={() => setSelectedEmailId(null)}
          isShowingDashboard={selectedEmailId === null}
          senderFilter={senderFilter}
          onSetSenderFilter={setSenderFilter}
        />

        {/* Email Explorer / Mailbox List */}
        <EmailList
          emails={visibleEmails}
          selectedEmailId={selectedEmailId}
          onSelectEmail={handleSelectEmail}
          onBatchAuditAll={handleBatchAuditAll}
          isBatchAuditing={isBatchAuditing}
          senderFilter={senderFilter}
          onSetSenderFilter={setSenderFilter}
        />

        {/* Dynamic Main Workspace: If email is selected, shows EmailViewer; if no email is selected, shows AuditDashboard with Graphs! */}
        {selectedEmail ? (
          <EmailViewer
            email={selectedEmail}
            onAuditEmail={handleAuditEmail}
            isAuditing={isAuditing}
            onUpdateEmailBody={handleUpdateEmailBody}
          />
        ) : (
          <AuditDashboard
            emails={visibleEmails}
            onSelectEmail={handleSelectEmail}
            onBatchAuditAll={handleBatchAuditAll}
            isBatchAuditing={isBatchAuditing}
            senderFilter={senderFilter}
            onSetSenderFilter={setSenderFilter}
          />
        )}
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginDemo={() => {
          setEmails([]);
          setSelectedEmailId(null);
        }}
        onLoginGraphOAuth={handleLoginGraphOAuth}
      />

      <NewEmailModal
        isOpen={isNewEmailModalOpen}
        onClose={() => setIsNewEmailModalOpen(false)}
        onAddEmail={handleAddCustomEmail}
      />
    </div>
  );
}
