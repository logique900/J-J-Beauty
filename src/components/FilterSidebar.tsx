import React, { useState, useMemo } from 'react';
import { FilterState, ProductColor, Product } from '../types';
import { X, ChevronDown, Check, Star } from 'lucide-react';
import { mockBrands } from '../data/navigation';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalResults: number;
  allProducts?: Product[];
}

export function FilterSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters, 
  totalResults, 
  allProducts = [],
  allBrands = [],
  allCategories = []
}: FilterSidebarProps & { allBrands?: any[], allCategories?: any[] }) {
  // Extract all available colors and sizes from allProducts
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    allProducts.forEach(p => p.sizes?.forEach(s => sizes.add(s)));
    return Array.from(sizes);
  }, [allProducts]);

  const availableColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    allProducts.forEach(p => p.colors?.forEach(c => colorMap.set(c.name, c.hex)));
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [allProducts]);

  const handleBrandToggle = (brandName: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brandName) 
        ? prev.brands.filter(b => b !== brandName)
        : [...prev.brands, brandName]
    }));
  };

  const handleCollectionToggle = (colId: string) => {
    setFilters(prev => ({
      ...prev,
      collections: prev.collections.includes(colId)
        ? prev.collections.filter(id => id !== colId)
        : [...prev.collections, colId]
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorToggle = (colorName: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter(c => c !== colorName)
        : [...prev.colors, colorName]
    }));
  };

  // Fake Histogram Data
  const histogramBars = [5, 12, 25, 40, 30, 15, 8, 4, 2, 1];
  const maxBar = Math.max(...histogramBars);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed lg:static top-0 right-0 z-[70] h-full w-[340px] max-w-[100vw] bg-white shadow-2xl lg:shadow-none border-l lg:border-l-0 lg:border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 lg:translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'
      }`}>
        
        {/* Header (Mobile mostly) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
          <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Quick switches */}
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">En stock uniquement</span>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-200">
                <input type="checkbox" className="sr-only" checked={filters.inStock} onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}/>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${filters.inStock ? 'translate-x-6 bg-black' : 'translate-x-1'}`} />
                <div className={`absolute inset-0 rounded-full transition-colors ${filters.inStock ? 'bg-black' : 'bg-gray-200'}`} />
                <span className={`absolute h-4 w-4 transform rounded-full bg-white transition-transform ${filters.inStock ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors text-red-600">Promotions</span>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-200">
                <input type="checkbox" className="sr-only" checked={filters.onSale} onChange={(e) => setFilters(prev => ({ ...prev, onSale: e.target.checked }))}/>
                <div className={`absolute inset-0 rounded-full transition-colors ${filters.onSale ? 'bg-red-500' : 'bg-gray-200'}`} />
                <span className={`absolute h-4 w-4 transform rounded-full bg-white transition-transform ${filters.onSale ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Prix</h3>
            
            <div className="flex items-end gap-1 h-12 mb-2">
               {histogramBars.map((val, i) => (
                 <div key={i} className="flex-1 bg-gray-200 rounded-t-sm" style={{ height: `${(val / maxBar) * 100}%` }}></div>
               ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">DT</span>
                <input 
                  type="number" 
                  min="0"
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: Number(e.target.value) }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-black focus:border-black"
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">DT</span>
                <input 
                  type="number" 
                  min="0"
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-black focus:border-black"
                />
              </div>
            </div>
            <input 
               type="range" 
               min="0" max="500" 
               value={filters.priceMax} 
               onChange={(e) => setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
               className="w-full mt-4 accent-black"
            />
          </div>

          {/* Brands */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Marques</h3>
            <div className="space-y-3">
              {(allBrands.length > 0 ? allBrands : mockBrands).map(brand => (
                <label key={brand.id} className="flex items-center group cursor-pointer">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                    filters.brands.includes(brand.name) ? 'bg-brand-900 border-brand-900 text-white' : 'border-gray-300 group-hover:border-brand-900'
                  }`}>
                    {filters.brands.includes(brand.name) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-brand-900 font-medium transition-colors">{brand.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Collections / Subcategories */}
          {allCategories.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Collections</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allCategories.map(cat => (
                  <div key={cat.id} className="space-y-2">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{cat.name}</p>
                    <div className="space-y-2 pl-2">
                      {cat.collections?.map((col: any) => (
                        <label key={col.id} className="flex items-center group cursor-pointer">
                           <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                            filters.collections.includes(col.id) ? 'bg-brand-900 border-brand-900 text-white' : 'border-gray-300 group-hover:border-brand-900'
                          }`}>
                            {filters.collections.includes(col.id) && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-brand-900 transition-colors">{col.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Tailles</h3>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`min-w-[3rem] px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    filters.sizes.includes(size)
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Couleurs</h3>
            <div className="flex flex-wrap gap-3">
              {availableColors.map(color => (
                <button
                  key={color.name}
                  onClick={() => handleColorToggle(color.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    filters.colors.includes(color.name)
                      ? 'border-black scale-110 shadow-sm'
                      : 'border-transparent hover:scale-110 shadow-sm'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {filters.colors.includes(color.name) && (
                    <span className="flex w-full h-full items-center justify-center mix-blend-difference text-white/80">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="border-t border-gray-100 pt-6 pb-20 lg:pb-0">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Note minimale</h3>
            <div className="space-y-2">
              {[4, 3, 2].map(rating => (
                <label key={rating} className="flex items-center group cursor-pointer">
                  <input 
                    type="radio" 
                    name="rating" 
                    className="w-4 h-4 border-gray-300 text-black focus:ring-black cursor-pointer"
                    checked={filters.minRating === rating}
                    onChange={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                  />
                  <div className="flex ml-3 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">& plus</span>
                </label>
              ))}
               <label className="flex items-center group cursor-pointer mt-2">
                  <input 
                    type="radio" 
                    name="rating" 
                    className="w-4 h-4 border-gray-300 text-black focus:ring-black cursor-pointer"
                    checked={filters.minRating === 0}
                    onChange={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                  />
                  <span className="ml-3 text-sm text-gray-600">Toutes les notes</span>
                </label>
            </div>
          </div>

        </div>

        {/* Footer actions (mobile only) */}
        <div className="lg:hidden absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 flex gap-3">
          <button 
            type="button" 
            onClick={() => setFilters({ priceMin: 0, priceMax: 1000, brands: [], sizes: [], colors: [], collections: [], inStock: false, onSale: false, minRating: 0 })}
            className="px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl w-1/3"
          >
            Effacer
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-black rounded-xl shadow-lg"
          >
            Voir {totalResults} résultats
          </button>
        </div>
      </div>
    </>
  );
}
