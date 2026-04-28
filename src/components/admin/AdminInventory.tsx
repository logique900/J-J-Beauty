import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, ArrowUp, ArrowDown, History, RefreshCcw, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast';

export function AdminInventory() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Inventory fetch error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSyncERP = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success('Synchronisation ERP terminée (Données simulées mises à jour).');
    }, 2000);
  };

  const handleAdjustStock = async (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentAdjustment = adjustments[productId] || 0;
    const finalDelta = delta + currentAdjustment;
    
    // We update immediately in Firestore for simple +1/-1 or when user clicks checkmark
    try {
      const newStock = Math.max(0, (product.stock || 0) + delta);
      await updateDoc(doc(db, 'products', productId), {
        stock: newStock,
        updatedAt: serverTimestamp()
      });
      // Clear adjustment input for this product
      setAdjustments(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (err) {
      console.error("Stock update error:", err);
      toast.error("Erreur lors de la mise à jour du stock.");
    }
  };

  const handleInputChange = (productId: string, val: string) => {
    const num = parseInt(val) || 0;
    setAdjustments(prev => ({ ...prev, [productId]: num }));
  };

  if (!isAdmin) return null;

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Inventaire & Stocks</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleSyncERP}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Sync. ERP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700"><Package className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-brand-500 font-medium">Produits Surveillés</div>
              <div className="text-2xl font-bold text-brand-900">{products.length}</div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-red-500 font-medium">Stock Critique (≤ 5)</div>
              <div className="text-2xl font-bold text-red-700">
                {products.filter(p => p.stock <= 5 && p.stock > 0).length}
              </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><ArrowDown className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-orange-600 font-medium">En Rupture</div>
              <div className="text-2xl font-bold text-orange-800">
                {products.filter(p => p.stock === 0).length}
              </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-brand-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-brand-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-300" />
              Chargement de l'inventaire...
            </div>
          ) : (
            <table className="w-full text-left text-sm text-brand-700">
              <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 font-medium">SKU</th>
                  <th className="py-3 px-4 font-medium">Produit & Variantes</th>
                  <th className="py-3 px-4 font-medium">Stock Actuel</th>
                  <th className="py-3 px-4 font-medium">Alerte à</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                  <th className="py-3 px-4 font-medium text-right">Ajuster (Manuellement)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredProducts.map(product => {
                  const isCrit = (product.stock || 0) <= 5 && (product.stock || 0) > 0;
                  const isOut = (product.stock || 0) === 0;
                  return (
                    <tr key={product.id} className="hover:bg-brand-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">{product.sku || product.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 flex items-center gap-3">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-8 h-8 rounded-md object-cover border border-brand-100" />
                        )}
                        <div>
                          <div className="font-bold text-brand-900">{product.name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold text-base ${isOut ? 'text-orange-600' : isCrit ? 'text-red-600' : 'text-brand-900'}`}>{product.stock || 0}</span>
                      </td>
                      <td className="py-3 px-4 text-brand-500">5</td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Rupture</span>
                        ) : isCrit ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center w-max gap-1"><AlertTriangle className="w-3 h-3"/> Faible</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">OK</span>
                        )}
                      </td>
                      <td className="py-3 px-4 flex justify-end gap-2">
                         <button 
                           onClick={() => handleAdjustStock(product.id, -1)}
                           className="p-1.5 border border-brand-200 rounded hover:bg-brand-100 text-brand-600"
                         >
                           <ArrowDown className="w-4 h-4"/>
                         </button>
                         <input 
                           type="number" 
                           value={adjustments[product.id] || ''}
                           onChange={e => handleInputChange(product.id, e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleAdjustStock(product.id, adjustments[product.id] || 0)}
                           className="w-16 text-center border border-brand-200 rounded py-1 px-2 focus:ring-brand-900 focus:border-brand-900 outline-none" 
                           placeholder={product.stock?.toString() || '0'} 
                         />
                         <button 
                           onClick={() => handleAdjustStock(product.id, 1)}
                           className="p-1.5 border border-brand-200 rounded hover:bg-brand-100 text-brand-600"
                         >
                           <ArrowUp className="w-4 h-4"/>
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
