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
      className={`group relative flex bg-brand-50 rounded-xl overflow-hidden shadow-sm border border-brand-200 dark:border-brand-300 hover:shadow-md transition-shadow duration-300 ${
        isList ? 'flex-row' : 'flex-col'
      }`}
    >
      {/* Image Container */}
      <div 
        className={`relative bg-brand-100 dark:bg-brand-200 overflow-hidden shrink-0 ${
          isList ? 'w-48 sm:w-64 h-full aspect-[3/4]' : 'w-full aspect-[3/4]'
        }`}
      >
        <img
          src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/800'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
        />
        {product.images?.[1] && (
          <img
            src={product.images?.[1]}
            alt={`${product.name} vue alternative`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100"
          />
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {isNew && (
            <span className="px-2 py-1 text-xs font-semibold tracking-wider text-white bg-green-500 rounded-sm">
              NOUVEAU
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="px-2 py-1 text-xs font-bold tracking-wider text-white bg-red-500 rounded-sm">
              -{discountPercentage}%
            </span>
          )}
          {product.isPopular && (
            <span className="px-2 py-1 text-xs font-semibold tracking-wider text-white bg-indigo-500 rounded-sm">
              POPULAIRE
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
           {product.stock === 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-900 text-white rounded-sm">
              RUPTURE
            </span>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="px-2 py-1 text-xs font-medium bg-orange-500 text-white rounded-sm">
              Dernières pièces
            </span>
          )}
        </div>

        {/* Quick View Button (Desktop) */}
        <button
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out bg-brand-50/95 dark:bg-brand-900/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-brand-950 dark:text-white flex items-center gap-2 hover:bg-brand-900 dark:hover:bg-brand-800 hover:text-white"
        >
          <Eye className="w-4 h-4" />
          <span>Aperçu rapide</span>
        </button>
      </div>

      {/* Details Container */}
      <div className={`flex flex-col flex-grow dark:bg-brand-100 ${isList ? 'p-6 justify-center' : 'p-4'}`}>
        {/* Mobile Quick view trigger */}
        <button 
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute inset-0 z-10 sm:hidden"
          aria-label="Aperçu rapide"
        />

        <div className="mb-1 text-sm text-brand-500 flex items-center gap-1">
          <Star className="w-4 h-4 fill-accent-500 text-accent-500" />
          <span className="font-medium text-brand-900">{product.rating}</span>
          <span>({product.reviewsCount})</span>
        </div>

        <h3 className="text-base font-serif font-semibold text-brand-950 dark:text-brand-900 mb-1 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        {isList && (
          <p className="text-sm text-brand-700 dark:text-brand-800 mb-4 line-clamp-2 hidden sm:block">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-900">
              {product.price.toFixed(2)} DT
            </span>
            {product.originalPrice && (
              <span className="text-sm text-brand-400 line-through">
                {product.originalPrice.toFixed(2)} DT
              </span>
            )}
          </div>
          
          {isList && (
            <button
              disabled={product.stock === 0}
              onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
              className="relative z-20 hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg font-medium hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
