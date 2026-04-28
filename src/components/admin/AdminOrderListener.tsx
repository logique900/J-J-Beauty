import React, { useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast';

export function AdminOrderListener() {
  const { isAdmin } = useAuth();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!isAdmin) return;

    // Listen to the most recent orders
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      // Don't alert on the initial load of existing orders
      if (!isFirstLoad.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const time = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            
            // Re-verify that it's a recent order (within the last 5 minutes)
            // to avoid anomalous notifications if cache clears or connection drops
            if (Date.now() - time.getTime() < 5 * 60 * 1000) {
              const customerName = data.customerName || data.customerEmail || 'Un client';
              const amount = data.totalAmount ? data.totalAmount.toFixed(2) : '0.00';
              
              toast.success(`🔔 Nouvelle commande de ${customerName} (${amount} DT)`);
              
              // Play a generic notification sound without needing external assets
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                  const ctx = new AudioContextClass();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
                  
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                  
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.5);
                }
              } catch (e) {
                console.log('Audio disabled', e);
              }
            }
          }
        });
      }
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, [isAdmin]);

  return null; // This component is strictly for logic/listening
}
