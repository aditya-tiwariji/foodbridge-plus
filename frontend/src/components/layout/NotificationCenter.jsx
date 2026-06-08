import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Bell, X, Info, Check, MapPin, AlertCircle, Eye } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const dropdownRef = useRef(null);

  // Load user-specific notifications from localStorage on mount
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`fb_notifs_${user.id || user._id}`);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse notifications storage:', err);
      }
    }
  }, [user]);

  // Persist notifications on change
  const saveNotifications = (updatedList) => {
    setNotifications(updatedList);
    if (user) {
      localStorage.setItem(`fb_notifs_${user.id || user._id}`, JSON.stringify(updatedList));
    }
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const addNotif = (notif) => {
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        read: false,
        timestamp: new Date(),
        ...notif
      };

      saveNotifications((prev) => [newNotif, ...prev]);
      setActiveToast(newNotif);

      // Auto fade toast after 4.5 seconds
      setTimeout(() => {
        setActiveToast((current) => (current?.id === newNotif.id ? null : current));
      }, 4500);
    };

    // 1. NGO receives new donation listing alerts (memory sync only)
    socket.on('donation_created', (data) => {
      window.dispatchEvent(new CustomEvent('fb_donation_created', { detail: data }));
    });

    // 2. Donor receives claim acceptances
    socket.on('donation_accepted', (data) => {
      addNotif({
        title: 'Food Donation Claimed',
        message: `NGO "${data.ngoName}" has accepted your donation of "${data.foodName}".`,
        type: 'accepted',
        link: `/donations/${data.donationId}`
      });

      window.dispatchEvent(new CustomEvent('fb_donation_status_changed', { detail: data }));
    });

    // 2b. Donor receives pickup start notification
    socket.on('donation_transit_started', (data) => {
      addNotif({
        title: 'NGO Started Pickup',
        message: `NGO "${data.ngoName}" has started pickup for your donation "${data.foodName}".`,
        type: 'transit_started',
        link: `/donations/${data.donationId}`
      });

      window.dispatchEvent(new CustomEvent('fb_donation_status_changed', { detail: data }));
    });

    // 3. Donor receives pickup notification (memory sync only)
    socket.on('donation_picked_up', (data) => {
      window.dispatchEvent(new CustomEvent('fb_donation_status_changed', { detail: data }));
    });

    // 4. Donor receives delivery confirmation
    socket.on('donation_delivered', (data) => {
      addNotif({
        title: 'Food Donation Delivered',
        message: `NGO "${data.ngoName}" marked your donation "${data.foodName}" as delivered.`,
        type: 'delivered',
        link: `/donations/${data.donationId}`
      });

      window.dispatchEvent(new CustomEvent('fb_donation_status_changed', { detail: data }));
    });

    // 5. Donor receives claim cancellation
    socket.on('claim_cancelled', (data) => {
      addNotif({
        title: 'Claim Cancelled',
        message: `The claim on your donation of "${data.foodName}" was cancelled by ${data.ngoName}.`,
        type: 'cancelled',
        link: `/donations/${data.donationId}`
      });

      window.dispatchEvent(new CustomEvent('fb_donation_status_changed', { detail: data }));
    });

    // 6. Donor receives donation expired notification
    socket.on('donation_expired', (data) => {
      addNotif({
        title: 'Donation Expired',
        message: `Your donation listing for "${data.foodName}" has expired.`,
        type: 'expired',
        link: `/donations/${data.donationId}`
      });

      window.dispatchEvent(new CustomEvent('fb_donation_status_changed', { detail: data }));
    });

    return () => {
      socket.off('donation_created');
      socket.off('donation_accepted');
      socket.off('donation_transit_started');
      socket.off('donation_picked_up');
      socket.off('donation_delivered');
      socket.off('claim_cancelled');
      socket.off('donation_expired');
    };
  }, [socket, user]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    const updated = notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
    saveNotifications(updated);
    setIsOpen(false);
    
    // Redirect if link exists
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'accepted':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'transit_started':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'expired':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 focus:outline-none transition-colors border border-transparent hover:border-slate-100"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-3 duration-150">
          <div className="px-4 py-3 flex justify-between items-center bg-slate-50">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-primary-600 hover:underline uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex gap-3 text-left hover:bg-slate-50 cursor-pointer transition-colors relative ${
                    !notif.read ? 'bg-slate-50/50 font-medium' : ''
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border h-fit ${getTypeStyle(notif.type)}`}>
                    <Info className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-slate-355 hover:text-red-500 p-0.5 rounded transition-colors"
                        aria-label="Delete notification"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-2xs text-slate-500 mt-1 leading-normal break-words">{notif.message}</p>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1.5 block">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!notif.read && (
                    <span className="absolute right-3 bottom-3 h-1.5 w-1.5 bg-primary-600 rounded-full" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-450">
                <Bell className="h-10 w-10 text-slate-300 stroke-1 mb-2" />
                <span className="text-xs font-bold">All caught up!</span>
                <span className="text-[10px] text-slate-400 mt-0.5">No recent notifications received.</span>
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary-600 hover:text-primary-500 transition-colors block py-0.5"
            >
              View Historical Notifications Log
            </Link>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Banner */}
      {activeToast && (
        <div className="fixed top-6 right-6 z-50 w-full max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 animate-in slide-in-from-top-6 duration-200">
          <div className="flex gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl h-fit">
              <Check className="h-5 w-5" />
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start gap-1">
                <p className="text-xs font-bold text-slate-200">{activeToast.title}</p>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal break-words">{activeToast.message}</p>
              
              {activeToast.link && (
                <button
                  onClick={() => {
                    navigate(activeToast.link);
                    setActiveToast(null);
                  }}
                  className="mt-2.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider"
                >
                  <Eye className="h-3 w-3" /> View Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
