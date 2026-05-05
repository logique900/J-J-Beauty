import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  status: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
  onNavigateToCategory: (id: string) => void;
}

export function CategoryShowcase({ categories, onNavigateToCategory }: CategoryShowcaseProps) {
  // If no dynamic categories, we can show a placeholder or nothing, 
  // but usually we'll have the seeded ones.
  // We take the first 5 active categories for the grid layout
  const displayCategories = categories
    .filter(c => c.status === 'Actif')
    .slice(0, 5)
    .map((c, index) => ({
      ...c,
      subtitle: c.subtitle || c.description || 'Collection',
      image: c.coverImage || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=800',
      className: index === 0 ? 'col-span-1 md:col-span-8 row-span-2' : 'col-span-1 md:col-span-4 row-span-2'
    }));

  if (displayCategories.length === 0) return null;

  return (
    <section className="py-24 sm:py-32 bg-[#F9F9F8] dark:bg-brand-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-sans tracking-[0.2em] font-semibold uppercase text-brand-500 dark:text-brand-600 mb-4"
            >
              Curated Selection
            </motion.p>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-brand-950 dark:text-brand-900 tracking-tight leading-none"
            >
              Collections <br/><span className="italic opacity-70">Iconiques</span>
            </motion.h2>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex shrink-0"
          >
             <button className="text-xs font-bold uppercase tracking-[0.15em] border-b border-brand-950 dark:border-brand-900 text-brand-950 dark:text-brand-900 pb-1 hover:text-brand-600 dark:hover:text-brand-700 hover:border-brand-600 dark:hover:border-brand-700 transition-colors">
               Tout voir
             </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[300px] gap-2">
          {displayCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onNavigateToCategory(category.id)}
              className={`relative overflow-hidden group cursor-pointer bg-white ${category.className}`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-105"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              
              {/* Subtle Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]">
                  <p className="text-[#F9F9F8] text-[10px] font-bold tracking-[0.2em] uppercase block mb-3 opacity-80">
                    {category.subtitle}
                  </p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl lg:text-4xl font-serif font-light text-white tracking-tight leading-none">
                      {category.name}
                    </h3>
                    <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-100 ease-[0.16,1,0.3,1] backdrop-blur-sm">
                      <ArrowRight className="w-5 h-5 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
