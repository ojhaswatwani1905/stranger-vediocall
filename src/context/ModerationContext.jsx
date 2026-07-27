import React, { createContext, useContext, useState } from 'react';

const ModerationContext = createContext();

const INITIAL_REPORTS = [
  {
    id: 'rep-901',
    sessionId: 'sess-4091',
    reporterId: 'usr-88329',
    reporterName: 'Alex Vance',
    reportedId: 'usr-33104',
    reportedName: 'Unknown User #33104',
    reportedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    reasonCode: 'harassment',
    reasonLabel: 'Harassment / Offensive Behavior',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'pending', // pending, reviewed, escalated, dismissed
    clipUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-video-call-41221-large.mp4',
    notes: 'User reported abusive language during 1:1 call.'
  },
  {
    id: 'rep-902',
    sessionId: 'sess-4088',
    reporterId: 'usr-11029',
    reporterName: 'Jordan Lee',
    reportedId: 'usr-99210',
    reportedName: 'Account #99210',
    reportedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    reasonCode: 'minor-suspected',
    reasonLabel: 'Suspected Minor / CSAM Risk',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'escalated',
    clipUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-video-call-41221-large.mp4',
    notes: 'CSAM / Minor detection alert triggered by automated sampling & report.'
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-01',
    action: 'BAN_USER',
    targetUserId: 'usr-55102',
    adminId: 'mod-01 (Sarah Jenkins)',
    reason: 'Repeated harassment reports within 1 hour window',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'audit-02',
    action: 'CSAM_ESCALATED',
    targetUserId: 'usr-99210',
    adminId: 'mod-02 (System Lead)',
    reason: 'Immediate lock + Escalated to Legal / NCMEC Compliance Protocol',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const PROFANITY_KEYWORDS = ['scam', 'cashapp', 'telegram', 'whatsapp me', 'nude', 'venmo', 'pay me', 'crypto'];

export const ModerationProvider = ({ children }) => {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [bannedUsers, setBannedUsers] = useState(['usr-55102', 'usr-99210']);
  const [keywordList, setKeywordList] = useState(PROFANITY_KEYWORDS);

  // Synchronous text filter per Rules.md & Architecture.md §7
  const filterTextMessage = (text) => {
    if (!text) return { cleanText: text, isFlagged: false };
    let flagged = false;
    let cleanText = text;

    keywordList.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      if (regex.test(cleanText)) {
        flagged = true;
        cleanText = cleanText.replace(regex, '***');
      }
    });

    return { cleanText, isFlagged: flagged };
  };

  const fileReport = ({ sessionId, reportedUser, reasonCode, reasonLabel, clipBuffer }) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      sessionId,
      reporterId: 'usr-88329',
      reporterName: 'Alex Vance',
      reportedId: reportedUser.id || 'usr-stranger',
      reportedName: reportedUser.name || `Stranger #${Math.floor(Math.random() * 9000 + 1000)}`,
      reportedAvatar: reportedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      reasonCode,
      reasonLabel,
      timestamp: new Date().toISOString(),
      status: reasonCode === 'minor-suspected' ? 'escalated' : 'pending',
      clipUrl: clipBuffer || 'https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-video-call-41221-large.mp4',
      notes: `User reported for ${reasonLabel}. Auto-blocked from matching.`
    };

    setReports((prev) => [newReport, ...prev]);

    // Add Audit log
    const auditEntry = {
      id: `audit-${Date.now()}`,
      action: 'USER_REPORTED',
      targetUserId: newReport.reportedId,
      adminId: 'System Auto-Moderator',
      reason: `Report filed for ${reasonLabel}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Auto-suspend / Lock if CSAM / Minor suspected
    if (reasonCode === 'minor-suspected') {
      setBannedUsers((prev) => [...prev, newReport.reportedId]);
    }

    return newReport;
  };

  const updateReportStatus = (reportId, action, adminName = 'Admin', note = '') => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updatedStatus = action === 'dismiss' ? 'dismissed' : action === 'escalate' ? 'escalated' : 'reviewed';
          return { ...r, status: updatedStatus, actionTaken: action, actionNote: note };
        }
        return r;
      })
    );

    const report = reports.find((r) => r.id === reportId);
    if (report && (action === 'ban' || action === 'suspend' || action === 'escalate')) {
      setBannedUsers((prev) => [...new Set([...prev, report.reportedId])]);
    }

    // Add audit entry
    const auditEntry = {
      id: `audit-${Date.now()}`,
      action: `${action.toUpperCase()}_REPORT`,
      targetUserId: report?.reportedId || 'unknown',
      adminId: adminName,
      reason: note || `Action ${action} executed on report ${reportId}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const addKeyword = (keyword) => {
    if (!keyword || keywordList.includes(keyword.toLowerCase())) return;
    setKeywordList((prev) => [...prev, keyword.toLowerCase()]);
  };

  const removeKeyword = (keyword) => {
    setKeywordList((prev) => prev.filter((k) => k !== keyword.toLowerCase()));
  };

  return (
    <ModerationContext.Provider
      value={{
        reports,
        auditLogs,
        bannedUsers,
        keywordList,
        filterTextMessage,
        fileReport,
        updateReportStatus,
        addKeyword,
        removeKeyword
      }}
    >
      {children}
    </ModerationContext.Provider>
  );
};

export const useModeration = () => useContext(ModerationContext);
