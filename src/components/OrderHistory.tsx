import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Package, Truck, CheckCircle2, Clock, XCircle, ArrowRight, Download, RotateCcw, XSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function OrderHistory({ onNavigateToProduct }: { onNavigateToProduct: (id: string) => void }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Orders fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'pending': return { label: 'Reçue', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'confirmed': return { label: 'Confirmée', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'preparing': return { label: 'En préparation', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'shipped': return { label: 'Expédiée', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      case 'delivered': return { label: 'Livrée', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'cancelled': return { label: 'Annulée', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      default: return { label: status, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette commande ? Le remboursement sera immédiat.")) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
        }
        window.dispatchEvent(new CustomEvent('toast', { detail: 'Commande annulée avec succès' }));
      } catch (err) {
        console.error("Failed to cancel order:", err);
        alert("Erreur lors de l'annulation.");
      }
    }
  };

  const handleReorder = (order: any) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        // Warning: This implies product is still available. In real app, we check stock.
        addToCart(
          { id: item.productId, name: item.name, price: item.price, images: [item.image], colors: [], sizes: [], description: '', brand: '', category: '', categoryId: '', dateAdded: '', rating: 0, reviewsCount: 0, stock: 10, features: [] },
          item.quantity,
          item.size,
          item.color
        );
      });
      openCart();
    }
  };

  if (loading) return <div className="py-20 text-center text-brand-500">Chargement de vos commandes...</div>;

  if (selectedOrder) {
    const statusInfo = getStatusInfo(selectedOrder.status);
    const StatusIcon = statusInfo.icon;
    const canCancel = ['pending', 'confirmed'].includes(selectedOrder.status);

    const timelineStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const currentIndex = timelineStatuses.indexOf(selectedOrder.status);

    return (
      <div className="max-w-4xl mx-auto">
         <button onClick={() => setSelectedOrder(null)} className="text-sm font-medium text-brand-500 hover:text-brand-900 mb-6 flex items-center gap-2">
            &larr; Retour aux commandes
         </button>
         
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
               <h2 className="text-2xl font-serif font-bold text-brand-900 mb-1">Commande n° {selectedOrder.id}</h2>
               <p className="text-sm text-brand-500">Passée le {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-bold text-sm ${statusInfo.bg.replace('gray-', 'brand-').replace('green-50', 'bg-brand-50').replace('green-200', 'border-brand-200')} ${statusInfo.border.replace('gray-', 'brand-')} ${statusInfo.color.replace('gray-', 'brand-')}`}>
              <StatusIcon className="w-4 h-4" /> {statusInfo.label}
            </div>
         </div>

         {/* Timeline */}
         {selectedOrder.status !== 'cancelled' && (
           <div className="mb-10 px-4">
             <div className="relative">
               <div className="absolute top-1/2 left-0 w-full h-1 bg-brand-200 dark:bg-brand-300 -translate-y-1/2 rounded-full"></div>
               <div className="absolute top-1/2 left-0 h-1 bg-brand-900 -translate-y-1/2 rounded-full transition-all" style={{ width: `${Math.max(0, (currentIndex / (timelineStatuses.length - 1)) * 100)}%` }}></div>
               <div className="relative z-10 flex justify-between">
                 {timelineStatuses.map((s, i) => {
                    const info = getStatusInfo(s);
                    const SIcon = info.icon;
                    const isCompleted = i <= currentIndex;
                    return (
                      <div key={s} className="flex flex-col items-center">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${isCompleted ? 'bg-brand-900 border-brand-900 text-white' : 'bg-white dark:bg-brand-100 border-brand-200 text-brand-400'}`}>
                           <SIcon className="w-5 h-5" />
                         </div>
                         <span className={`text-xs font-medium md:text-sm ${isCompleted ? 'text-brand-900' : 'text-brand-400'}`}>{info.label}</span>
                      </div>
                    )
                 })}
               </div>
             </div>
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
               <div className="bg-brand-50 dark:bg-brand-200 p-6 rounded-2xl border border-brand-100 dark:border-brand-300">
                  <h3 className="font-bold text-brand-900 mb-4">Articles ({selectedOrder.items?.length || 0})</h3>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4 items-center bg-white dark:bg-brand-100 p-4 rounded-xl border border-brand-100 dark:border-brand-200">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg cursor-pointer" onClick={() => onNavigateToProduct(item.productId)} />
                        <div className="flex-1 cursor-pointer" onClick={() => onNavigateToProduct(item.productId)}>
                          <p className="font-bold text-brand-900 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-brand-500">
                            {item.color && <span className="mr-2">Couleur: {item.color}</span>}
                            {item.size && <span>Taille: {item.size}</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-900">{(item.price * item.quantity).toFixed(2)} DT</p>
                          <p className="text-xs text-brand-500">Qté: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               
               {/* Actions */}
               <div className="flex flex-wrap gap-4">
                 <button onClick={() => handleReorder(selectedOrder)} className="flex items-center gap-2 px-6 py-3 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-950 transition shadow-lg shadow-brand-900/20">
                   <RotateCcw className="w-4 h-4" /> Acheter à nouveau
                 </button>
                 <button className="flex items-center gap-2 px-6 py-3 border border-brand-300 dark:border-brand-400 font-bold rounded-xl bg-white dark:bg-brand-100 hover:bg-brand-50 dark:hover:bg-brand-200 transition text-brand-700">
                   <Download className="w-4 h-4" /> Télécharger la facture
                 </button>
                 {canCancel && (
                   <button onClick={() => handleCancelOrder(selectedOrder.id)} className="flex items-center gap-2 px-6 py-3 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition ml-auto">
                     <XSquare className="w-4 h-4" /> Annuler
                   </button>
                 )}
               </div>
               {selectedOrder.status === 'cancelled' && (
                 <p className="text-red-600 text-sm italic">Commande annulée. Le remboursement a été effectué sur votre moyen de paiement original.</p>
               )}
            </div>

            <div className="space-y-6">
               <div className="bg-white dark:bg-brand-100 rounded-2xl p-6 border border-brand-200 dark:border-brand-300 shadow-sm">
                  <h3 className="font-bold text-brand-900 mb-4">Détails financiers</h3>
                  <div className="space-y-2 text-sm mb-4 pb-4 border-b border-brand-100 dark:border-brand-200">
                     <div className="flex justify-between text-brand-600"><span>Sous-total items</span><span>{selectedOrder.totalAmount.toFixed(2)} DT</span></div>
                     <div className="flex justify-between text-brand-600"><span>Livraison</span><span>Incluse</span></div>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-brand-900">
                     <span>Total</span><span>{selectedOrder.totalAmount.toFixed(2)} DT</span>
                  </div>
               </div>

               <div className="bg-brand-50 dark:bg-brand-200 rounded-2xl p-6 border border-brand-100 dark:border-brand-300">
                  <h3 className="font-bold text-brand-900 mb-4">Informations</h3>
                  <div className="space-y-4 text-sm">
                    {selectedOrder.shippingMethod && (
                      <div>
                        <p className="text-brand-500 mb-1">Mode de livraison</p>
                        <p className="font-medium text-brand-900 capitalize">{selectedOrder.shippingMethod === 'standard' ? 'Standard (3-4 jours)' : selectedOrder.shippingMethod === 'express' ? 'Express (24-48h)' : 'Point relais'}</p>
                        {selectedOrder.status === 'shipped' && (
                          <div className="mt-2 text-blue-600 font-medium cursor-pointer hover:underline">
                            N° Suivi: FR-{Math.floor(Math.random()*100000000)} &rarr;
                          </div>
                        )}
                      </div>
                    )}
                    {selectedOrder.shippingAddress && (
                      <div>
                        <p className="text-brand-500 mb-1">Livré à</p>
                        <p className="font-medium text-brand-900">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                        <p className="text-brand-600">{selectedOrder.shippingAddress.address1}</p>
                        <p className="text-brand-600">{selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.city}</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center">
        <Package className="w-16 h-16 text-brand-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-brand-900 mb-2">Aucune commande</h2>
        <p className="text-brand-500">Vous n'avez pas encore passé de commande.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">Mes commandes</h2>
      
      <div className="space-y-4">
        {orders.map(order => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;
          return (
            <div key={order.id} className="bg-white dark:bg-brand-100 border border-brand-200 dark:border-brand-300 rounded-2xl p-5 md:p-6 hover:shadow-md transition-shadow">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-brand-100 dark:border-brand-200">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full ${statusInfo.bg.replace('gray-', 'brand-').replace('green-50', 'bg-brand-50')} ${statusInfo.color.replace('gray-', 'brand-')}`}>
                       <StatusIcon className="w-6 h-6" />
                     </div>
                     <div>
                       <p className="text-sm text-brand-500 mb-0.5">Commande n° {order.id}</p>
                       <p className="font-bold text-brand-900">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                     </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/3">
                    <div className="text-right">
                       <p className="text-sm text-brand-500 mb-0.5">Total</p>
                       <p className="font-bold text-brand-900">{order.totalAmount.toFixed(2)} DT</p>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.bg.replace('gray-', 'brand-').replace('green-50', 'bg-brand-50').replace('green-200', 'border-brand-200')} ${statusInfo.border.replace('gray-', 'brand-')} ${statusInfo.color.replace('gray-', 'brand-')}`}>
                       {statusInfo.label}
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex -space-x-2 overflow-hidden">
                    {order.items?.map((item: any, i: number) => (
                      i < 4 && (
                        <img key={i} src={item.image} alt={item.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-brand-100 object-cover bg-brand-100" />
                      )
                    ))}
                    {order.items?.length > 4 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white dark:border-brand-100 bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-500">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleReorder(order)} className="flex-1 md:flex-none text-center text-sm font-bold text-brand-900 border border-brand-900 hover:bg-brand-900 hover:text-white px-4 py-2 rounded-xl transition">
                      Acheter à nouveau
                    </button>
                    <button onClick={() => setSelectedOrder(order)} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-brand-700 bg-brand-100 dark:bg-brand-200 hover:bg-brand-200 dark:hover:bg-brand-300 px-4 py-2 rounded-xl transition">
                      Détails <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
