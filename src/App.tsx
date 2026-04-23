import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Grid2X2, Grid3X3, List, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Product, ViewMode, FilterState, SortOption } from './types';
import { mockCategories, mockBrands } from './data/navigation';
import { ProductCard } from './components/ProductCard';
import { QuickViewModal } from './components/QuickViewModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { Header } from './components/Header';
import { Breadcrumbs, BreadcrumbItem } from './components/Breadcrumbs';
import { SearchModal } from './components/SearchModal';
import { FilterSidebar } from './components/FilterSidebar';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { CartDrawer } from './components/CartDrawer';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { AuthModal } from './components/AuthModal';
import { AccountPage } from './components/AccountPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PWAManager } from './components/PWAManager';
import { PullToRefresh } from './components/PullToRefresh';
import { ThemeProvider } from './context/ThemeContext';
import { getOrSeedProducts, getOrSeedCategories, getOrSeedBrands, db } from './lib/firebase';
import { getAuth } from 'firebase/auth';
import { onSnapshot, collection, query, where } from 'firebase/firestore';

import { HeroSection } from './components/HeroSection';
import { CategoryShowcase } from './components/CategoryShowcase';
import { CategoryHeader } from './components/CategoryHeader';
import { Footer } from './components/Footer';

type AppRoute = 
  | { type: 'home' }
  | { type: 'category', id: string }
  | { type: 'brand', id: string }
  | { type: 'product', id: string }
  | { type: 'cart' }
  | { type: 'checkout' }
  | { type: 'account' }
  | { type: 'admin' };

const DEFAULT_FILTERS: FilterState = {
  priceMin: 0,
  priceMax: 1000,
  brands: [],
  sizes: [],
  colors: [],
  collections: [],
  inStock: false,
  onSale: false,
  minRating: 0
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ type: 'home' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid-4');
  const [visibleCount, setVisibleCount] = useState(12);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Db state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Filters & Sorting state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const handleRefresh = async () => {
    // Re-trigger product seed/fetch logic
    await getOrSeedProducts();
    await getOrSeedCategories();
    await getOrSeedBrands();
  };

  useEffect(() => {
    const auth = getAuth();
    
    // 1. Initial Seed/Fetch check (ensures base data exists)
    const runInitialSeed = async () => {
      try {
        await Promise.all([
          getOrSeedProducts(),
          getOrSeedCategories(),
          getOrSeedBrands()
        ]);
      } catch (err) {
        console.error("Initial seed/fetch check failed:", err);
      }
    };
    runInitialSeed();

    // 2. Real-time Subscriptions
    // We use public-friendly queries to avoid permission errors for guests
    const productsQuery = query(collection(db, 'products'), where('status', '==', 'active'));
    const unsubProducts = onSnapshot(productsQuery, (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setAllProducts(prods);
      setIsDbLoaded(true);
    }, (err) => {
      console.error("Products sync error:", err);
      setIsDbLoaded(true);
    });

    const categoriesQuery = query(collection(db, 'categories'), where('status', '==', 'Actif'));
    const unsubCategories = onSnapshot(categoriesQuery, (snap) => {
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setCategories(cats.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)));
    });

    const brandsQuery = query(collection(db, 'brands'), where('status', '==', 'Actif'));
    const unsubBrands = onSnapshot(brandsQuery, (snap) => {
      const brs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setBrands(brs);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBrands();
    };
  }, []);

  // Sync state to URL logic (Simulated)
  useEffect(() => {
    const params = new URLSearchParams();
    if (sort !== 'relevance') params.set('sort', sort);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.onSale) params.set('onSale', 'true');
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString());
    if (filters.priceMin > 0) params.set('minPrice', filters.priceMin.toString());
    if (filters.priceMax < 1000) params.set('maxPrice', filters.priceMax.toString());
    if (filters.brands.length) params.set('brands', filters.brands.join(','));
    if (filters.sizes.length) params.set('sizes', filters.sizes.join(','));
    if (filters.colors.length) params.set('colors', filters.colors.join(','));
    if (route.type !== 'home') params.set('ref', route.type === 'cart' ? 'cart' : `${route.type}:${(route as any).id || ''}`);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters, sort, route]);

  // Read URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters = { ...DEFAULT_FILTERS };
    // ... basic restore logic omitted for brevity in demo if identical ...
    
    const ref = params.get('ref');
    if (ref) {
      if (ref === 'cart') {
        setRoute({ type: 'cart' });
      } else {
        const [type, id] = ref.split(':');
        if (type === 'category' || type === 'brand' || type === 'product') {
          setRoute({ type: type as any, id });
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleSelectCollection = (e: any) => {
      setFilters(prev => ({ ...DEFAULT_FILTERS, collections: [e.detail] }));
    };
    window.addEventListener('select-collection', handleSelectCollection);
    return () => window.removeEventListener('select-collection', handleSelectCollection);
  }, []);

  const processedProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter logic
    result = result.filter(p => {
      if (filters.inStock && p.stock === 0) return false;
      if (filters.onSale && (!p.originalPrice || p.price >= p.originalPrice)) return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      if (filters.priceMin > 0 && p.price < filters.priceMin) return false;
      if (filters.priceMax < 1000 && p.price > filters.priceMax) return false;
      if (filters.brands.length > 0 && (!p.brand || !filters.brands.includes(p.brand))) return false;
      if (filters.sizes.length > 0 && !(p.sizes?.some(s => filters.sizes.includes(s)))) return false;
      if (filters.colors.length > 0 && !(p.colors?.some(c => filters.colors.includes(c.name)))) return false;
      
      if (filters.collections && filters.collections.length > 0) {
        if (!p.categoryId || !filters.collections.includes(p.categoryId)) return false;
      }

      if (route.type === 'category') {
        const catId = (route as any).id;
        const catObj = categories.find(c => c.id === catId) || mockCategories.find(c => c.id === catId);
        if (catObj) {
          const categoryNames = new Set([catObj.name]);
          // Include legacy subcategories mapped from mockCategories if they exist
          const addSubs = (c: any) => {
            if (c.subcategories) {
              c.subcategories.forEach((s: any) => {
                categoryNames.add(s.name);
                addSubs(s);
              });
            }
          };
          addSubs(catObj);
          
          if (!categoryNames.has(p.category)) return false;
        }
      }

      if (route.type === 'brand') {
        const brandObj = mockBrands.find(b => b.id === (route as any).id);
        if (brandObj && p.brand !== brandObj.name) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'newest': return new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime();
        case 'best_selling': return (b as any).reviewsCount - (a as any).reviewsCount;
        case 'best_rated': return b.rating - a.rating;
        case 'discount': return (b.originalPrice ? (1 - b.price/b.originalPrice) : 0) - (a.originalPrice ? (1 - a.price/a.originalPrice) : 0);
        default: return 0;
      }
    });
    return result;
  }, [filters, sort, route, allProducts]);

  const visibleProductsList = processedProducts.slice(0, visibleCount);
  const totalProducts = processedProducts.length;

  const handleLoadMore = () => setVisibleCount(prev => Math.min(prev + 12, totalProducts));

  const currentGridClass = () => {
    switch (viewMode) {
      case 'grid-2': return 'grid-cols-1 sm:grid-cols-2';
      case 'grid-3': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 'grid-4': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
      case 'list': return 'grid-cols-1';
      default: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';
    }
  };

  const getSortLabel = (s: SortOption) => {
    const map: Record<SortOption, string> = {
      relevance: 'Pertinence', price_asc: 'Prix croissant', price_desc: 'Prix décroissant',
      newest: 'Nouveautés', best_selling: 'Meilleures ventes', best_rated: 'Meilleures notes', discount: 'Promotions'
    };
    return map[s];
  };

  const activeFiltersCount = 
    (filters.inStock ? 1 : 0) + (filters.onSale ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + 
    (filters.priceMin > 0 ? 1 : 0) + (filters.priceMax < 1000 ? 1 : 0) + 
    filters.brands.length + filters.sizes.length + filters.colors.length;

  useEffect(() => {
    const handleNavToCart = () => {
      setRoute({ type: 'cart' });
      setQuickViewProduct(null); 
      setIsSearchOpen(false); 
      window.scrollTo({ top: 0 });
    };

    const handleNavToCheckout = () => {
      setRoute({ type: 'checkout' });
      setQuickViewProduct(null); 
      setIsSearchOpen(false); 
      window.scrollTo({ top: 0 });
    };

    window.addEventListener('nav-to-cart', handleNavToCart);
    window.addEventListener('nav-to-checkout', handleNavToCheckout);

    return () => {
      window.removeEventListener('nav-to-cart', handleNavToCart);
      window.removeEventListener('nav-to-checkout', handleNavToCheckout);
    };
  }, []);

  const navHelpers = {
    goHome: () => { setRoute({ type: 'home' }); setQuickViewProduct(null); setIsSearchOpen(false); window.scrollTo({ top: 0 }); },
    goToCategory: (id: string) => { setRoute({ type: 'category', id }); setQuickViewProduct(null); setIsSearchOpen(false); window.scrollTo({ top: 0 }); },
    goToBrand: (id: string) => { setRoute({ type: 'brand', id }); setQuickViewProduct(null); setIsSearchOpen(false); window.scrollTo({ top: 0 }); },
    goToProduct: (id: string) => { setRoute({ type: 'product', id }); setQuickViewProduct(null); setIsSearchOpen(false); window.scrollTo({ top: 0 }); },
    goToCart: () => { setRoute({ type: 'cart' }); setQuickViewProduct(null); setIsSearchOpen(false); window.scrollTo({ top: 0 }); },
    goToAdmin: () => { setRoute({ type: 'admin' }); setQuickViewProduct(null); setIsSearchOpen(false); window.scrollTo({ top: 0 }); }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-brand-50 font-sans text-brand-950">
            <PWAManager />
            {route.type === 'admin' ? (
              <AdminDashboard onBack={navHelpers.goHome} />
            ) : (
              <PullToRefresh onRefresh={handleRefresh}>
                <Header 
                  onNavigateHome={navHelpers.goHome} 
                  onNavigateToCategory={navHelpers.goToCategory} 
                  onNavigateToBrand={navHelpers.goToBrand}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onNavigateToCart={navHelpers.goToCart}
                  onNavigateToAccount={() => setRoute({ type: 'account' })}
                  onNavigateToAdmin={navHelpers.goToAdmin}
                  categories={categories}
                  brands={brands}
                />

              {route.type === 'cart' ? (
                <CartPage onNavigateHome={navHelpers.goHome} onNavigateToProduct={navHelpers.goToProduct} allProducts={allProducts} />
              ) : route.type === 'checkout' ? (
                <CheckoutPage onNavigateHome={navHelpers.goHome} onNavigateToCart={navHelpers.goToCart} />
              ) : route.type === 'account' ? (
                <AccountPage onNavigateHome={navHelpers.goHome} onNavigateToProduct={navHelpers.goToProduct} onNavigateToAdmin={navHelpers.goToAdmin} allProducts={allProducts} />
              ) : route.type === 'product' ? (
                (() => {
                  const product = allProducts.find(p => p.id === (route as any).id);
                  return product ? (
                    <ProductDetailPage 
                      product={product} 
                      onBack={() => window.history.length > 1 ? window.history.back() : navHelpers.goHome()} 
                      onNavigate={navHelpers.goToProduct} 
                      allProducts={allProducts}
                    />
                  ) : <div className="p-8 text-center">{isDbLoaded ? 'Produit introuvable' : 'Chargement...'}</div>;
                })()
              ) : (
                <>
                  {route.type === 'home' && (
                    <>
                      <HeroSection onExplore={() => {
                        document.getElementById('main-products')?.scrollIntoView({ behavior: 'smooth' });
                      }} />
                      <CategoryShowcase onNavigateToCategory={navHelpers.goToCategory} />
                    </>
                  )}
                  {route.type === 'category' && (() => {
                    const catObj = categories.find(c => c.id === route.id) || mockCategories.find(c => c.id === route.id);
                    return catObj ? (
                      <CategoryHeader 
                        category={catObj} 
                        selectedCollectionIds={filters.collections}
                        onToggleCollection={(colId) => {
                          setFilters(prev => ({
                            ...prev,
                            collections: prev.collections.includes(colId) 
                              ? prev.collections.filter(id => id !== colId)
                              : [...prev.collections, colId]
                          }));
                        }}
                        onClearCollections={() => {
                          setFilters(prev => ({ ...prev, collections: [] }));
                        }}
                      />
                    ) : null;
                  })()}
                  <main id="main-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
                    <div className="hidden lg:block shrink-0 sticky top-24 self-start">
                      <FilterSidebar isOpen={true} onClose={() => {}} filters={filters} setFilters={setFilters} totalResults={totalProducts} allProducts={allProducts} />
                    </div>

                  <div className="flex-1 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-brand-200 mb-4 gap-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsFilterOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-full text-sm font-medium hover:border-brand-900 transition-colors">
                          <SlidersHorizontal className="w-4 h-4" /> Filtres {activeFiltersCount > 0 && <span className="bg-brand-900 text-white px-1.5 py-0.5 rounded-full text-[10px] ml-1">{activeFiltersCount}</span>}
                        </button>
                        <div className="relative">
                          <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-full text-sm font-medium hover:border-brand-900 transition-colors bg-brand-50">
                            Trier par: <span className="font-semibold">{getSortLabel(sort)}</span> <ChevronDown className="w-4 h-4" />
                          </button>
                          {isSortOpen && (
                            <div className="absolute top-12 left-0 w-56 bg-brand-50 border border-brand-200 rounded-xl shadow-xl z-30 py-2">
                              {(['relevance', 'price_asc', 'price_desc', 'newest', 'best_selling', 'best_rated', 'discount'] as SortOption[]).map(s => (
                                <button key={s} onClick={() => { setSort(s); setIsSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${sort === s ? 'font-bold bg-brand-100 text-brand-950' : 'text-brand-800 hover:bg-brand-100'}`}>{getSortLabel(s)}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 text-sm text-brand-600">
                        <span>{totalProducts} produits</span>
                        <div className="hidden md:flex items-center bg-brand-200 rounded-lg p-1">
                          <button onClick={() => setViewMode('grid-2')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid-2' ? 'bg-brand-50 shadow-sm text-brand-950' : 'text-brand-700'}`}><Grid2X2 className="w-4 h-4" /></button>
                          <button onClick={() => setViewMode('grid-3')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid-3' ? 'bg-brand-50 shadow-sm text-brand-950' : 'text-brand-700'}`}><Grid3X3 className="w-4 h-4" /></button>
                          <button onClick={() => setViewMode('grid-4')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid-4' ? 'bg-brand-50 shadow-sm text-brand-950' : 'text-brand-700'}`}><LayoutGrid className="w-4 h-4" /></button>
                          <div className="w-px h-4 bg-brand-300 mx-1"></div>
                          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-brand-50 shadow-sm text-brand-950' : 'text-brand-700'}`}><List className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className="text-sm font-medium text-gray-500 mr-2">Filtres actifs ({activeFiltersCount})</span>
                        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-sm font-medium text-blue-600 hover:text-blue-800 underline ml-2">Tout effacer</button>
                      </div>
                    )}

                    {!isDbLoaded ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center"><h3 className="text-xl font-bold text-gray-500">Chargement des produits...</h3></div>
                    ) : visibleProductsList.length > 0 ? (
                      <div className={`grid gap-6 md:gap-8 ${currentGridClass()}`}>
                        {visibleProductsList.map(product => (
                          <div key={product.id} className="cursor-pointer" onClick={() => navHelpers.goToProduct(product.id)}>
                            <ProductCard product={product} viewMode={viewMode} onQuickView={(p) => setTimeout(() => setQuickViewProduct(p), 0)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center"><h3 className="text-xl font-bold">Aucun produit</h3></div>
                    )}

                    {visibleCount < totalProducts && (
                      <div className="mt-16 flex flex-col items-center">
                        <p className="text-sm text-gray-500 mb-4">Vous avez vu {visibleProductsList.length} sur {totalProducts}</p>
                        <button onClick={handleLoadMore} className="px-8 py-3 border-2 border-black text-black font-semibold rounded-full hover:bg-black hover:text-white transition-colors">Voir plus</button>
                      </div>
                    )}
                  </div>
                </main>
                </>
              )}

              <Footer />
            </PullToRefresh>
          )}

          <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} totalResults={totalProducts} allProducts={allProducts} />
          <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
          <SearchModal 
            isOpen={isSearchOpen} 
            onClose={() => setIsSearchOpen(false)} 
            onNavigateToProduct={navHelpers.goToProduct} 
            onNavigateToCategory={navHelpers.goToCategory} 
            onNavigateToBrand={navHelpers.goToBrand} 
            categories={categories}
            products={allProducts}
          />
          <CartDrawer />
          <AuthModal />
        </div>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
