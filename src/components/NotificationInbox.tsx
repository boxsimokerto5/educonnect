import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Award, 
  Clock, 
  DollarSign, 
  X, 
  Eye, 
  HeartHandshake,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification, User as AuthUser } from '../types';

interface NotificationInboxProps {
  notifications: AppNotification[];
  currentUser: AuthUser | null;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateToTab?: (type: string, relatedId?: string) => void;
}

export default function NotificationInbox({
  notifications,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNavigateToTab
}: NotificationInboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  // Filter notifications relevant to the current user
  const relevantNotifications = notifications.filter((notif) => {
    // 1. Direct user targeting
    if (notif.userId && notif.userId === currentUser.id) return true;
    
    // 2. Parent-specific targeting for their kid
    if (currentUser.role === 'parent' && notif.studentId && notif.studentId === currentUser.studentId) {
      return notif.role === 'parent' || notif.role === 'all';
    }

    // 3. Class-specific targeting
    if (notif.className && currentUser.className) {
      const userClasses = currentUser.className.split(',').map((c) => c.trim());
      if (userClasses.includes(notif.className)) {
        return notif.role === currentUser.role || notif.role === 'all';
      }
    }

    // 4. Role-specific targeting (without studentId restriction)
    if (notif.role === currentUser.role) return true;

    // 5. Global school-wide targeting
    if (notif.role === 'all') return true;

    return false;
  });

  const unreadCount = relevantNotifications.filter(
    (notif) => !notif.readBy.includes(currentUser.id)
  ).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return {
          icon: <FileText size={16} />,
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        };
      case 'permit':
        return {
          icon: <CheckCircle2 size={16} />,
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
        };
      case 'liaison':
        return {
          icon: <MessageSquare size={16} />,
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'grade':
        return {
          icon: <Award size={16} />,
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'attendance':
        return {
          icon: <Clock size={16} />,
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        };
      case 'spp':
      case 'keuangan':
        return {
          icon: <DollarSign size={16} />,
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
        };
      case 'counseling':
        return {
          icon: <HeartHandshake size={16} />,
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
      case 'calendar':
        return {
          icon: <Calendar size={16} />,
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        };
      default:
        return {
          icon: <Bell size={16} />,
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Mark as read
    if (!notif.readBy.includes(currentUser.id)) {
      onMarkAsRead(notif.id);
    }
    
    // Navigate if callback provided
    if (onNavigateToTab) {
      onNavigateToTab(notif.type, notif.relatedId);
    }
    setIsOpen(false);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 6000);
      
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      }
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative z-[9999]">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-md transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm border border-white/5"
        title="Kotak Masuk Notifikasi"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-swing origin-top' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-out Backdrop */}
            <div 
              className="fixed inset-0 z-[9998] bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed sm:absolute top-16 sm:top-auto left-4 sm:left-auto right-4 sm:right-0 mt-3.5 w-auto sm:w-96 max-w-[calc(100vw-32px)] sm:max-w-none bg-slate-900 border border-slate-800/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden text-slate-100 flex flex-col max-h-[480px]"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-400/10 text-yellow-400 p-1.5 rounded-lg border border-yellow-400/20">
                    <Bell size={14} />
                  </div>
                  <h3 className="font-display font-extrabold text-sm tracking-tight text-white">Notifikasi Aktivitas</h3>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500/25 text-rose-300 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-rose-500/20">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkAllAsRead();
                    }}
                    className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold hover:text-yellow-300 transition-colors cursor-pointer"
                  >
                    <CheckCheck size={12} />
                    Baca Semua
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40 max-h-[350px] custom-scrollbar">
                {relevantNotifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 border border-slate-800 text-slate-500">
                      <BellOffIcon />
                    </div>
                    <p className="font-display font-bold text-xs text-slate-300">Belum Ada Kabar</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Semua aktivitas sekolah, presensi, izin, dan pengumuman akan muncul di sini.</p>
                  </div>
                ) : (
                  relevantNotifications.map((notif) => {
                    const isUnread = !notif.readBy.includes(currentUser.id);
                    const visual = getNotificationIcon(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex gap-3 transition-all cursor-pointer relative overflow-hidden group select-none ${
                          isUnread 
                            ? 'bg-slate-900 hover:bg-slate-800/80' 
                            : 'bg-slate-950/20 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Unread Left Highlight bar */}
                        {isUnread && (
                          <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-400" />
                        )}

                        {/* Left Side Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${visual.bg} transition-transform group-hover:scale-105`}>
                          {visual.icon}
                        </div>

                        {/* Mid Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className={`font-display text-xs tracking-tight leading-tight line-clamp-1 ${
                              isUnread ? 'font-black text-white' : 'font-bold text-slate-300'
                            }`}>
                              {notif.title}
                            </h4>
                            <span className="text-[9px] text-slate-500 font-medium shrink-0 pt-0.5">
                              {formatTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                            isUnread ? 'text-slate-200 font-semibold' : 'text-slate-400 font-medium'
                          }`}>
                            {notif.body}
                          </p>
                        </div>

                        {/* Quick Mark Read or Delete Trigger */}
                        <div className="flex flex-col gap-1 items-center shrink-0 justify-center">
                          {isUnread ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notif.id);
                              }}
                              className="p-1 text-slate-500 hover:text-yellow-400 rounded-lg transition-colors"
                              title="Tandai Sudah Dibaca"
                            >
                              <Eye size={12} />
                            </button>
                          ) : (
                            onDeleteNotification && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(notif.id);
                                }}
                                className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                title="Hapus Notifikasi"
                              >
                                <Trash2 size={12} />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/50 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span>Terhubung real-time dengan server sekolah</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BellOffIcon() {
  return (
    <svg className="w-6 h-6 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}
