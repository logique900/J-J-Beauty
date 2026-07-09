import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, XCircle, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markAsRead, markAllAsRead, deleteNotification, AppNotification } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotificationCenter() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, !!isAdmin, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => setIsOpen(!isOpen);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Check className="w-4 h-4" /></div>;
      case 'warning': return <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>;
      case 'error': return <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle className="w-4 h-4" /></div>;
      default: return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Info className="w-4 h-4" /></div>;
    }
  };

  const getTimeStr = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (e) {
      return '';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-1 text-[#5A312F] dark:text-brand-800 hover:opacity-70 transition"
      >
        <Bell strokeWidth={1.5} className="w-[22px] h-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#5B3331] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#fcf9f9] dark:border-brand-100">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-brand-50 rounded-2xl shadow-2xl border border-brand-100 dark:border-brand-200 z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-brand-100 dark:border-brand-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-900 uppercase tracking-widest px-1">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead(notifications)}
                  className="text-[10px] font-bold text-accent-600 hover:text-accent-700 uppercase tracking-wider"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b border-brand-50 dark:border-brand-100 transition-colors hover:bg-gray-50 dark:hover:bg-brand-100 relative group ${!notification.read ? 'bg-accent-50/30' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 pt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-bold text-brand-900 truncate pr-4 ${!notification.read ? 'font-extrabold' : 'font-bold'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-accent-500 rounded-full shrink-0" />
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-brand-800 line-clamp-2 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                            {getTimeStr(notification.createdAt)}
                          </span>
                          {notification.link && (
                            <a 
                              href={notification.link}
                              className="text-[10px] font-bold text-brand-900 flex items-center gap-1 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              Détails <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-brand-100 text-center border-t border-brand-100 dark:border-brand-200">
               <button className="text-[10px] font-bold text-brand-500 uppercase tracking-widest hover:text-brand-900 transition-colors">
                Voir toutes les notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
