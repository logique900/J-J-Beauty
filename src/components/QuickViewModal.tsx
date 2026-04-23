import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Star, ExternalLink, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();

  // Reset state when product changes
  React.useEffect(() => {
    if (product) {
      setCurrentImageIdx(0);
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0]?.name || '');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % (product.images?.length || 1));
  };

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev - 1 + (product.images?.length || 1)) % (product.images?.length || 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[90vh]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: Image Carousel */}
          <div className="w-full md:w-1/2 relative bg-gray-100 min-h-[300px]">
            <img
              src={product.images?.[currentImageIdx] || 'https://picsum.photos/seed/placeholder/600/800'}
              alt={product.name}
              className="w-full h-full object-cover absolute inset-0"
            />
            {(product.images?.length || 0) > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-white text-gray-800 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-white text-gray-800 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {product.images?.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIdx ? 'bg-black w-6' : 'bg-black/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Details */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
              <div className="flex items-center text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-medium text-gray-900">{product.rating}</span>
              </div>
              <span className="px-1">•</span>
              <span className="underline cursor-pointer">{product.reviewsCount} avis</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>
            
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-bold text-gray-900">
                {product.price.toFixed(2)} DT
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {product.originalPrice.toFixed(2)} DT
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-8 max-w-prose line-clamp-3">
              {product.description}
            </p>

            {/* Colors */}
            {(product.colors?.length || 0) > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                  <span>Couleur</span>
                  <span className="text-gray-500">{selectedColor}</span>
                </h3>
                <div className="flex gap-3">
                  {product.colors?.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color.name
                          ? 'border-black scale-110'
                          : 'border-transparent hover:scale-105 shadow-sm'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {(product.sizes?.length || 0) > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Taille</h3>
                  <button className="text-sm text-gray-500 underline hover:text-black">Guide des tailles</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-900'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-4 mb-4">
              {/* Quantity */}
              <div className="flex items-center justify-between border border-gray-200 rounded-lg p-1 w-full sm:w-32 bg-gray-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-white rounded-md transition-colors text-gray-600"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold text-gray-900 w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="p-2 hover:bg-white rounded-md transition-colors text-gray-600 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                disabled={product.stock === 0}
                onClick={() => {
                  addToCart(product, quantity, selectedSize, selectedColor);
                  onClose();
                }}
                className="flex-1 bg-black text-white flex items-center justify-center gap-2 py-4 rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </button>
            </div>

            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black justify-center p-3">
              <span>Voir la fiche complète</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
