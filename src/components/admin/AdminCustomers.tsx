import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Mail, Gift, Tag, ChevronLeft, 
  Star, MapPin, CreditCard, MessageSquare, Download, MoreVertical, X,
  Save, AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, where, 
  doc, updateDoc, serverTimestamp, getDocs, limit 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast';

const getSegmentBadge = (segment: string) => {
  switch (segment) {
    case 'VIP': return <span className="px-3 py-1 bg-gradient-to-r from-amber-200 to-amber-300 text-amber-900 rounded-full text-xs font-bold shadow-sm w-max">VIP</span>;
    case 'Nouveau': return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold w-max">Nouveau</span>;
    case 'Régulier': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold w-max">Régulier</span>;
    case 'Inactif': return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold w-max">Inactif</span>;
    default: return <span className="px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-xs font-bold w-max">{segment}</span>;
  }
};

export function AdminCustomers() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegmentFilter, setActiveSegmentFilter] = useState('Tous');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detail states
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  
  // Modals
  const [showBulkActionModal, setShowBulkActionModal] = useState<'email' | 'points' | 'coupon' | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAmount, setPointsAmount] = useState(50);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Fetch all customers
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => {
        const data = doc.data();
        const totalSpent = data.totalSpent || 0;
        const ordersCount = data.ordersCount || 0;
        
        return {
          id: doc.id,
          name: data.name || data.displayName || 'Client Anonyme',
          email: data.email || '',
          phone: data.phone || data.phoneNumber || 'Non renseigné',
          joinDate: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString('fr-FR') : new Date(data.createdAt).toLocaleDateString('fr-FR')) : 'Récemment',
          ordersCount,
          totalSpent,
          loyaltyPoints: data.loyaltyPoints || 0,
          segment: totalSpent > 500 ? 'VIP' : (ordersCount > 1 ? 'Régulier' : 'Nouveau'),
          status: 'Actif',
          address: data.address || 'Adresse principale non définie',
          notes: data.notes || '',
        };
      });
      setCustomers(fetched);
      setLoading(false);

      if (selectedCustomer) {
        const updated = fetched.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(prev => ({ ...prev, ...updated }));
      }
    }, (err) => {
      console.error("Customers fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch detail info for selected customer
  useEffect(() => {
    if (!selectedCustomer?.id || !isAdmin) return;

    // Fetch orders
    const ordersQuery = query(
      collection(db, 'orders'), 
      where('userId', '==', selectedCustomer.id),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const orders = snap.docs.map(d => {
        const data = d.data();
        let dateStr = 'N/A';
        if (data.createdAt) {
          const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          dateStr = dateObj.toLocaleDateString('fr-FR');
        }
        return {
          id: d.id,
          date: dateStr,
          status: data.status,
          amount: data.totalAmount || 0
        };
      });
      setCustomerOrders(orders);
    }, (err) => {
      console.error("Customer orders fetch error:", err);
    });

    // Fetch addresses (from users subcollection if it exists, or from address field)
    const unsubAddresses = onSnapshot(collection(db, 'users', selectedCustomer.id, 'addresses'), (snap) => {
      const addresses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomerAddresses(addresses);
    }, (err) => {
      console.error("Customer addresses fetch error:", err);
    });

    return () => {
      unsubOrders();
      unsubAddresses();
    };
  }, [selectedCustomer?.id, isAdmin]);

  const handleUpdatePoints = async (id: string, amount: number) => {
    try {
      const customer = customers.find(c => c.id === id);
      if (!customer) return;
      
      const newPoints = (customer.loyaltyPoints || 0) + amount;
      await updateDoc(doc(db, 'users', id), {
        loyaltyPoints: newPoints,
        updatedAt: serverTimestamp()
      });
      setShowPointsModal(false);
      toast.success(`${amount} points ajoutés !`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour des points.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    try {
      await updateDoc(doc(db, 'users', selectedCustomer.id), {
        notes: tempNotes,
        updatedAt: serverTimestamp()
      });
      setIsEditingNotes(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour des notes.');
    }
  };

  const executeBulkAction = async () => {
    if (selectedBulk.length === 0) return;
    
    try {
      if (showBulkActionModal === 'points') {
        const batch = [];
        for (const id of selectedBulk) {
          const customer = customers.find(c => c.id === id);
          if (customer) {
            batch.push(updateDoc(doc(db, 'users', id), {
              loyaltyPoints: (customer.loyaltyPoints || 0) + pointsAmount,
              updatedAt: serverTimestamp()
            }));
          }
        }
        await Promise.all(batch);
        toast.success(`${pointsAmount} points ajoutés à ${selectedBulk.length} clients.`);
      } else if (showBulkActionModal === 'email') {
        // In a real app, this would call a cloud function or email API
        toast.success(`Simulation d'envoi d'email à ${selectedBulk.length} clients.\nObjet: ${emailSubject}`);
      } else if (showBulkActionModal === 'coupon') {
        toast.success(`Simulation de distribution de coupon à ${selectedBulk.length} clients.`);
      }
      
      setShowBulkActionModal(null);
      setSelectedBulk([]);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'action groupée.');
    }
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedBulk(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = activeSegmentFilter === 'Tous' || c.segment === activeSegmentFilter;
    return matchesSearch && matchesSegment;
  });

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'processing': return 'En préparation';
      case 'shipped': return 'Expédiée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-900 rounded-full animate-spin"></div>
        <p className="text-brand-500 font-medium italic">Chargement des clients...</p>
      </div>
    );
  }

  if (selectedCustomer) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-brand-100 rounded-lg transition-colors">
               <ChevronLeft className="w-5 h-5 text-brand-700" />
             </button>
             <div>
               <h2 className="text-2xl font-serif font-bold text-brand-900 flex items-center gap-3">
                 {selectedCustomer.name}
                 {getSegmentBadge(selectedCustomer.segment)}
               </h2>
               <p className="text-sm text-brand-500">ID: {selectedCustomer.id}</p>
             </div>
           </div>
           <div className="flex flex-wrap gap-2">
             <a 
               href={`mailto:${selectedCustomer.email}`}
               className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium text-sm"
             >
                <Mail className="w-4 h-4" /> Contacter par email
             </a>
             <button 
               onClick={() => {
                 setPointsAmount(50);
                 setShowPointsModal(true);
               }}
               className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm text-sm"
             >
                <Gift className="w-4 h-4" /> Offrir Points
             </button>
           </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-2"><CreditCard className="w-5 h-5" /></div>
             <div className="text-sm font-medium text-brand-500">Total Dépensé</div>
             <div className="text-2xl font-bold text-brand-900">{(selectedCustomer.totalSpent || 0).toFixed(2)} DT</div>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-2"><Star className="w-5 h-5 text-brand-600" /></div>
             <div className="text-sm font-medium text-brand-500">Points Fidélité</div>
             <div className="text-2xl font-bold text-brand-900">{selectedCustomer.loyaltyPoints || 0}</div>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-2"><Search className="w-5 h-5" /></div>
             <div className="text-sm font-medium text-brand-500">Panier Moyen</div>
             <div className="text-2xl font-bold text-brand-900">
               {selectedCustomer.ordersCount > 0 ? (selectedCustomer.totalSpent / selectedCustomer.ordersCount).toFixed(2) : '0.00'} DT
             </div>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-2"><MessageSquare className="w-5 h-5" /></div>
             <div className="text-sm font-medium text-brand-500">Commandes</div>
             <div className="text-2xl font-bold text-brand-900">{selectedCustomer.ordersCount || 0}</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Orders History */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-brand-100 flex justify-between items-center bg-brand-50/30">
                 <h3 className="font-bold text-brand-900">Historique des Commandes (Dernières 5)</h3>
               </div>
               {customerOrders.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-brand-700">
                      <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-xs">
                        <tr>
                          <th className="py-3 px-6 font-medium">Référence</th>
                          <th className="py-3 px-6 font-medium">Date</th>
                          <th className="py-3 px-6 font-medium">Statut</th>
                          <th className="py-3 px-6 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-50">
                        {customerOrders.map((order, idx) => (
                          <tr key={order.id} className="hover:bg-brand-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-brand-900">{order.id.slice(-8).toUpperCase()}</td>
                            <td className="py-4 px-6 text-brand-500">{order.date}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>{getStatusText(order.status)}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-medium">{order.amount.toFixed(2)} DT</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="p-12 text-center flex flex-col items-center">
                    <AlertCircle className="w-10 h-10 text-brand-100 mb-3" />
                    <p className="text-brand-500 text-sm">Ce client n'a pas encore passé de commande via l'application.</p>
                 </div>
               )}
            </div>

            {/* Address */}
            <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
               <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-500" /> Carnet d'Adresses</h3>
               
               {customerAddresses.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {customerAddresses.map((addr) => (
                      <div key={addr.id} className="p-4 border border-brand-200 rounded-xl relative group">
                        {addr.isDefault && (
                          <div className="absolute top-4 right-4 bg-brand-100 text-brand-800 text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-tighter">Par défaut</div>
                        )}
                        <p className="font-bold text-brand-900 mb-1">{addr.firstName} {addr.lastName}</p>
                        <p className="text-sm text-brand-600 leading-relaxed mb-1">{addr.address}</p>
                        <p className="text-sm text-brand-500">{addr.city}, {addr.zipCode}</p>
                        <p className="text-sm text-brand-400 mt-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> {addr.phone}</p>
                      </div>
                   ))}
                 </div>
               ) : (
                  <div className="p-4 border border-brand-200 rounded-xl bg-brand-50/10">
                    <p className="font-bold text-brand-900 mb-1">{selectedCustomer.name}</p>
                    <p className="text-sm text-brand-600 leading-relaxed">{selectedCustomer.address || "Aucune adresse principale renseignée."}</p>
                    <p className="text-sm text-brand-500 mt-2">{selectedCustomer.phone}</p>
                  </div>
               )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
              <h3 className="font-bold text-brand-900 mb-4">Contact</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-brand-500 mb-1 text-xs uppercase font-bold tracking-wider">Email</p>
                  <p className="font-medium text-brand-900 break-all">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-brand-500 mb-1 text-xs uppercase font-bold tracking-wider">Téléphone</p>
                  <p className="font-medium text-brand-900">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-brand-500 mb-1 text-xs uppercase font-bold tracking-wider">Membre depuis</p>
                  <p className="font-medium text-brand-900">{selectedCustomer.joinDate}</p>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm bg-amber-50/20">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-brand-900 flex items-center gap-2"><Tag className="w-4 h-4 text-amber-500" /> Notes Internes</h3>
                 <button 
                  onClick={() => {
                    if (isEditingNotes) {
                      handleSaveNotes();
                    } else {
                      setTempNotes(selectedCustomer.notes || '');
                      setIsEditingNotes(true);
                    }
                  }} 
                  className="text-brand-600 text-sm hover:underline font-medium flex items-center gap-1"
                >
                   {isEditingNotes ? <Save className="w-4 h-4" /> : 'Modifier'}
                 </button>
              </div>
              {isEditingNotes ? (
                <textarea 
                  rows={4} 
                  autoFocus
                  value={tempNotes}
                  onChange={e => setTempNotes(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg border border-amber-200 bg-white outline-none focus:ring-1 focus:ring-amber-500" 
                  placeholder="Informations spécifiques sur ce client (préférences, incidents, fidélisation...)"
                />
              ) : (
                <p className="text-sm text-brand-700 italic leading-relaxed">
                  {selectedCustomer.notes || "Ajoutez des notes privées pour l'équipe (ex: Client VIP, préfère la livraison le matin...)"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Individual Points Modal */}
        {showPointsModal && (
          <div className="fixed inset-0 bg-brand-950/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-center text-brand-900 mb-2">Offrir des points bonus</h3>
              <p className="text-sm text-center text-brand-500 mb-6 font-medium">Attribuer des points de fidélité à {selectedCustomer.name}</p>
              
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-3 gap-2">
                   {[50, 100, 250].map(val => (
                     <button 
                       key={val}
                       onClick={() => setPointsAmount(val)}
                       className={`py-2 rounded-lg border text-sm font-bold transition-all ${pointsAmount === val ? 'bg-brand-900 text-white border-brand-900 shadow-md' : 'border-brand-200 text-brand-700 hover:bg-brand-50'}`}
                     >
                       +{val}
                     </button>
                   ))}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={pointsAmount}
                    onChange={e => setPointsAmount(parseInt(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-brand-200 outline-none focus:border-brand-900 font-bold text-lg text-brand-900" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-brand-300">PTS</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowPointsModal(false)} className="flex-1 py-3 text-brand-700 font-bold hover:bg-brand-50 rounded-xl border border-brand-200 transition">Annuler</button>
                <button onClick={() => handleUpdatePoints(selectedCustomer.id, pointsAmount)} className="flex-1 py-3 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-950 transition shadow-lg">Confirmer</button>
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
        <h2 className="text-2xl font-serif font-bold text-brand-900">Clients ({customers.length})</h2>
        <div className="flex gap-3">
          {selectedBulk.length > 0 ? (
            <div className="flex gap-2 animate-in slide-in-from-right-4">
              <button 
                onClick={() => setShowBulkActionModal('email')}
                className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium text-sm"
              >
                <Mail className="w-4 h-4" /> Message Groupé
              </button>
              <button 
                onClick={() => setShowBulkActionModal('points')}
                className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm text-sm"
              >
                <Gift className="w-4 h-4" /> Offrir Points ({selectedBulk.length})
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                const headers = ['Nom', 'Email', 'Téléphone', 'Points', 'Dépenses', 'Segment'];
                const csv = [headers.join(','), ...customers.map(c => `"${c.name}","${c.email}","${c.phone}",${c.loyaltyPoints},${c.totalSpent},"${c.segment}"`)].join('\n');
                const eb = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(eb);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "liste-clients.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium text-sm"
            >
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        {/* Toolbar & Segments */}
        <div className="p-4 border-b border-brand-100 space-y-4 bg-brand-50/20">
           {/* Segments (Tabs) */}
           <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
             {['Tous', 'VIP', 'Régulier', 'Nouveau', 'Inactif'].map(seg => (
                <button 
                  key={seg}
                  onClick={() => setActiveSegmentFilter(seg)}
                  className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeSegmentFilter === seg 
                      ? 'bg-brand-900 text-white shadow-md' 
                      : 'bg-white border border-brand-100 text-brand-500 hover:bg-brand-50 shadow-sm'
                  }`}
                >
                  {seg}
                </button>
             ))}
           </div>
           
           <div className="flex flex-col sm:flex-row justify-between gap-4">
             <div className="flex-1 max-w-md">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                 <input 
                   type="text" 
                   placeholder="Nom, email, téléphone..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-brand-900/5 focus:border-brand-900 outline-none text-sm transition-all shadow-sm"
                 />
               </div>
             </div>
             <div className="text-xs text-brand-400 flex items-center font-medium">
               Affichage de {filteredCustomers.length} clients
             </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-700">
            <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="py-4 px-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedBulk(e.target.checked ? filteredCustomers.map(c => c.id) : [])}
                    checked={selectedBulk.length === filteredCustomers.length && filteredCustomers.length > 0}
                    className="rounded border-brand-200 text-brand-900 focus:ring-brand-900" 
                  />
                </th>
                <th className="py-4 px-4">Utilisateur</th>
                <th className="py-4 px-4">Catégorie</th>
                <th className="py-4 px-4 text-center">Achats</th>
                <th className="py-4 px-4 text-right">Loyalty</th>
                <th className="py-4 px-4 text-right">Total</th>
                <th className="py-4 px-4 text-center">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className={`hover:bg-brand-50/30 transition-colors group ${selectedBulk.includes(customer.id) ? 'bg-brand-50/50' : ''}`}>
                  <td className="py-4 px-4 text-center">
                    <input 
                      type="checkbox" 
                      onChange={() => toggleBulkSelect(customer.id)}
                      checked={selectedBulk.includes(customer.id)}
                      className="rounded border-brand-200 text-brand-900 focus:ring-brand-900" 
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-900 group-hover:text-brand-950">{customer.name}</span>
                      <span className="text-[11px] text-brand-400">{customer.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getSegmentBadge(customer.segment)}</td>
                  <td className="py-4 px-4 text-center font-medium font-mono">{customer.ordersCount}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-amber-600">
                      <Tag className="w-3 h-3" /> {customer.loyaltyPoints}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-black text-brand-900">{customer.totalSpent.toFixed(2)} DT</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center">
                       <button 
                        onClick={() => setSelectedCustomer(customer)} 
                        className="p-2 border border-brand-100 rounded-lg group-hover:border-brand-300 group-hover:bg-white shadow-sm transition-all text-brand-400 hover:text-brand-900"
                        title="Fiche client complète"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                 <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center">
                        <UserX className="w-12 h-12 text-brand-100 mb-2" />
                        <p className="text-brand-400 text-sm font-medium">Aucun client ne correspond à votre recherche.</p>
                      </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Modals */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-brand-950/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-serif font-black text-brand-900 mb-1">
              {showBulkActionModal === 'email' ? 'Action Marketing' : showBulkActionModal === 'coupon' ? 'Offre Promotionnelle' : 'Fidélisation Groupée'}
            </h3>
            <p className="text-sm text-brand-500 mb-8 font-medium">
               Vous allez impacter <strong className="text-brand-900 font-black">{selectedBulk.length} client(s)</strong>.
            </p>
            
            {showBulkActionModal === 'points' && (
               <div className="mb-8 p-4 bg-brand-50 rounded-xl border border-brand-100">
                 <label className="block text-xs font-black uppercase text-brand-400 mb-2 tracking-widest">Points à créditer</label>
                 <div className="relative">
                   <input 
                    type="number" 
                    value={pointsAmount} 
                    onChange={e => setPointsAmount(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-brand-200 outline-none focus:border-brand-900 font-bold text-xl" 
                   />
                   <Gift className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-200" />
                 </div>
               </div>
            )}
            
            {showBulkActionModal === 'email' && (
               <div className="mb-8 space-y-4">
                 <div>
                   <label className="block text-xs font-black uppercase text-brand-400 mb-1 tracking-widest">Objet de l'email</label>
                   <input 
                    type="text" 
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Une surprise vous attend chez J-J Beauty..." 
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-200 outline-none focus:border-brand-900 text-sm" 
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black uppercase text-brand-400 mb-1 tracking-widest">Contenu du message</label>
                   <textarea 
                    rows={4} 
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    placeholder="Bonjour, en tant que client privilégié..." 
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-200 outline-none focus:border-brand-900 text-sm"
                   ></textarea>
                 </div>
               </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setShowBulkActionModal(null)} className="flex-1 py-3 text-brand-700 font-bold hover:bg-brand-50 rounded-xl border border-brand-200 transition">Annuler</button>
              <button onClick={executeBulkAction} className="flex-1 py-3 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-950 transition shadow-lg">Confirmer l'action</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing icon
function UserX(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" />
    </svg>
  );
}
