import React, { useState } from 'react';
import { Product } from '../types';
import { 
  ChevronRight, Star, Minus, Plus, Heart, Share2, 
  Truck, RotateCcw, ShieldCheck, ChevronDown, Check, Facebook, Twitter, Mail 
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useCart } from '../context/CartContext';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onNavigate: (productId: string) => void;
  allProducts?: Product[];
}

export function ProductDetailPage({ product, onBack, onNavigate, allProducts = [] }: ProductDetailPageProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [zoomCoords, setZoomCoords] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [emailAlert, setEmailAlert] = useState('');
  const [alertSent, setAlertSent] = useState(false);
  
  const { addToCart } = useCart();

  // Active accordion tabs
  const [openTab, setOpenTab] = useState<'desc' | 'specs' | 'care' | 'delivery'>('desc');

  const mainImage = product.images?.[selectedImageIdx] || 'https://picsum.photos/seed/placeholder/600/800';
  const maxAllowedQuantity = Math.min(product.stock || 0, 10); // limited by stock or max 10
  const isOutOfStock = (product.stock || 0) === 0;

  // Zoom handling for desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; // Disable zoom on mobile
    setIsZooming(true);
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier !');
    }
  };

  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-brand-50 dark:bg-brand-50 min-h-screen text-brand-950 dark:text-brand-900 transition-colors">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex text-sm text-brand-600 dark:text-brand-700 mb-6 font-medium">
          <button onClick={onBack} className="hover:text-brand-900 transition">Catalogue</button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Produits</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-brand-950 dark:text-brand-900 font-bold truncate">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Gallery */}
          <div className="w-full lg:w-3/5 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0 pb-2 md:pb-0 hide-scrollbar">
              {product.images?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative aspect-[3/4] w-20 md:w-full rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImageIdx ? 'border-brand-900' : 'border-transparent hover:border-brand-200'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image with Zoom */}
            <div 
              className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-brand-100 dark:bg-brand-200 rounded-xl overflow-hidden cursor-zoom-in border border-brand-100 dark:border-brand-300"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setIsZooming(false)}
            >
              <img
                src={mainImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-200 ${isZooming ? 'scale-150' : 'scale-100'}`}
                style={isZooming ? { transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%` } : undefined}
              />
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {product.stock === 0 && (
                  <span className="px-3 py-1 text-sm font-bold bg-brand-900 text-white rounded-md shadow-sm">RUPTURE</span>
                )}
                {product.originalPrice && (
                  <span className="px-3 py-1 text-sm font-bold bg-red-500 text-white rounded-md shadow-sm">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-2/5 flex flex-col pt-4 md:pt-0">
            <div className="mb-6">
              {product.brand && (
                <a href="#" className="text-sm font-bold text-brand-500 dark:text-brand-600 hover:text-brand-900 mb-2 inline-block tracking-wide uppercase">
                  {product.brand}
                </a>
              )}
              <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-brand-950 dark:text-brand-900 mb-3 tracking-tight">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-1 bg-brand-100 dark:bg-brand-200 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-300">
                  <div className="flex text-accent-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-current' : 'text-brand-300'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-brand-950 ml-1">{product.rating}</span>
                  <span className="text-sm text-brand-600 underline ml-1 cursor-pointer hover:text-brand-900">
                    ({product.reviewsCount} avis)
                  </span>
                </div>
                {product.sku && (
                  <span className="text-sm text-brand-400 font-medium tracking-wider">SKU: {product.sku}</span>
                )}
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-bold text-brand-900">{product.price.toFixed(2)} DT</span>
                {product.originalPrice && (
                  <span className="text-xl text-brand-400 line-through mb-1.5">{product.originalPrice.toFixed(2)} DT</span>
                )}
              </div>
            </div>

            {/* Colors */}
            {(product.colors?.length ?? 0) > 0 && (
              <div className="mb-6 bg-white dark:bg-brand-100 p-6 rounded-2xl border border-brand-100 dark:border-brand-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-brand-900 uppercase tracking-widest">Teinte: <span className="text-brand-600 font-medium ml-2">{selectedColor}</span></h3>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {product.colors?.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        selectedColor === color.name ? 'ring-2 ring-offset-2 ring-brand-900 scale-110' : 'border border-brand-200 p-1 hover:border-brand-900'
                      }`}
                      title={color.name}
                    >
                      <span className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {(product.sizes?.length ?? 0) > 0 && (
              <div className="mb-6 bg-white dark:bg-brand-100 p-6 rounded-2xl border border-brand-100 dark:border-brand-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-brand-900 uppercase tracking-widest">Format</h3>
                  <button className="text-xs font-bold text-brand-600 underline hover:text-brand-900 uppercase">Guide des tailles</button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {product.sizes?.map((size) => {
                    const isAvailable = true; 
                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                          !isAvailable ? 'bg-brand-50 text-brand-300 border-brand-100 cursor-not-allowed line-through' :
                          selectedSize === size ? 'bg-brand-900 text-white border-brand-900 shadow-md' : 'bg-white dark:bg-brand-50 text-brand-900 border-brand-200 dark:border-brand-300 hover:border-brand-900'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            {isOutOfStock ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-6 mb-8">
                <h3 className="text-orange-950 dark:text-orange-300 font-bold mb-2">Cet article est victime de son succès.</h3>
                <p className="text-orange-800 dark:text-orange-400 text-sm mb-4">Inscrivez-vous pour être prioritaire lors du réassort.</p>
                {alertSent ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-200">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-bold">Nous vous enverrons un email dès que possible.</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Votre adresse email" 
                      value={emailAlert}
                      onChange={(e) => setEmailAlert(e.target.value)}
                      className="flex-1 rounded-xl border-orange-200 bg-white dark:bg-brand-50 px-4 focus:ring-brand-900 outline-none h-12" 
                    />
                    <button 
                      onClick={() => setAlertSent(true)}
                      className="bg-brand-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-950 transition-colors"
                    >
                      M'alerter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex justify-between text-sm mb-1 px-1">
                  {product.stock <= 5 ? (
                    <span className="text-accent-600 font-bold">Vite, plus que {product.stock} exemplaires !</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1"><Check className="w-4 h-4"/> Article disponible</span>
                  )}
                </div>

                <div className="flex gap-4 h-14">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between border-2 border-brand-200 dark:border-brand-300 rounded-xl px-2 w-32 bg-white dark:bg-brand-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-brand-500 hover:text-brand-900 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-8 text-center text-brand-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxAllowedQuantity, quantity + 1))}
                      disabled={quantity >= maxAllowedQuantity}
                      className="p-2 text-brand-500 hover:text-brand-900 transition disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    onClick={() => addToCart(product, quantity, selectedSize, selectedColor)}
                    className="flex-1 bg-brand-900 text-white rounded-xl font-bold text-lg hover:bg-brand-950 transition-colors shadow-xl shadow-brand-900/20 flex items-center justify-center gap-2"
                  >
                    Ajouter au panier
                  </button>
                  
                  {/* Wishlist Button */}
                  <button className="w-14 items-center justify-center flex border-2 border-brand-200 dark:border-brand-300 rounded-xl hover:border-brand-900 transition-colors text-brand-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Heart className="w-6 h-6" />
                  </button>
                </div>
                {quantity >= maxAllowedQuantity && quantity > 1 && (
                  <p className="text-xs text-brand-500 mt-1 font-medium italic">Limite de commande atteinte ({maxAllowedQuantity} max).</p>
                )}
              </div>
            )}

            {/* Quick guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-sm">
              <div className="flex items-center gap-3 text-brand-800 p-4 bg-brand-100 dark:bg-brand-200 rounded-xl border border-brand-100 dark:border-brand-300">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-brand-100 flex items-center justify-center shrink-0">
                   <Truck className="w-5 h-5 text-brand-900" />
                </div>
                <span className="leading-snug font-medium">{product.deliveryEstimate || 'Livraison standard en 2-4 jours'}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-800 p-4 bg-brand-100 dark:bg-brand-200 rounded-xl border border-brand-100 dark:border-brand-300">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-brand-100 flex items-center justify-center shrink-0">
                   <RotateCcw className="w-5 h-5 text-brand-900" />
                </div>
                <span className="leading-snug font-medium">Retours gratuits sous 30 jours</span>
              </div>
            </div>

            {/* Details Accordion */}
            <div className="border-t border-brand-200 dark:border-brand-300 pt-2 mb-8">
              {[
                { id: 'desc', label: 'Description détaillée', content: <p className="text-brand-700 dark:text-brand-800 leading-relaxed">{product.description}</p> },
                { id: 'specs', label: 'Caractéristiques Techniques', content: (
                  product.features ? (
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-brand-100 dark:divide-brand-200">
                        {product.features?.map((feat, i) => (
                          <tr key={i} className="hover:bg-brand-50 dark:hover:bg-brand-200 transition-colors">
                            <td className="py-3 pr-4 font-bold text-brand-900 w-1/3 uppercase text-[10px] tracking-wider">{feat.label}</td>
                            <td className="py-3 text-brand-700 font-medium">{feat.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="text-brand-500 italic">Aucune caractéristique technique spécifique répertoriée.</p>
                )},
                { id: 'care', label: 'Composition & Entretien', content: (
                  <div className="space-y-4 text-sm text-brand-700">
                    <div className="p-4 bg-brand-50 dark:bg-brand-200 rounded-xl">
                      <strong className="text-brand-900 block mb-1 font-bold uppercase text-[10px] tracking-widest">Composition</strong>
                      <p className="font-medium">{product.composition || 'Formulation hypoallergénique'}</p>
                    </div>
                    <div className="p-4 bg-brand-50 dark:bg-brand-200 rounded-xl">
                      <strong className="text-brand-900 block mb-1 font-bold uppercase text-[10px] tracking-widest">Conseils d'utilisation</strong>
                      <p className="font-medium">{product.careInstructions || 'Appliquer sur une peau nettoyée matin et soir.'}</p>
                    </div>
                  </div>
                )}
              ].map((tab) => (
                <div key={tab.id} className="border-b border-brand-200 dark:border-brand-300">
                  <button 
                    onClick={() => setOpenTab(openTab === tab.id ? null as any : tab.id)}
                    className="flex justify-between items-center w-full py-5 font-bold text-brand-900 hover:text-brand-600 transition uppercase text-xs tracking-widest"
                  >
                    {tab.label}
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openTab === tab.id ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openTab === tab.id ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                    {tab.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-4 text-sm text-brand-500 mb-12">
              <span className="font-bold uppercase tracking-widest text-[10px]">Partager</span>
              <div className="flex gap-2">
                <button onClick={handleShare} className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-200 flex items-center justify-center hover:bg-brand-900 hover:text-white text-brand-900 transition shadow-sm" title="Copier le lien"><Share2 className="w-4 h-4" /></button>
                <a href="#" className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-200 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition text-brand-900 shadow-sm" title="Facebook"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-200 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition text-brand-900 shadow-sm" title="Twitter/X"><Twitter className="w-4 h-4" /></a>
                <a href="mailto:?subject=Regarde ce produit" className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-200 flex items-center justify-center hover:bg-brand-900 hover:text-white transition text-brand-900 shadow-sm" title="Email"><Mail className="w-4 h-4" /></a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Suggested Products */}
      <div className="bg-white dark:bg-brand-100 py-24 mt-16 border-t border-brand-100 dark:border-brand-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-12 gap-4">
            <h2 className="text-3xl font-serif font-bold text-brand-900">Complétez votre routine</h2>
            <button className="text-sm font-bold text-brand-900 hover:underline underline-offset-8 decoration-2 uppercase tracking-widest">Voir toute la collection</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <div key={p.id} onClick={(e) => {
              }}>
                <ProductCard
                  product={p}
                  viewMode="grid-4"
                  onQuickView={() => onNavigate(p.id)} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
