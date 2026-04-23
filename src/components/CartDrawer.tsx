import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeFromCart, cartTotal } = useCart();

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeCart();
  };

  const FREE_SHIPPING_THRESHOLD = 150;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-sm sm:max-w-md bg-white h-full flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Mon Panier ({items.reduce((a,b)=>a+b.quantity,0)})
              </h2>
              <button 
                onClick={closeCart} 
                className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <p className="text-sm text-gray-700 font-medium mb-2 text-center">
                  {amountToFreeShipping > 0 
                    ? <>Plus que <span className="font-bold text-black">{amountToFreeShipping.toFixed(2)} DT</span> pour la livraison gratuite !</>
                    : <span className="text-green-600">Vous bénéficiez de la livraison gratuite !</span>}
                </p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${amountToFreeShipping === 0 ? 'bg-green-500' : 'bg-black'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Votre panier est vide</h3>
                  <p className="text-gray-500 text-sm max-w-[250px]">Laissez-vous tenter par nos nouveautés ou nos collections incontournables.</p>
                  <button onClick={closeCart} className="mt-4 px-6 py-2 bg-black text-white rounded-full font-medium">Continuer mes achats</button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={item.product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/800'} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.product.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.color && <span>C: {item.color}</span>}
                            {item.size && <span className="ml-2">T: {item.size}</span>}
                          </p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        {/* Qty Switcher */}
                        <div className="flex items-center border border-gray-200 rounded-md">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:text-black">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold px-2 w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-500 hover:text-black">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {(item.product.price * item.quantity).toFixed(2)} DT
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-4 sm:p-6 bg-white space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Sous-total</span>
                  <span>{cartTotal.toFixed(2)} DT</span>
                </div>
                <p className="text-xs text-gray-500 text-center">Frais de port calculés à l'étape suivante.</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                       closeCart();
                       // In real app, trigger a route. We dispatch an event so App.tsx can intercept, or use a window method, or rely on caller contextualizing. 
                       // Since we use internal state in App.tsx, let's use a custom event.
                       window.dispatchEvent(new CustomEvent('nav-to-cart'));
                    }}
                    className="w-full py-3 border-2 border-black text-black rounded-xl font-bold hover:bg-gray-50 transition"
                  >
                    Voir le panier
                  </button>
                  <button 
                    onClick={() => {
                       closeCart();
                       window.dispatchEvent(new CustomEvent('nav-to-checkout'));
                    }}
                    className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-all"
                  >
                    Commander <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
