import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=2000',
    title: 'Bienvenue chez J&J Beauty',
    subtitle: 'L\'excellence cosmétique à votre portée. Révélez votre beauté naturelle avec notre collection exclusive.',
    cta: 'Découvrir la collection'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=2000',
    title: 'Nouveautés Maquillage',
    subtitle: 'Des teintes éclatantes et des textures inédites pour sublimer votre visage au quotidien.',
    cta: 'Voir les nouveautés'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=2000',
    title: 'Rituels de Soin',
    subtitle: 'Prenez du temps pour vous avec notre gamme de soins relaxants, hydratants et purifiants.',
    cta: 'Explorer les soins'
  }
];

export function HeroSection({ onExplore }: { onExplore: () => void }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => setCurrent(current === 0 ? slides.length - 1 : current - 1);
  const nextSlide = () => setCurrent(current === slides.length - 1 ? 0 : current + 1);

  return (
    <div className="relative w-full h-[60vh] min-h-[450px] overflow-hidden bg-brand-950 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img 
            src={slides[current].image} 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-80" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
        <motion.div
          key={`text-${current}`}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-xl text-white"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4 drop-shadow-lg leading-tight">
            {slides[current].title}
          </h1>
          <p className="text-lg sm:text-xl font-medium mb-8 text-gray-200 drop-shadow-md">
            {slides[current].subtitle}
          </p>
          <button 
            onClick={onExplore}
            className="px-8 py-3 bg-white text-brand-950 font-bold rounded-full hover:bg-brand-50 transition shadow-xl hover:-translate-y-0.5"
          >
            {slides[current].cta}
          </button>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <button 
        onClick={prevSlide} 
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition shadow-lg border border-white/20"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button 
        onClick={nextSlide} 
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 opacity-0 group-hover:opacity-100 transition shadow-lg border border-white/20"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${current === idx ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/80'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
