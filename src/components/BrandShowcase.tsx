import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
}

interface BrandShowcaseProps {
  brands: any[];
  products: any[];
  onNavigateToBrand: (id: string) => void;
}

export function BrandShowcase({ brands, products, onNavigateToBrand }: BrandShowcaseProps) {
  if (brands.length === 0) return null;

  const getProductCount = (brandId: string, brandName: string) => {
    return products.filter(p => p.brandId === brandId || p.brand === brandName).length;
  };

  return (
    <section className="py-20 bg-brand-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-2"
            >
              Nos Marques Partenaires
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-brand-600 max-w-lg"
            >
              Nous sélectionnons avec soin les marques les plus prestigieuses pour vous offrir l'excellence en beauté.
            </motion.p>
          </div>
          <button 
            className="flex items-center gap-2 text-brand-900 font-bold hover:gap-3 transition-all"
            onClick={() => {
              // Maybe scroll to a full brands list or filters?
              // For now we'll just have this as a header decoration or action
            }}
          >
            Voir toutes les marques <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigateToBrand(brand.id)}
              className="group bg-white rounded-2xl p-6 flex flex-col items-center justify-center border border-brand-100 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all cursor-pointer aspect-square"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {brand.logoUrl ? (
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="max-w-full max-h-[70%] object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" 
                  />
                ) : (
                  <div className="text-2xl font-serif font-bold text-brand-300 group-hover:text-brand-900 transition-colors uppercase letter tracking-widest">
                    {brand.name.substring(0, 2)}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/5 rounded-xl transition-colors duration-300" />
                
                {/* Product Count Badge */}
                <div className="absolute top-0 right-0 bg-brand-100 text-brand-900 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm border border-brand-200">
                  {getProductCount(brand.id, brand.name)} Produits
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-brand-400 group-hover:text-brand-900 uppercase tracking-widest transition-colors">
                {brand.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
