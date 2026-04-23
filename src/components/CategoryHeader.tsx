import React from 'react';
import { Category } from '../types';

interface CategoryHeaderProps {
  category: Category;
  selectedCollectionIds: string[];
  onToggleCollection: (collectionId: string) => void;
  onClearCollections: () => void;
}

export function CategoryHeader({ category, selectedCollectionIds, onToggleCollection, onClearCollections }: CategoryHeaderProps) {
  const hasCollections = category.collections && category.collections.length > 0;

  return (
    <div className={`relative border-b border-brand-100 py-16 mb-8 overflow-hidden ${!category.coverImage ? 'bg-brand-50' : 'bg-brand-900'}`}>
      {category.coverImage && (
        <>
          <img src={category.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" alt="" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 to-transparent"></div>
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <h1 className={`text-3xl md:text-5xl font-serif font-bold mb-4 ${category.coverImage ? 'text-white' : 'text-brand-950'}`}>{category.name}</h1>
        {category.description && (
          <p className={`max-w-2xl mx-auto mb-8 ${category.coverImage ? 'text-brand-100' : 'text-brand-700'}`}>{category.description}</p>
        )}
        
        {hasCollections && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={onClearCollections}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${selectedCollectionIds.length === 0 ? 'bg-brand-900 text-white border border-brand-900' : (category.coverImage ? 'bg-white/10 text-white border border-white/20 hover:border-white' : 'bg-white text-brand-700 border border-brand-200 hover:border-brand-900')}`}
            >
              Toutes les collections
            </button>
            {category.collections!.map(col => {
              const isSelected = selectedCollectionIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => onToggleCollection(col.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                    isSelected 
                      ? 'bg-brand-900 text-white border border-brand-900' 
                      : (category.coverImage 
                          ? 'bg-white/10 text-white border border-white/20 hover:border-white' 
                          : 'bg-white text-brand-700 border border-brand-200 hover:border-brand-500')
                  }`}
                >
                  {col.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
