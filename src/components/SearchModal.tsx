import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Mic, Camera, Clock, TrendingUp, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { mockCategories, mockBrands } from '../data/navigation';
import { Product, Category, Brand } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProduct: (id: string) => void;
  onNavigateToCategory: (id: string) => void;
  onNavigateToBrand: (id: string) => void;
  categories?: any[];
  products?: any[];
}

const TRENDING_SEARCHES = ['Sérum', 'Crème hydratante', 'Nettoyant', 'Mascara'];

// Simple fuzzy matching helper
const normalize = (str: string) => 
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function SearchModal({ 
  isOpen, 
  onClose, 
  onNavigateToProduct, 
  onNavigateToCategory, 
  onNavigateToBrand,
  categories = [],
  products = []
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>(['Sérum Visage', 'Masque']);
  const [results, setResults] = useState<{ products: any[], categories: any[], brands: Brand[] } | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Handle Cmd/Ctrl K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);
  
  // Mock search logic
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => {
      const q = normalize(query);
      
      const searchProducts = products || [];
      const searchCategories = (categories?.length || 0) > 0 ? categories : mockCategories;

      const filteredProducts = searchProducts.filter(p => 
        normalize(p.name).includes(q) || 
        normalize(p.description || '').includes(q) || 
        (p.brand && normalize(p.brand).includes(q))
      ).slice(0, 4);

      // Search flattened categories
      const allCats: any[] = [];
      const flattenCategories = (cats: any[]) => {
        cats.forEach(c => {
          allCats.push(c);
          if (c.subcategories) flattenCategories(c.subcategories);
        });
      };
      flattenCategories(searchCategories);
      const filteredCategories = allCats.filter(c => normalize(c.name).includes(q)).slice(0, 3);

      const filteredBrands = mockBrands.filter(b => normalize(b.name).includes(q)).slice(0, 2);

      setResults({ products: filteredProducts, categories: filteredCategories, brands: filteredBrands });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, products, categories]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !history.includes(query.trim())) {
      setHistory(prev => [query.trim(), ...prev].slice(0, 10)); // Keep max 10
    }
    // Navigate logic could go here based on results
  };

  const removeItem = (item: string) => {
    setHistory(prev => prev.filter(i => i !== item));
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }
    setIsListening(true);
    // Mocking voice behavior for safety in iframe
    setTimeout(() => {
      setQuery("Veste d'hiver");
      setIsListening(false);
    }, 1500);
  };

  const handleVisualSearch = () => {
    // Mock file input trigger
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      // Mock processing
      setQuery('Visual match: motif à rayures');
    };
    input.click();
  };

  if (!isOpen) return null;

  const hasNoResults = results && (results.products?.length || 0) === 0 && (results.categories?.length || 0) === 0 && (results.brands?.length || 0) === 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full sm:h-auto sm:max-w-3xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Search Header */}
          <form onSubmit={handleSearchSubmit} className="flex items-center px-4 sm:px-6 py-4 border-b border-gray-100 bg-white">
            <Search className="w-6 h-6 text-gray-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 text-lg sm:text-2xl font-light outline-none bg-transparent placeholder:text-gray-300"
              placeholder="Que recherchez-vous ?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            <div className="flex items-center gap-2 shrink-0 ml-4">
               {query && (
                 <button type="button" onClick={() => setQuery('')} className="p-2 text-gray-400 hover:text-black">
                   <X className="w-5 h-5" />
                 </button>
               )}
               <button 
                type="button" 
                onClick={startVoiceSearch}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                title="Recherche vocale"
              >
                 <Mic className="w-5 h-5" />
               </button>
               <button 
                type="button"
                onClick={handleVisualSearch}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-colors hidden sm:block"
                title="Recherche par image"
              >
                 <Camera className="w-5 h-5" />
               </button>
               <button type="button" onClick={onClose} className="p-2 ml-2 sm:ml-4 text-gray-900 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 sm:hidden">
                 Fermer
               </button>
               <button type="button" onClick={onClose} className="hidden sm:flex items-center justify-center p-2 text-gray-400 hover:text-black ml-2 bg-gray-50 rounded-lg text-xs font-mono">
                 ESC
               </button>
            </div>
          </form>

          {/* Search Body */}
          <div className="flex-1 overflow-y-auto min-h-[400px] sm:max-h-[60vh] bg-gray-50/50">
            {query.length < 2 && !results && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Historique */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4"/> Recherches récentes</h3>
                      <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-black underline">Tout effacer</button>
                    </div>
                    <ul className="space-y-2">
                      {history.map((item, idx) => (
                        <li key={idx} className="group flex items-center justify-between text-sm">
                          <button onClick={() => setQuery(item)} className="text-gray-600 hover:text-black flex-1 text-left py-1 truncate">
                            {item}
                          </button>
                          <button onClick={() => removeItem(item)} className="text-gray-300 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tendances */}
                <div>
                   <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4"/> Tendances</h3>
                   <div className="flex flex-wrap gap-2">
                     {TRENDING_SEARCHES.map(t => (
                       <button
                         key={t}
                         onClick={() => setQuery(t)}
                         className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-black hover:text-black transition-colors"
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* Results Render */}
            {results && !hasNoResults && (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left col: suggestions & cats & brands */}
                <div className="lg:col-span-1 space-y-8">
                  {(results.categories?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Catégories</h3>
                      <ul className="space-y-2">
                        {results.categories.map(c => (
                          <li key={c.id}>
                            <button 
                              onClick={() => { onClose(); onNavigateToCategory(c.id); }}
                              className="w-full text-left text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center justify-between group py-1"
                            >
                              <span>{c.name}</span>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(results.brands?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Marques</h3>
                      <ul className="space-y-2">
                        {results.brands.map(b => (
                          <li key={b.id}>
                            <button 
                              onClick={() => { onClose(); onNavigateToBrand(b.id); }}
                              className="w-full text-left text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center gap-3 py-1 group"
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200"><img src={b.logo} className="w-full h-full object-cover"/></div>
                              <span>{b.name}</span>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right col: Products grid */}
                {(results.products?.length || 0) > 0 && (
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produits correspondants</h3>
                      <button className="text-xs font-medium text-blue-600 hover:underline">Voir tout</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {results.products.map(product => (
                        <div 
                          key={product.id}
                          onClick={() => { onClose(); onNavigateToProduct(product.id); }}
                          className="group bg-white p-2 rounded-xl flex gap-3 hover:shadow-md border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                        >
                          <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col py-1">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-blue-600">{product.name}</h4>
                            <div className="flex flex-wrap items-baseline gap-2 mt-auto">
                              <span className="text-sm font-bold">{product.price.toFixed(2)} DT</span>
                              {product.originalPrice && <span className="text-xs text-gray-400 line-through">{product.originalPrice.toFixed(2)} DT</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {hasNoResults && (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Nous ne trouvons aucun article pour "<span className="font-medium text-gray-900">{query}</span>". 
                  Assurez-vous qu'il n'y ait pas de faute de frappe.
                </p>
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm">
                  <p className="text-sm font-medium text-gray-900 mb-3">Essayez plutôt ces catégories :</p>
                  <div className="flex flex-wrap gap-2">
                    {['Chaussures', 'Manteaux', 'Accessoires', 'Nouveautés'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setQuery(cat)}
                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-md text-sm text-gray-700 transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer visual search action on mobile */}
          <div className="sm:hidden border-t border-gray-100 p-4 bg-white flex justify-center">
            <button 
              onClick={handleVisualSearch}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium"
            >
              <ImageIcon className="w-5 h-5" />
              Recherche par photo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
