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
    <section className="py-24 sm:py-32 bg-white dark:bg-brand-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-sans tracking-[0.2em] font-semibold uppercase text-brand-500 dark:text-brand-600 mb-4"
            >
              Nos Partenaires
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-brand-950 dark:text-brand-900 tracking-tight leading-none"
            >
              Marques <br/><span className="italic opacity-70">Prestigieuses</span>
            </motion.h2>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex shrink-0"
          >
             <button className="text-xs font-bold uppercase tracking-[0.15em] border-b border-brand-950 dark:border-brand-900 pb-1 text-brand-950 dark:text-brand-900 hover:text-brand-600 dark:hover:text-brand-700 hover:border-brand-600 dark:hover:border-brand-700 transition-colors">
               Explorer toutes
             </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ delay: index * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onNavigateToBrand(brand.id)}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div className="relative w-32 h-32 mb-6 rounded-full border border-[#E4E3E0] dark:border-brand-300 bg-[#F9F9F8] dark:bg-brand-100 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-black dark:group-hover:border-brand-900 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {brand.logoUrl ? (
                  <img 
                    src={brand.logoUrl} 
                    alt={brand.name} 
                    className="w-[60%] h-[60%] object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-[0.16,1,0.3,1] dark:invert dark:group-hover:invert-0" 
                  />
                ) : (
                  <div className="text-2xl font-serif font-light text-black/40 dark:text-brand-900/40 group-hover:text-black dark:group-hover:text-brand-900 transition-colors uppercase tracking-widest">
                    {brand.name.substring(0, 2)}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-black dark:text-brand-900 uppercase tracking-[0.15em] mb-1">
                  {brand.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-brand-600 font-medium">
                  {getProductCount(brand.id, brand.name)} PRODUITS
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
