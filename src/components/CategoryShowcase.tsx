import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const categories = [
  { 
    id: 'c-maq-teint', 
    name: 'Le Teint', 
    subtitle: 'Fonds de teint, poudres & correcteurs', 
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=800',
    className: 'col-span-1 md:col-span-4 row-span-2'
  },
  { 
    id: 'c-soin-visage', 
    name: 'Soins Visage', 
    subtitle: 'L\'éclat au quotidien', 
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
    className: 'col-span-1 md:col-span-8 row-span-2'
  },
  { 
    id: 'c-maq-yeux', 
    name: 'Le Regard', 
    subtitle: 'Mascaras & Fards', 
    image: 'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&q=80&w=800',
    className: 'col-span-1 md:col-span-4 row-span-2'
  },
  { 
    id: 'c-maq-levres', 
    name: 'Les Lèvres', 
    subtitle: 'Rouges intenses & Gloss', 
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=800',
    className: 'col-span-1 md:col-span-4 row-span-2'
  },
  { 
    id: 'c-soin-corps', 
    name: 'Soins Corps', 
    subtitle: 'Hydratation & Douceur', 
    image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=800',
    className: 'col-span-1 md:col-span-4 row-span-2'
  },
];

interface CategoryShowcaseProps {
  onNavigateToCategory: (id: string) => void;
}

export function CategoryShowcase({ onNavigateToCategory }: CategoryShowcaseProps) {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-brand-900 mb-4"
          >
            Explorez Nos Collections
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: '80px' }}
            viewport={{ once: true }}
            className="h-1 bg-brand-900 mx-auto rounded-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-[240px] gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              onClick={() => onNavigateToCategory(category.id)}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 ${category.className}`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-white/80 text-sm font-medium tracking-wider uppercase block mb-1">
                    {category.subtitle}
                  </span>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white">
                      {category.name}
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-100">
                      <ArrowRight className="w-5 h-5 text-white" />
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
