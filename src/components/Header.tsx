import React, { useState } from 'react';
import { Search, ShoppingBag, User, Heart, Menu, ChevronRight, Sun, Moon } from 'lucide-react';
import { mockCategories, mockCollections, mockBrands } from '../data/navigation';
import { Category } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToBrand: (brandId: string) => void;
  onNavigateHome: () => void;
  onOpenSearch: () => void;
  onNavigateToCart?: () => void;
  onNavigateToAccount?: () => void;
  onNavigateToAdmin?: () => void;
  categories?: any[];
  brands?: any[];
}

export function Header({ 
  onNavigateToCategory, 
  onNavigateToBrand, 
  onNavigateHome, 
  onOpenSearch, 
  onNavigateToCart,
  onNavigateToAccount,
  onNavigateToAdmin,
  categories = [],
  brands = []
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const { user, isAdmin, openAuthModal } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const displayCategories = (categories?.length || 0) > 0 ? categories : mockCategories;
  const displayBrands = (brands?.length || 0) > 0 ? brands : mockBrands;

  return (
    <header className="sticky top-0 z-50 bg-brand-50 dark:bg-brand-100 border-b border-brand-200 dark:border-brand-300 shadow-sm relative text-brand-900 dark:text-brand-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 -ml-2 text-brand-600 dark:text-brand-700 hover:text-brand-900 dark:hover:text-brand-800 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
 
        {/* Logo */}
        <div 
          className="text-3xl font-serif font-bold tracking-tight text-brand-900 dark:text-brand-900 cursor-pointer flex-shrink-0" 
          onClick={onNavigateHome}
        >
          J&J Beauty
        </div>
 
        {/* Desktop Navigation (Mega Menu) */}
        <nav className="hidden lg:flex items-center h-full gap-8 ml-12 flex-1">
          {displayCategories.map((category) => (
            <div key={category.id} className="h-full group flex items-center">
              <button 
                onClick={() => onNavigateToCategory(category.id)}
                className="text-sm font-bold text-brand-700 dark:text-brand-700 hover:text-brand-950 dark:hover:text-brand-900 uppercase tracking-widest h-full flex items-center border-b-2 border-transparent group-hover:border-brand-500 transition-colors"
              >
                {category.name}
              </button>
              
              {/* Mega Menu Dropdown */}
              <div className="absolute top-20 left-0 w-full bg-white dark:bg-brand-100 border-t border-brand-200 dark:border-brand-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out pointer-events-none group-hover:pointer-events-auto">
                <div className="max-w-7xl mx-auto px-8 py-10 flex gap-12">
                  
                  {/* Category Columns */}
                  <div className="flex gap-16 flex-1 flex-wrap">
                    {(() => {
                      if (category.collections && category.collections.length > 0) {
                        // Group collections by 'group' field
                        const groups = category.collections.reduce((acc: any, col: any) => {
                          const groupName = col.group || 'AUTRES';
                          if (!acc[groupName]) acc[groupName] = [];
                          acc[groupName].push(col);
                          return acc;
                        }, {});

                        return Object.entries(groups).map(([groupName, cols]: [string, any]) => (
                          <div key={groupName} className="flex flex-col">
                            <h3 className="text-xs font-bold text-brand-900 dark:text-brand-900 mb-5 uppercase tracking-widest">
                              {groupName}
                            </h3>
                            <ul className="space-y-3">
                              {cols.map((leaf: any) => (
                                <li key={leaf.id}>
                                  <button 
                                    onClick={() => {
                                      onNavigateToCategory(category.id);
                                      // small timeout to allow category route to set up before applying filter
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('select-collection', { detail: leaf.id }));
                                      }, 0);
                                    }}
                                    className="text-sm text-brand-600 dark:text-brand-700 hover:text-brand-950 dark:hover:text-brand-900 transition-colors text-left font-medium"
                                  >
                                    {leaf.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ));
                      } else if (category.subcategories && category.subcategories.length > 0) {
                        return category.subcategories.map((sub: any) => (
                          <div key={sub.id} className="flex flex-col">
                            <h3 
                              className="text-xs font-bold text-brand-900 dark:text-brand-900 mb-5 cursor-pointer hover:underline uppercase tracking-widest"
                              onClick={() => onNavigateToCategory(sub.id)}
                            >
                              {sub.name}
                            </h3>
                            <ul className="space-y-3">
                              {sub.subcategories?.map((leaf: any) => (
                                <li key={leaf.id}>
                                  <button 
                                    onClick={() => onNavigateToCategory(leaf.id)}
                                    className="text-sm text-brand-600 dark:text-brand-700 hover:text-brand-950 dark:hover:text-brand-900 transition-colors text-left font-medium"
                                  >
                                    {leaf.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ));
                      } else {
                        // Categories with neither just navigate to them directly, handled on the main head element
                        return <div className="text-sm text-brand-500 italic">Aucune sous-catégorie</div>;
                      }
                    })()}
                  </div>

                  {/* Promo Block inside Mega Menu */}
                  <div className="w-80 shrink-0">
                    <div 
                      className="relative w-full h-48 bg-brand-100 dark:bg-brand-200 rounded-xl overflow-hidden group/promo cursor-pointer border border-brand-100 dark:border-brand-300 shadow-sm"
                      onClick={() => onNavigateToCategory(category.id)}
                    >
                      <img 
                        src={category.promo?.image || `https://picsum.photos/seed/${category.slug}-promo/600/400`} 
                        alt={`Collection ${category.name}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/promo:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-brand-900/10 group-hover/promo:bg-brand-900/20 transition-colors" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-[10px] uppercase tracking-widest font-bold mb-1 opacity-90">{category.promo?.text || 'Nouveautés'}</p>
                        <p className="text-xl font-serif font-bold">{category.promo?.title || 'Découvrir la collection'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}

          {/* Brands Tab */}
          <div className="h-full group flex items-center">
            <button className="text-sm font-bold text-brand-700 dark:text-brand-700 hover:text-brand-950 dark:hover:text-brand-900 uppercase tracking-widest h-full flex items-center border-b-2 border-transparent group-hover:border-brand-900 transition-colors">
              Marques
            </button>
            <div className="absolute top-20 left-0 w-full bg-white dark:bg-brand-100 border-t border-brand-200 dark:border-brand-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out pointer-events-none group-hover:pointer-events-auto">
              <div className="max-w-7xl mx-auto px-8 py-10">
                <div className="grid grid-cols-4 gap-8">
                  {displayBrands.map(brand => (
                    <div 
                      key={brand.id} 
                      className="flex flex-col items-center gap-4 cursor-pointer group/brand"
                      onClick={() => onNavigateToBrand(brand.id)}
                    >
                      <div className="w-24 h-24 rounded-full border border-brand-100 dark:border-brand-200 overflow-hidden group-hover/brand:shadow-md transition-shadow">
                         <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover grayscale group-hover/brand:grayscale-0 transition-all duration-500" />
                      </div>
                      <span className="text-xs font-bold text-brand-900 uppercase tracking-widest group-hover/brand:underline">{brand.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button onClick={toggleDarkMode} className="p-2 text-brand-600 dark:text-brand-700 hover:text-brand-900 dark:hover:text-brand-800 transition" title="Changer le thème">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button onClick={onOpenSearch} className="p-2 text-brand-600 dark:text-brand-700 hover:text-brand-900 dark:hover:text-brand-800 transition">
            <Search className="w-5 h-5" />
          </button>
          
          {isAdmin && onNavigateToAdmin && (
            <button 
              onClick={onNavigateToAdmin}
              className="flex text-brand-900 dark:text-brand-900 transition items-center gap-2 bg-brand-100 dark:bg-brand-200 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold font-sans uppercase tracking-widest border border-brand-200 dark:border-brand-300 shadow-sm hover:shadow-md"
              title="Tableau de bord Admin"
            >
              <div className="hidden xs:inline">Admin</div>
              <div className="xs:hidden">A</div>
              <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
            </button>
          )}

          <button 
            onClick={() => user ? onNavigateToAccount?.() : openAuthModal()} 
            className="flex items-center gap-2 text-brand-600 dark:text-brand-700 hover:text-brand-900 dark:hover:text-brand-800 transition p-1"
          >
            {user ? (
              <div className="w-8 h-8 bg-brand-900 text-white rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-brand-100 dark:ring-brand-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>

          <button className="hidden md:block text-brand-600 dark:text-brand-700 hover:text-brand-900 dark:hover:text-brand-800 transition p-1">
            <Heart className="w-5 h-5" />
          </button>
          <button onClick={openCart} className="text-brand-600 dark:text-brand-700 hover:text-brand-900 dark:hover:text-brand-800 transition relative p-1">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-50 dark:border-brand-100 shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-white dark:bg-brand-50 z-40 overflow-y-auto transition-colors">
          <div className="p-4 space-y-6">
            {/* Account Management section in mobile menu */}
            <div className="bg-brand-50 dark:bg-brand-100 rounded-2xl p-6 border border-brand-100 dark:border-brand-200 shadow-sm">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-brand-900 text-white rounded-full flex items-center justify-center text-xl font-bold border-2 border-white dark:border-brand-100 shadow-md">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-brand-950 dark:text-brand-900 text-lg leading-tight">{user.name}</p>
                      <p className="text-xs text-brand-600 dark:text-brand-700 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => { onNavigateToAccount?.(); setMobileMenuOpen(false); }}
                      className="py-3 bg-white dark:bg-brand-50 border-2 border-brand-200 dark:border-brand-300 rounded-xl text-xs font-bold uppercase tracking-widest text-brand-900 shadow-sm hover:bg-brand-50 dark:hover:bg-brand-200 transition-colors"
                    >
                      Mon Profil
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => { onNavigateToAdmin?.(); setMobileMenuOpen(false); }}
                        className="py-3 bg-brand-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-900/20 active:scale-95 transition-all"
                      >
                        Admin
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-brand-800 dark:text-brand-700 mb-4 font-bold uppercase tracking-widest">Rejoignez-nous</p>
                  <button 
                    onClick={() => { openAuthModal(); setMobileMenuOpen(false); }}
                    className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20 uppercase tracking-[0.2em] text-xs"
                  >
                    Connexion / Inscription
                  </button>
                </div>
              )}
            </div>
            
            <div className="px-2 space-y-4">
              {displayCategories.map(cat => (
                <div key={cat.id} className="border-b border-brand-100 dark:border-brand-200 pb-2">
                  <button 
                    onClick={() => {
                      onNavigateToCategory(cat.id);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full py-4 text-xs font-bold text-brand-950 dark:text-brand-900 uppercase tracking-[0.3em]"
                  >
                    {cat.name}
                    <ChevronRight className="w-5 h-5 text-brand-300" />
                  </button>
                  <div className="pl-4 pb-2 space-y-5">
                     {cat.subcategories?.map((sub: any) => (
                       <div key={sub.id}>
                         <button 
                            onClick={() => {
                              onNavigateToCategory(sub.id);
                              setMobileMenuOpen(false);
                            }}
                            className="text-xs font-bold text-brand-800 dark:text-brand-700 py-1 uppercase tracking-widest"
                         >
                           {sub.name}
                         </button>
                         <div className="pl-4 mt-2 space-y-3 flex flex-col items-start border-l-2 border-brand-100 dark:border-brand-200 ml-1">
                           {sub.subcategories?.map((leaf: any) => (
                             <button 
                               key={leaf.id}
                               onClick={() => {
                                 onNavigateToCategory(leaf.id);
                                 setMobileMenuOpen(false);
                               }}
                               className="text-xs text-brand-500 dark:text-brand-600 font-bold hover:text-brand-900 py-0.5 tracking-wider"
                             >
                               {leaf.name}
                             </button>
                           ))}
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <div className="text-xs font-bold text-brand-950 dark:text-brand-900 uppercase tracking-[0.3em] mb-6">Nos Marques</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {displayBrands.map(b => (
                    <button 
                      key={b.id} 
                      onClick={() => {
                        onNavigateToBrand(b.id);
                        setMobileMenuOpen(false);
                      }}
                      className="text-[10px] font-bold text-brand-600 dark:text-brand-700 text-left py-1 uppercase tracking-widest hover:text-brand-950"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
