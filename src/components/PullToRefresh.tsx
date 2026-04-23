import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { RefreshCcw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const threshold = 100;
  const containerRef = useRef<HTMLDivElement>(null);

  const pullProgress = Math.min(Math.max(currentY - startY, 0), threshold * 1.5);
  const opacity = pullProgress / threshold;
  const rotation = (pullProgress / threshold) * 180;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].pageY);
        setPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const y = e.touches[0].pageY;
      setCurrentY(y);

      if (y > startY && window.scrollY === 0) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;
      
      const pulledDistance = currentY - startY;
      if (pulledDistance > threshold && !refreshing) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }

      setPulling(false);
      setStartY(0);
      setCurrentY(0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [pulling, startY, currentY, refreshing, onRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-hidden min-h-screen">
      <motion.div
        style={{ height: pullProgress }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden bg-brand-50"
      >
        <div className="flex flex-col items-center">
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: rotation }}
            transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            {refreshing ? (
              <RefreshCcw className="h-6 w-6 text-brand-600" />
            ) : (
              <ArrowDown className="h-6 w-6 text-brand-400" />
            )}
          </motion.div>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: opacity > 0.5 ? 1 : 0 }}
            className="text-[10px] font-bold text-brand-600 mt-1 uppercase tracking-widest"
          >
            {refreshing ? 'Mise à jour...' : (pullProgress > threshold ? 'Relâcher pour rafraîchir' : 'Tirer pour rafraîchir')}
          </motion.span>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: refreshing ? 60 : pullProgress / 1.5 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
