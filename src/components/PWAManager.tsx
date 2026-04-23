import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Bell, X, CheckCircle2 } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAManager() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("Notifications activées", {
          body: "Vous recevrez désormais les mises à jour de J&J Beauty.",
          icon: '/favicon.ico'
        });
      }
    }
  };

  const closeRefresh = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-[60] md:left-auto md:right-8 md:bottom-8 md:w-80"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-brand-100 p-5 overflow-hidden">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Download className="h-6 w-6 text-brand-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Installer l'application</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Installez J&J Beauty sur votre écran d'accueil pour une expérience optimale.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleInstall}
                      className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      Installer
                    </button>
                    <button
                      onClick={() => setShowInstallPrompt(false)}
                      className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Plus tard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(offlineReady || needRefresh) && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-4 right-4 z-[70] md:top-24 md:max-w-md md:mx-auto"
          >
            <div className="bg-brand-900 text-white rounded-xl shadow-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {offlineReady ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <RefreshCcw className="h-5 w-5 text-brand-300 animate-spin" />
                )}
                <p className="text-sm font-medium">
                  {offlineReady
                    ? 'Application prête pour le mode hors-ligne'
                    : 'Nouvelle version disponible'}
                </p>
              </div>
              <div className="flex gap-2">
                {needRefresh && (
                  <button
                    onClick={() => updateServiceWorker(true)}
                    className="px-3 py-1.5 bg-white text-brand-900 text-xs font-bold rounded-lg"
                  >
                    Mettre à jour
                  </button>
                )}
                <button onClick={closeRefresh} className="p-1 text-white/60 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {notificationPermission === 'default' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-24 right-4 z-40 hidden md:block"
          >
            <button
              onClick={requestNotificationPermission}
              className="h-12 w-12 bg-white rounded-full shadow-lg border border-brand-100 flex items-center justify-center group relative overflow-hidden"
              aria-label="Activer les notifications"
            >
              <div className="absolute inset-0 bg-brand-50 translate-y-full group-hover:translate-y-0 transition-transform" />
              <Bell className="h-6 w-6 text-brand-600 relative z-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
