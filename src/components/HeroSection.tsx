import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { HeroSlide } from '../types';

export function HeroSection({ onExplore }: { onExplore: () => void }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slidesQuery = query(
      collection(db, 'hero-slides'), 
      where('status', '==', 'active'),
      orderBy('position', 'asc')
    );

    const unsub = onSnapshot(slidesQuery, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroSlide));
      setSlides(data);
      setLoading(false);
    }, (err) => {
      console.error("Hero slides sync error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => setCurrent(current === 0 ? slides.length - 1 : current - 1);
  const nextSlide = () => setCurrent(current === slides.length - 1 ? 0 : current + 1);

  if (loading) {
    return (
      <div className="w-full h-[75vh] min-h-[600px] bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-[#050505] group">
      <AnimatePresence mode="wait">
        <motion.div
           key={slides[current]?.id || current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img 
            src={slides[current].image} 
            alt={slides[current].title} 
            className="w-full h-full object-cover opacity-70" 
          />
          {/* Subtle gradient to ensure text readability but keeps it luxury dark */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-end pb-24 px-6 md:px-12 lg:px-24">
        <motion.div
          key={`text-${slides[current]?.id || current}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl text-white"
        >
          {slides[current].subtitle && (
            <p className="text-xs sm:text-sm font-sans font-semibold tracking-[0.2em] uppercase mb-6 opacity-80 text-orange-200">
              {slides[current].subtitle}
            </p>
          )}
          <h1 className="text-6xl sm:text-7xl lg:text-[7rem] font-serif font-light mb-8 leading-[0.9] tracking-tight">
            {slides[current].title}
          </h1>
          <button 
            onClick={onExplore}
            className="group/btn relative inline-flex items-center gap-4 px-8 py-4 border border-white/30 rounded-full hover:bg-white hover:text-black transition-colors duration-500 overflow-hidden"
          >
            <span className="text-xs font-sans tracking-[0.15em] uppercase font-bold relative z-10 transition-colors duration-500">
              {slides[current].cta || 'Découvrir'}
            </span>
            <div className="w-8 h-px bg-white group-hover/btn:bg-black transition-colors duration-500 relative z-10" />
          </button>
        </motion.div>
      </div>

      {slides.length > 1 && (
        <>
          {/* Navigation Controls */}
          <div className="absolute right-6 md:right-12 bottom-24 flex items-center gap-4">
            <button 
              onClick={prevSlide} 
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all duration-300 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            
            <button 
              onClick={nextSlide} 
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all duration-300 backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 -mr-0.5" />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute top-1/2 -translate-y-1/2 right-6 md:right-12 flex flex-col gap-3">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-1 transition-all duration-500 ${current === idx ? 'h-12 bg-white' : 'h-3 bg-white/30 hover:bg-white/60'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
