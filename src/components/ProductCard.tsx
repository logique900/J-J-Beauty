import React from 'react';
import { Product, ViewMode } from '../types';
import { Star, ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  viewMode: ViewMode;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, viewMode, onQuickView }: ProductCardProps) {
  const isList = viewMode === 'list';
  const isNew = (new Date().getTime() - new Date(product.dateAdded).getTime()) / (1000 * 3600 * 24) <= 14;
  const discountPercentage = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  
  const { addToCart } = useCart();

  return (
    <div
      className={`group relative flex bg-transparent transition-all duration-500 rounded-xl hover:shadow-lg p-3 ${
        isList ? 'flex-row gap-6 items-center' : 'flex-col'
      }`}
    >
      {/* Image Container */}
      <div 
        className={`relative overflow-hidden shrink-0 bg-[#F5F5F3] dark:bg-brand-100 dark:brightness-95 rounded-lg ${
          isList ? 'w-48 sm:w-64 h-full aspect-[3/4]' : 'w-full aspect-square sm:aspect-[3/4]'
        }`}
      >
        <img
          src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/800'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-105"
        />
        {product.images?.[1] && (
          <div className="absolute inset-0 bg-[#F5F5F3] dark:bg-brand-100 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[0.16,1,0.3,1]">
            <img
              src={product.images?.[1]}
              alt={`${product.name} vue alternative`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-105"
            />
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
          {isNew && (
            <span className="px-2 py-1 text-[9px] font-bold tracking-[0.15em] text-black bg-white/90 backdrop-blur-sm uppercase">
              Nouveau
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="px-2 py-1 text-[9px] font-bold tracking-[0.15em] text-white bg-black/90 backdrop-blur-sm uppercase">
              -{discountPercentage}%
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
           {product.stock === 0 && (
            <span className="px-2 py-1 text-[9px] font-bold tracking-[0.15em] text-white bg-red-600/90 backdrop-blur-sm uppercase">
              Épuisé
            </span>
          )}
        </div>

        {/* Quick View Button (Desktop) */}
        <button
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[0.16,1,0.3,1] bg-black/80 backdrop-blur-md px-4 py-4 text-xs tracking-widest uppercase font-bold text-white flex items-center justify-center gap-2 hover:bg-black z-20"
        >
          <Eye className="w-4 h-4" />
          Aperçu
        </button>
      </div>

      {/* Details Container */}
      <div className={`flex flex-col flex-grow ${isList ? 'py-4 justify-center' : 'pt-4 pb-2'}`}>
        {/* Mobile Quick view trigger */}
        <button 
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute inset-0 z-10 sm:hidden"
          aria-label="Aperçu rapide"
        />

        <div className="flex items-center justify-between mb-1.5">
          {product.brand && (
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-brand-600">
              {product.brand}
            </span>
          )}
        </div>

        <h3 className="text-xs sm:text-[15px] font-serif font-medium text-black dark:text-brand-900 mb-1 leading-snug line-clamp-2">
          {product.name}
        </h3>
        
        {isList && (
          <p className="text-sm text-gray-600 dark:text-brand-700 mb-4 line-clamp-2 hidden sm:block font-serif italic">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-black dark:text-brand-900">
              {product.price.toFixed(2)} DT
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 dark:text-brand-600 line-through">
                {product.originalPrice.toFixed(2)} DT
              </span>
            )}
          </div>
          
          <button
            disabled={product.stock === 0}
            onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
            className={`relative z-20 flex w-full items-center justify-center gap-2 px-4 py-2 bg-transparent border border-gray-200 dark:border-brand-300 rounded-lg text-black dark:text-brand-900 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] hover:border-black dark:hover:border-brand-900 hover:bg-black dark:hover:bg-brand-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
          >
             <ShoppingBag className="w-3.5 h-3.5" />
             Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
