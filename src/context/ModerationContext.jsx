import React, { createContext, useContext, useState } from 'react';

const ModerationContext = createContext();

const INITIAL_USERS = [
  {
    id: 'usr-88329',
    name: 'Alex Vance',
    email: 'alex@betadrix.com',
    status: 'active',
    role: 'user',
    gender: 'non-binary',
    country: 'United States',
    reports: 0,
    coins: 450,
    joinDate: '2025-12-01',
    warningCount: 0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    banReason: null
  },
  {
    id: 'usr-11029',
    name: 'Elena Rostova',
    email: 'elena@betadrix.com',
    status: 'active',
    role: 'user',
    gender: 'female',
    country: 'Spain',
    reports: 0,
    coins: 1200,
    joinDate: '2026-01-15',
    warningCount: 0,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    banReason: null
  },
  {
    id: 'usr-44910',
    name: 'Jordan Lee',
    email: 'jordan@betadrix.com',
    status: 'active',
    role: 'user',
    gender: 'male',
    country: 'South Korea',
    reports: 0,
    coins: 600,
    joinDate: '2026-03-05',
    warningCount: 0,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    banReason: null
  },
  {
    id: 'usr-33104',
    name: 'Unknown User #33104',
    email: 'user33104@anon.com',
    status: 'suspended',
    role: 'user',
    gender: 'male',
    country: 'Brazil',
    reports: 3,
    coins: 0,
    joinDate: '2026-01-15',
    warningCount: 2,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    banReason: 'Temporary suspension for inappropriate language'
  },
  {
    id: 'usr-55102',
    name: 'Banned Account #55102',
    email: 'banned55102@spam.com',
    status: 'banned',
    role: 'user',
    gender: 'male',
    country: 'Russia',
    reports: 12,
    coins: 0,
    joinDate: '2026-02-20',
    warningCount: 4,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    banReason: 'Multiple harassment reports and policy violations'
  },
  {
    id: 'usr-99210',
    name: 'Account #99210',
    email: 'account99210@risk.org',
    status: 'banned',
    role: 'user',
    gender: 'male',
    country: 'Unknown',
    reports: 1,
    coins: 0,
    joinDate: '2026-06-01',
    warningCount: 1,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    banReason: 'CSAM / Minor detection safety protocol enforcement'
  }
];

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
    status: 'pending',
    clipUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-video-call-41221-large.mp4',
    notes: 'User reported abusive language during 1:1 call session.'
  },
  {
    id: 'rep-902',
    sessionId: 'sess-4088',
    reporterId: 'usr-11029',
    reporterName: 'Elena Rostova',
    reportedId: 'usr-99210',
    reportedName: 'Account #99210',
    reportedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    reasonCode: 'minor-suspected',
    reasonLabel: 'Suspected Minor / CSAM Risk',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'escalated',
    clipUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-video-call-41221-large.mp4',
    notes: 'CSAM / Minor detection alert triggered by automated sampling & report.'
  },
  {
    id: 'rep-903',
    sessionId: 'sess-4075',
    reporterId: 'usr-44910',
    reporterName: 'Jordan Lee',
    reportedId: 'usr-55102',
    reportedName: 'Banned Account #55102',
    reportedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    reasonCode: 'inappropriate',
    reasonLabel: 'Inappropriate Content / Nudity',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'reviewed',
    actionTaken: 'ban',
    clipUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-video-call-41221-large.mp4',
    notes: 'Inappropriate webcam feed flagged during call.'
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-01',
    action: 'BAN_USER',
    targetUserId: 'usr-55102',
    adminId: 'Admin Master',
    reason: 'Repeated harassment reports within 1 hour window',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'audit-02',
    action: 'CSAM_ESCALATED',
    targetUserId: 'usr-99210',
    adminId: 'System Auto-Moderator',
    reason: 'Immediate lock + Escalated to Legal / NCMEC Compliance Protocol',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const PROFANITY_KEYWORDS = ['scam', 'cashapp', 'telegram', 'whatsapp me', 'nude', 'venmo', 'pay me', 'crypto'];

export const ModerationProvider = ({ children }) => {
  const [usersList, setUsersList] = useState(INITIAL_USERS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [keywordList, setKeywordList] = useState(PROFANITY_KEYWORDS);

  // Derive banned user IDs
  const bannedUsers = usersList
    .filter((u) => u.status === 'banned' || u.status === 'suspended')
    .map((u) => u.id);

  // Synchronous text filter
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

  const fileReport = ({ sessionId, reporterUser, reportedUser, reasonCode, reasonLabel, clipBuffer }) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      sessionId,
      reporterId: reporterUser?.id || 'usr-88329',
      reporterName: reporterUser?.name || 'Alex Vance',
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

    // Increment user report count in usersList
    setUsersList((prev) =>
      prev.map((u) => (u.id === newReport.reportedId ? { ...u, reports: (u.reports || 0) + 1 } : u))
    );

    // Audit log
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
      banUser(newReport.reportedId, 'Automated safety lock: CSAM / Minor risk suspected', 'System Auto-Moderator');
    }

    return newReport;
  };

  // ═══ ADMIN USER ACTIONS ═══
  const banUser = (userId, reason = 'Banned by admin per policy violation', adminName = 'Admin Master') => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'banned', banReason: reason } : u))
    );

    // Add Audit Entry
    const auditEntry = {
      id: `audit-${Date.now()}`,
      action: 'BAN_USER',
      targetUserId: userId,
      adminId: adminName,
      reason,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const suspendUser = (userId, durationHours = 24, reason = 'Temporary account suspension', adminName = 'Admin Master') => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'suspended', banReason: `${reason} (${durationHours}h)` } : u))
    );

    const auditEntry = {
      id: `audit-${Date.now()}`,
      action: 'SUSPEND_USER',
      targetUserId: userId,
      adminId: adminName,
      reason: `${reason} (${durationHours} hours)`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const warnUser = (userId, reason = 'Formal community warning issued', adminName = 'Admin Master') => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: u.status === 'active' ? 'warned' : u.status,
              warningCount: (u.warningCount || 0) + 1
            }
          : u
      )
    );

    const auditEntry = {
      id: `audit-${Date.now()}`,
      action: 'WARN_USER',
      targetUserId: userId,
      adminId: adminName,
      reason,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const unbanUser = (userId, adminName = 'Admin Master') => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active', banReason: null } : u))
    );

    const auditEntry = {
      id: `audit-${Date.now()}`,
      action: 'UNBAN_USER',
      targetUserId: userId,
      adminId: adminName,
      reason: 'Account reinstated by administrator',
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const updateReportStatus = (reportId, action, adminName = 'Admin Master', note = '') => {
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
    if (report) {
      if (action === 'ban') {
        banUser(report.reportedId, note || `Banned following report #${reportId}`, adminName);
      } else if (action === 'suspend') {
        suspendUser(report.reportedId, 24, note || `Suspended following report #${reportId}`, adminName);
      } else if (action === 'warn') {
        warnUser(report.reportedId, note || `Warned following report #${reportId}`, adminName);
      }
    }

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

  const getUserReports = (userId) => {
    return reports.filter((r) => r.reportedId === userId || r.reporterId === userId);
  };

  const isUserRestricted = (userId) => {
    const userObj = usersList.find((u) => u.id === userId);
    if (!userObj) return false;
    return userObj.status === 'banned' || userObj.status === 'suspended';
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
        usersList,
        setUsersList,
        reports,
        auditLogs,
        bannedUsers,
        keywordList,
        filterTextMessage,
        fileReport,
        updateReportStatus,
        banUser,
        suspendUser,
        warnUser,
        unbanUser,
        getUserReports,
        isUserRestricted,
        addKeyword,
        removeKeyword
      }}
    >
      {children}
    </ModerationContext.Provider>
  );
};

export const useModeration = () => useContext(ModerationContext);
