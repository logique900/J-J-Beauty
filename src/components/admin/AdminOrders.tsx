import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Printer, Edit, CornerUpLeft, 
  Check, Truck, Package, Download, X, Copy, ChevronLeft, MoreVertical
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold w-max">En attente</span>;
    case 'confirmed': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold w-max">Confirmée</span>;
    case 'processing': return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold w-max">En préparation</span>;
    case 'shipped': return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold w-max">Expédiée</span>;
    case 'delivered': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold w-max">Livrée</span>;
    case 'cancelled': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold w-max">Annulée</span>;
    case 'refunded': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold w-max">Remboursée</span>;
    default: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold w-max">{status}</span>;
  }
};

export function AdminOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);

  // Simulation hooks for actions
  const [trackingInput, setTrackingInput] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        trackingNumber: trackingInput,
        updatedAt: serverTimestamp()
      });
      alert('Numéro de suivi enregistré !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement.');
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert('Erreur lors du changement de statut.');
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder || !refundAmount) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'refunded',
        refundAmount: parseFloat(refundAmount),
        updatedAt: serverTimestamp()
      });
      setShowRefundModal(false);
      alert('Remboursement effectué !');
    } catch (err) {
      console.error(err);
      alert('Erreur.');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedOrders = snap.docs.map(d => {
        const data = d.data() as any;
        let dateStr = 'N/A';
        if (data.createdAt) {
          try {
            const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            dateStr = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          } catch (e) {
            console.error("Error parsing date:", e);
          }
        }
        
        return {
          id: d.id,
          ...data,
          customer: (data.shippingAddress?.firstName || '') + ' ' + (data.shippingAddress?.lastName || ''),
          email: data.email || 'N/A',
          amount: data.totalAmount || 0,
          date: dateStr,
          payment: data.paymentMethod || 'Espèces', 
          shipping: data.shippingMethod || 'Standard',
          address: data.shippingAddress ? `${data.shippingAddress.address || ''}, ${data.shippingAddress.zipCode || ''} ${data.shippingAddress.city || ''}, ${data.shippingAddress.country || ''}` : 'N/A'
        };
      });
      setOrders(fetchedOrders);
      setLoading(false);
      
      // Update selected order if it is currently open
      if (selectedOrder) {
        const updated = fetchedOrders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    }, (err) => {
      console.error("Orders fetch error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedOrder?.id, isAdmin]);

  const toggleBulkSelect = (id: string) => {
    if (selectedBulk.includes(id)) {
      setSelectedBulk(selectedBulk.filter(i => i !== id));
    } else {
      setSelectedBulk([...selectedBulk, id]);
    }
  };

  const handleBulkPrint = () => {
    alert(`Impression lancée pour ${selectedBulk.length} commandes.`);
    setSelectedBulk([]);
  };

  const handleExportCSV = () => {
    const headers = ['ID Commande', 'Client', 'Email', 'Montant', 'Statut', 'Date', 'Methode Paiement', 'Livraison'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n'
      + orders.map(o => {
          return `${o.id},"${o.customer}","${o.email}",${o.amount},${o.status},"${o.date}","${o.payment}","${o.shipping}"`;
        }).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export-commandes-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder || !newStatus || newStatus === 'Changer le statut...') return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), { status: newStatus });
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-brand-500">Chargement des commandes...</div>;
  }

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Detail Header */}
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-brand-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-brand-700" />
          </button>
          <h2 className="text-2xl font-serif font-bold text-brand-900 flex items-center gap-3">
            Commande {selectedOrder.id.slice(-8)}
            {getStatusBadge(selectedOrder.status)}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm flex flex-wrap gap-3">
              <select 
                onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)} 
                value={selectedOrder.status} 
                className="border border-brand-200 rounded-lg px-4 py-2 text-sm font-medium focus:ring-brand-900 outline-none"
              >
                 <option value="pending">En attente</option>
                 <option value="confirmed">Confirmée</option>
                 <option value="processing">En Préparation</option>
                 <option value="shipped">Expédiée</option>
                 <option value="delivered">Livrée</option>
                 <option value="cancelled">Annulée</option>
              </select>
              
              <button 
                onClick={() => setShowRefundModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold transition"
              >
                <CornerUpLeft className="w-4 h-4" /> Rembourser
              </button>
              
              <button 
                onClick={() => alert('Génération du bon de commande...')}
                className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 hover:bg-brand-50 transition text-sm font-medium ml-auto"
              >
                <Printer className="w-4 h-4" /> Imprimer documents
              </button>
            </div>

            {/* Tracking (if processing or shipped) */}
            {(selectedOrder.status === 'processing' || selectedOrder.status === 'shipped') && (
              <div className="bg-white p-6 rounded-xl border border-brand-100 shadow-sm">
                <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5" /> Expédition & Suivi</h3>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brand-700 mb-1">Numéro de suivi</label>
                    <input 
                      type="text" 
                      defaultValue={selectedOrder.trackingNumber || ''} 
                      onChange={e => setTrackingInput(e.target.value)} 
                      className="w-full px-4 py-2 rounded-lg border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900" 
                      placeholder="Ex: 6A..."
                    />
                  </div>
                  <button 
                    onClick={handleSaveTracking}
                    className="px-4 py-2 bg-brand-900 text-white rounded-lg font-bold hover:bg-brand-950 transition shadow-sm"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
                 <h3 className="font-bold text-brand-900 flex items-center gap-2"><Package className="w-5 h-5" /> Articles commandés</h3>
               </div>
               <table className="w-full text-left text-sm text-brand-700">
                  <thead className="border-b border-brand-100 text-brand-500 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-6 font-medium">Produit</th>
                      <th className="py-3 px-6 font-medium text-center">Quantité</th>
                      <th className="py-3 px-6 font-medium text-right">Prix Unitaire</th>
                      <th className="py-3 px-6 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-4 px-6">
                          <p className="font-bold text-brand-900">{item.name}</p>
                          <p className="text-xs text-brand-400">ID: {item.id}</p>
                        </td>
                        <td className="py-4 px-6 text-center">{item.quantity}</td>
                        <td className="py-4 px-6 text-right">{item.price.toFixed(2)} DT</td>
                        <td className="py-4 px-6 text-right font-medium">{(item.price * item.quantity).toFixed(2)} DT</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               <div className="p-4 bg-brand-50/50 flex flex-col items-end gap-2 text-sm">
                  <div className="flex justify-between w-48 text-brand-600"><span>Sous-total:</span> <span>{selectedOrder.amount.toFixed(2)} DT</span></div>
                  <div className="flex justify-between w-48 text-brand-600"><span>Livraison:</span> <span>Offerte</span></div>
                  <div className="flex justify-between w-48 text-brand-900 font-bold text-base pt-2 border-t border-brand-200"><span>Total:</span> <span>{selectedOrder.amount.toFixed(2)} DT</span></div>
               </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-brand-100 shadow-sm">
              <h3 className="font-bold text-brand-900 mb-4">Informations Client</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-brand-900">{selectedOrder.customer}</p>
                  <p className="text-brand-500"><a href={`mailto:${selectedOrder.email}`} className="text-brand-600 hover:underline">{selectedOrder.email}</a></p>
                </div>
                <div className="pt-3 border-t border-brand-100">
                  <p className="font-medium text-brand-900 mb-1 flex justify-between">
                    Adresse de livraison
                    {selectedOrder.status === 'pending' && <button><Edit className="w-4 h-4 text-brand-400 hover:text-brand-900"/></button>}
                  </p>
                  <p className="text-brand-600 leading-relaxed">{selectedOrder.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-brand-100 shadow-sm">
              <h3 className="font-bold text-brand-900 mb-4">Paiement</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg"><Check className="w-5 h-5"/></div>
                <div>
                  <p className="text-sm font-medium text-brand-900">Payé ({selectedOrder.payment})</p>
                  <p className="text-xs text-brand-500">Le {selectedOrder.date}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white p-6 rounded-xl border border-brand-100 shadow-sm">
              <h3 className="font-bold text-brand-900 mb-4">Chronologie</h3>
              <div className="relative border-l-2 border-brand-100 ml-3 space-y-6">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-900 border-2 border-white"></div>
                  <p className="text-sm font-medium text-brand-900">Commande passée</p>
                  <p className="text-xs text-brand-400">{selectedOrder.date}</p>
                </div>
                {selectedOrder.status !== 'pending' && (
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-900 border-2 border-white"></div>
                    <p className="text-sm font-medium text-brand-900">Paiement validé</p>
                    <p className="text-xs text-brand-400">{selectedOrder.date}</p>
                  </div>
                )}
                {selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? (
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-900 border-2 border-white"></div>
                    <p className="text-sm font-medium text-brand-900">Commande expédiée</p>
                    <p className="text-xs text-brand-400">Le lendemain</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Remboursement */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-brand-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-brand-900 mb-4">Remboursement</h3>
              <p className="text-sm text-brand-600 mb-4">Initiez un remboursement pour la commande {selectedOrder.id}. Le client sera automatiquement averti par e-mail.</p>
              
              <label className="block text-sm font-medium text-brand-700 mb-1">Montant à rembourser (Max: {selectedOrder.amount} DT)</label>
              <input 
                type="number" 
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder={selectedOrder.amount.toString()}
                className="w-full px-4 py-2 border border-brand-200 rounded-lg mb-6 outline-none focus:border-brand-900" 
              />
              
              <div className="flex gap-3">
                <button onClick={() => setShowRefundModal(false)} className="flex-1 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-lg border border-brand-200">Annuler</button>
                <button onClick={handleRefund} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Rembourser</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Commandes ({orders.length})</h2>
        <div className="flex gap-3">
          {selectedBulk.length > 0 && (
            <button 
              onClick={handleBulkPrint}
              className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition shadow-sm font-medium animate-in fade-in"
            >
              <Printer className="w-4 h-4" /> Imprimer ({selectedBulk.length})
            </button>
          )}
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-brand-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input 
                type="text" 
                placeholder="Recherche par n°, client, email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
             <select className="border border-brand-200 rounded-lg px-4 py-2 text-sm text-brand-700 outline-none focus:border-brand-900 bg-white">
               <option>Tous les statuts</option>
               <option>En attente</option>
               <option>En préparation</option>
               <option>Expédiée</option>
               <option>Livrée</option>
             </select>
             <button className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 hover:bg-brand-50 transition text-sm font-medium bg-white">
                <Filter className="w-4 h-4" /> Filtres
              </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-700">
            <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 font-medium w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedBulk(e.target.checked ? orders.map(o => o.id) : [])}
                    checked={selectedBulk.length === orders.length && orders.length > 0}
                    className="rounded text-brand-900 focus:ring-brand-900" 
                  />
                </th>
                <th className="py-3 px-4 font-medium">Commande</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Client</th>
                <th className="py-3 px-4 font-medium">Statut</th>
                <th className="py-3 px-4 font-medium">Paiement</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
                <th className="py-3 px-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {orders.filter(o => o.id.includes(searchTerm) || o.customer.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                <tr key={order.id} className={`hover:bg-brand-50/50 transition-colors ${selectedBulk.includes(order.id) ? 'bg-brand-50/30' : ''}`}>
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      onChange={() => toggleBulkSelect(order.id)}
                      checked={selectedBulk.includes(order.id)}
                      className="rounded text-brand-900 focus:ring-brand-900" 
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-900">{order.id}</td>
                  <td className="py-3 px-4 text-brand-500">{order.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-brand-900">{order.customer}</div>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-brand-500">{order.payment}</td>
                  <td className="py-3 px-4 text-right font-medium text-brand-900">{order.amount.toFixed(2)} DT</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => setSelectedOrder(order)} className="p-1.5 border border-brand-200 rounded hover:bg-brand-100 text-brand-700 bg-white shadow-sm transition" title="Voir les détails">
                         <Eye className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
