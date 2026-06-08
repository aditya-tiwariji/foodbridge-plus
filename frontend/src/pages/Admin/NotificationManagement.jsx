import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Check, 
  Clock, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/adminService.js';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');

  const fetchAlertsList = async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications({
        page,
        limit: 10
      });
      if (data.success) {
        setNotifications(data.notifications);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve notification logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsList();
  }, [page]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      await fetchAlertsList();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsRead();
      await fetchAlertsList();
    } catch (err) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const hasUnread = notifications.some(item => !item.isRead);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition">
              <ArrowLeft className="w-4 h-4" /> Go Back Home
            </Link>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Bell className="w-8 h-8 text-emerald-400 animate-swing" /> Notifications Log
            </h1>
            <p className="text-sm text-slate-400">
              Browse historical records of your Socket.io realtime broadcasts and SMTP alerts.
            </p>
          </div>

          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading || loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 self-start sm:self-center"
            >
              {actionLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <CheckCheck className="w-4.5 h-4.5" />
              )}
              Mark All as Read
            </button>
          )}
        </div>

        {/* List Container */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="p-5 bg-red-900/10 border-b border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-slate-800/20 border border-slate-800/40 rounded-xl h-24 animate-pulse"></div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-20 text-center text-slate-455 text-slate-400">
              <Inbox className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-lg font-bold">No Notifications Logged</p>
              <p className="text-sm text-slate-550 mt-1">Your history log is currently clear.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-850 divide-slate-800/60">
              {notifications.map((item) => (
                <div 
                  key={item._id} 
                  className={`p-5 flex gap-4 transition duration-150 ${
                    item.isRead ? 'hover:bg-slate-900/10' : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                  }`}
                >
                  {/* Read indicator / Type icon */}
                  <div className="shrink-0 mt-1">
                    <div className={`p-2.5 rounded-xl border ${
                      item.isRead 
                        ? 'bg-slate-950/80 border-slate-800 text-slate-450' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className={`font-bold text-slate-200 ${item.isRead ? 'text-slate-300' : 'text-slate-100 font-extrabold'}`}>
                        {item.title}
                      </h3>
                      <span className="text-[10px] text-slate-455 text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${item.isRead ? 'text-slate-400' : 'text-slate-300 font-medium'}`}>
                      {item.message}
                    </p>

                    {/* Controls */}
                    {!item.isRead && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleMarkAsRead(item._id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-350 bg-emerald-500/5 border border-emerald-500/25 px-2.5 py-1 rounded-md transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-950/65 px-6 py-4.5 flex items-center justify-between border-t border-slate-800">
              <p className="text-xs text-slate-450">
                Showing Page <span className="font-bold text-slate-350">{page}</span> of <span className="font-bold text-slate-300">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 p-2.5 rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-40 disabled:hover:bg-slate-900 p-2.5 rounded-xl transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationManagement;
