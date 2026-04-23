import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';
import { Minus, Plus, Trash2, Heart, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { Product } from '../types';

interface CartPageProps {
  onNavigateHome: () => void;
  onNavigateToProduct: (id: string) => void;
  allProducts?: Product[];
}

export function CartPage({ onNavigateHome, onNavigateToProduct, allProducts = [] }: CartPageProps) {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [activePromo, setActivePromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingEstimate, setShippingEstimate] = useState<number | null>(null);

  const FREE_SHIPPING_THRESHOLD = 150;
  
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (promoCode.toUpperCase() === 'WELCOME10') {
      setActivePromo({ code: 'WELCOME10', discount: 0.1 }); // 10%
    } else {
      setActivePromo(null);
      setPromoError('Code promotionnel invalide ou expiré.');
    }
  };

  const handleEstimateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.length > 0) {
       setShippingEstimate(7.00);
    }
  };

  const currentTotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = activePromo ? currentTotal * activePromo.discount : 0;
  const isFreeShippingByTotal = (currentTotal - discountAmount) >= FREE_SHIPPING_THRESHOLD;
  const finalShipping = isFreeShippingByTotal ? 0 : (shippingEstimate ?? 7.00);
  const finalTotal = currentTotal - discountAmount + finalShipping;

  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - (currentTotal - discountAmount));
  const progressPercent = Math.min(100, ((currentTotal - discountAmount) / FREE_SHIPPING_THRESHOLD) * 100);

  const recommendedProducts = allProducts.filter(p => !items.find(i => i.product.id === p.id)).slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center min-h-[60vh] flex flex-col justify-center items-center bg-brand-50 dark:bg-brand-50 transition-colors">
        <h1 className="text-4xl font-serif font-extrabold text-brand-950 dark:text-brand-900 tracking-tight mb-4 uppercase">Votre panier est vide</h1>
        <p className="text-brand-600 dark:text-brand-700 mb-8 max-w-md font-medium">On dirait que vous n'avez pas encore trouvé la routine parfaite pour votre peau.</p>
        <button onClick={onNavigateHome} className="px-10 py-4 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-950 transition shadow-xl shadow-brand-900/20 uppercase tracking-widest text-sm">
          Découvrir nos soins
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-brand-50 transition-colors pb-20 min-h-screen">
      {/* Header */}
      <div className="bg-brand-50 dark:bg-brand-100 border-b border-brand-100 dark:border-brand-200 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-extrabold text-brand-950 dark:text-brand-900 mb-4 tracking-tight">Mon Panier ({items.reduce((a, b) => a + b.quantity, 0)} articles)</h1>
          <div className="max-w-xl">
             <p className="text-sm text-brand-700 dark:text-brand-800 font-bold mb-3 uppercase tracking-wider">
                {amountToFreeShipping > 0 
                  ? <>Plus que <span className="text-accent-600 dark:text-accent-500">{amountToFreeShipping.toFixed(2)} DT</span> pour la livraison gratuite !</>
                  : <span className="text-green-600 dark:text-green-400">Félicitations ! Livraison offerte</span>}
              </p>
              <div className="w-full h-3 bg-brand-200 dark:bg-brand-300 rounded-full overflow-hidden shadow-inner font-sans">
                <div className={`h-full transition-all duration-700 ease-out ${amountToFreeShipping === 0 ? 'bg-green-500' : 'bg-brand-900 shadow-lg'}`} style={{ width: `${progressPercent}%` }} />
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col lg:flex-row gap-12">
        {/* Left Column: Items */}
        <div className="flex-1">
          <div className="hidden lg:grid grid-cols-12 text-xs font-bold text-brand-400 uppercase tracking-[0.2em] border-b border-brand-100 dark:border-brand-200 pb-5 mb-8 transition-colors">
            <div className="col-span-7">Produit</div>
            <div className="col-span-3 text-center">Quantité</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="space-y-10">
            {items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-6 py-8 border-b border-brand-100 dark:border-brand-200 relative group transition-colors">
                <div className="w-28 h-36 sm:w-36 sm:h-48 bg-brand-100 dark:bg-brand-200 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-sm border border-brand-100 dark:border-brand-300" onClick={() => onNavigateToProduct(item.product.id)}>
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                     <div className="sm:col-span-7 flex flex-col">
                       <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-brand-900 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => onNavigateToProduct(item.product.id)}>
                         {item.product.name}
                       </h3>
                       <p className="text-sm text-brand-500 dark:text-brand-600 mt-2 font-bold tracking-wider">{item.product.price.toFixed(2)} DT l'unité</p>
                       <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors">
                         {item.color && <span className="px-3 py-1.5 bg-white dark:bg-brand-200 rounded-lg border border-brand-200 dark:border-brand-300 text-brand-800">{item.color}</span>}
                         {item.size && <span className="px-3 py-1.5 bg-white dark:bg-brand-200 rounded-lg border border-brand-200 dark:border-brand-300 text-brand-800">Taille: {item.size}</span>}
                       </div>
                       {item.quantity >= 5 && <p className="text-xs font-bold text-accent-600 mt-4 flex items-center gap-1 uppercase tracking-tighter">Stock très limité</p>}
                     </div>

                     <div className="sm:col-span-5 flex justify-between items-start lg:contents text-right">
                        <div className="flex items-center border-2 border-brand-200 dark:border-brand-300 rounded-xl p-1 w-32 bg-white dark:bg-brand-100 lg:col-span-3 lg:mx-auto">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-brand-50 dark:hover:bg-brand-200 rounded-lg transition text-brand-500 hover:text-brand-950"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold text-lg text-brand-900 flex-1 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-brand-50 dark:hover:bg-brand-200 rounded-lg transition text-brand-500 hover:text-brand-950 border-l border-transparent"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="hidden lg:block lg:col-span-2">
                          <span className="text-xl font-bold text-brand-950 dark:text-brand-900">{(item.product.price * item.quantity).toFixed(2)} DT</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-6 mt-6 text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-600">
                    <button onClick={() => removeFromCart(item.id)} className="hover:text-red-500 flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4"/> Supprimer</button>
                    <button className="hover:text-brand-950 dark:hover:text-brand-900 flex items-center gap-2 transition-colors"><Heart className="w-4 h-4"/> Favoris</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center p-5 bg-brand-100 dark:bg-brand-200 text-brand-800 dark:text-brand-900 rounded-2xl border border-brand-100 dark:border-brand-300 shadow-sm transition-colors">
             <ShieldCheck className="w-6 h-6 mr-4 shrink-0 text-brand-900" />
             <p className="text-sm font-medium">Les articles ne sont pas réservés tant que le paiement n'est pas validé. Terminez votre commande pour garantir la disponibilité.</p>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="w-full lg:w-96 shrink-0 pt-0 lg:pt-16">
          <div className="bg-white dark:bg-brand-100 border border-brand-100 dark:border-brand-200 rounded-3xl p-8 sm:p-10 sticky top-24 shadow-xl shadow-brand-900/5 transition-colors">
            <h2 className="text-2xl font-serif font-bold text-brand-950 dark:text-brand-900 mb-8 border-b border-brand-50 dark:border-brand-200 pb-4">Résumé</h2>
            
            <div className="space-y-5 text-sm text-brand-600 dark:text-brand-700 mb-8">
              <div className="flex justify-between font-medium"><span>Sous-total</span><span className="text-brand-900 font-bold">{currentTotal.toFixed(2)} DT</span></div>
              {activePromo && (
                <div className="flex justify-between text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 p-3 rounded-xl -mx-2">
                  <span className="flex items-center gap-2"><Tag className="w-4 h-4"/> Réduction ({activePromo.code})</span>
                  <span>-{discountAmount.toFixed(2)} DT</span>
                </div>
              )}
              <div className="flex justify-between border-t border-brand-50 dark:border-brand-200 pt-5 font-medium">
                <span>Livraison estimée</span>
                <span>{finalShipping === 0 ? <span className="text-green-600 dark:text-green-400 font-bold uppercase tracking-widest text-xs">Offerte</span> : `${finalShipping.toFixed(2)} DT`}</span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t-2 border-brand-950 dark:border-brand-900 pt-8 mb-10">
              <span className="text-lg font-bold text-brand-950 dark:text-brand-900 uppercase tracking-widest">Total</span>
              <span className="text-3xl font-serif font-extrabold text-brand-950 dark:text-brand-900">{finalTotal.toFixed(2)} DT</span>
            </div>

            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('nav-to-checkout'))}
              className="w-full py-5 bg-brand-900 text-white rounded-2xl font-bold flex justify-center items-center gap-3 shadow-2xl shadow-brand-900/20 hover:bg-brand-950 hover:-translate-y-1 transition-all text-lg mb-6 group"
            >
              Commander <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="mt-10 space-y-8">
               <div>
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-[0.2em] text-brand-900">Code promo</h3>
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="WELCOMETEN" className="flex-1 border-2 border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-50 rounded-xl px-4 py-3 text-sm focus:border-brand-900 outline-none transition-colors" />
                    <button type="submit" className="px-5 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-950 transition shadow-lg shadow-brand-900/10">OK</button>
                  </form>
                  {promoError && <p className="text-accent-500 text-[10px] font-bold mt-2 uppercase tracking-wider">{promoError}</p>}
               </div>
               <div className="pt-8 border-t border-brand-100 dark:border-brand-200">
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-[0.2em] text-brand-900">Frais de port</h3>
                  <form onSubmit={handleEstimateShipping} className="flex gap-2">
                    <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="CP : 75001" className="flex-1 border-2 border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-900 transition-colors" />
                    <button type="submit" className="px-5 py-2 bg-white dark:bg-brand-200 border-2 border-brand-200 dark:border-brand-300 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-50 transition-colors">Prév.</button>
                  </form>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
