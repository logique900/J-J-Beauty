import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function WhatsAppWidget() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.whatsappNumber) {
            setPhoneNumber(data.whatsappNumber);
          }
          if (data.whatsappEnabled !== undefined) {
            setEnabled(data.whatsappEnabled);
          }
        }
      } catch (err) {
        console.error('Failed to fetch whatsapp settings:', err);
      }
    }
    fetchSettings();
  }, []);

  // Use a default number if not configured in settings, but we can also hide if no number
  const finalNumber = phoneNumber || '21612345678'; // Default mock number
  const message = encodeURIComponent('Bonjour J&J Beauty ! J\'ai une question concernant vos produits.');
  const whatsappUrl = `https://wa.me/${finalNumber}?text=${message}`;

  if (!enabled) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
      aria-label="Discuter sur WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-7 h-7"
      >
        <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.274-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.062-.301-.15-1.265-.464-2.411-1.485-.893-.794-1.498-1.775-1.672-2.072-.175-.295-.018-.456.133-.604.133-.133.3-.346.449-.52.149-.174.199-.298.298-.497.101-.197.05-.371-.025-.52-.075-.149-.672-1.62-.922-2.218-.243-.585-.487-.504-.672-.513-.174-.008-.374-.01-.574-.01-.198 0-.523.074-.797.371-.274.296-1.046 1.02-1.046 2.486s1.07 2.876 1.219 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.767-.721 2.016-1.42.249-.696.249-1.293.174-1.42-.074-.124-.272-.198-.57-.347z"></path>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.764.453 3.42 1.24 4.88L2 22l5.305-1.155A9.957 9.957 0 0012 22z"></path>
      </svg>
      {/* Tooltip */}
      <span className="absolute right-full mr-4 bg-white text-brand-900 text-sm font-bold py-2 px-4 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Besoin d'aide ?
      </span>
    </a>
  );
}
