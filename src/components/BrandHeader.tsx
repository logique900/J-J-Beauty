import React from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowLeft, Package } from 'lucide-react';
import { Brand } from '../types';

interface BrandHeaderProps {
  brand: Brand;
  productCount: number;
  onBack: () => void;
}

export function BrandHeader({ brand, productCount, onBack }: BrandHeaderProps) {
  return (
    <div className="relative mb-12">
      {/* Brand Hero/Banner Section */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-3xl group shadow-2xl">
        {brand.bannerUrl ? (
          <img 
            src={brand.bannerUrl} 
            alt={brand.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900 to-brand-700" />
        )}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {brand.logoUrl ? (
              <img 
                src={brand.logoUrl} 
                alt={brand.name} 
                className="h-20 md:h-24 object-contain mb-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl"
              />
            ) : (
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-lg tracking-wider italic">
                {brand.name}
              </h1>
            )}
            
            <p className="max-w-2xl text-brand-50 text-sm md:text-base leading-relaxed opacity-90 drop-shadow">
              {brand.description || "Découvrez l'élégance et l'innovation à travers notre sélection exclusive de produits."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {brand.website && (
                <a 
                  href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-white text-brand-900 rounded-full font-bold text-sm hover:bg-brand-50 transition-colors shadow-lg"
                >
                  <Globe className="w-4 h-4" /> Site Officiel
                </a>
              )}
               <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-full font-bold text-sm hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Toutes les marques
              </button>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-brand-900/40 backdrop-blur-md text-white border border-brand-400/30 rounded-full font-bold text-sm">
                <Package className="w-4 h-4 text-brand-300" /> {productCount} Produits
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Breadcrumb or Badge */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border border-brand-100 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-brand-900 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-900 leading-none">
          Espace Exclusif {brand.name}
        </span>
      </div>
    </div>
  );
}
