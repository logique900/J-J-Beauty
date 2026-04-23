import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Mail, Gift, Tag, ChevronLeft, 
  Star, MapPin, CreditCard, MessageSquare, Download, MoreVertical, X 
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

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
  
  // Modals simulation
  const [showBulkActionModal, setShowBulkActionModal] = useState<'email' | 'points' | 'coupon' | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Client Anonyme',
          email: data.email || '',
          phone: data.phone || 'Non renseigné',
          joinDate: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString() : new Date(data.createdAt).toLocaleDateString()) : 'Récemment',
          ordersCount: data.ordersCount || 0,
          totalSpent: data.totalSpent || 0,
          loyaltyPoints: data.loyaltyPoints || 0,
          segment: data.totalSpent > 500 ? 'VIP' : (data.ordersCount > 1 ? 'Régulier' : 'Nouveau'),
          status: 'Actif',
          address: 'Adresse non renseignée',
          notes: data.notes || '',
          recentOrders: [] // Could be populated via a subquery or cloud function in a real app
        };
      });
      setCustomers(fetched);

      if (selectedCustomer) {
        const updated = fetched.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }
    }, (err) => {
      console.error("Customers fetch error:", err);
    });

    return () => unsubscribe();
  }, [selectedCustomer?.id, isAdmin]);

  const toggleBulkSelect = (id: string) => {
    if (selectedBulk.includes(id)) {
      setSelectedBulk(selectedBulk.filter(i => i !== id));
    } else {
      setSelectedBulk([...selectedBulk, id]);
    }
  };

  const executeBulkAction = () => {
    alert(`Action exécutée sur ${selectedBulk.length} clients sélectionnés.`);
    setShowBulkActionModal(null);
    setSelectedBulk([]);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = activeSegmentFilter === 'Tous' || c.segment === activeSegmentFilter;
    return matchesSearch && matchesSegment;
  });

  if (selectedCustomer) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Detail Header */}
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-4">
             <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-brand-100 rounded-lg transition-colors">
               <ChevronLeft className="w-5 h-5 text-brand-700" />
             </button>
             <h2 className="text-2xl font-serif font-bold text-brand-900 flex items-center gap-3">
               {selectedCustomer.name}
               {getSegmentBadge(selectedCustomer.segment)}
             </h2>
           </div>
           <div className="flex gap-2">
             <button className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium text-sm">
                <Mail className="w-4 h-4" /> Envoyer Email
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm text-sm">
                <Gift className="w-4 h-4" /> Offrir Points
             </button>
           </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-2"><CreditCard className="w-5 h-5" /></div>
             <div className="text-sm font-medium text-brand-500">Total Dépensé</div>
             <div className="text-2xl font-bold text-brand-900">{selectedCustomer.totalSpent.toFixed(2)} DT</div>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-brand-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 mb-2"><Star className="w-5 h-5" /></div>
             <div className="text-sm font-medium text-brand-500">Points Fidélité</div>
             <div className="text-2xl font-bold text-brand-900">{selectedCustomer.loyaltyPoints}</div>
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
             <div className="text-sm font-medium text-brand-500">Tickets Support</div>
             <div className="text-2xl font-bold text-brand-900">0</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Orders History */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-brand-100 flex justify-between items-center">
                 <h3 className="font-bold text-brand-900">Historique des Commandes ({selectedCustomer.ordersCount})</h3>
                 <button className="text-sm text-brand-600 font-medium hover:text-brand-900">Voir tout</button>
               </div>
               {selectedCustomer.recentOrders.length > 0 ? (
                 <table className="w-full text-left text-sm text-brand-700">
                    <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-xs">
                      <tr>
                        <th className="py-3 px-6 font-medium">Commande</th>
                        <th className="py-3 px-6 font-medium">Date</th>
                        <th className="py-3 px-6 font-medium">Statut</th>
                        <th className="py-3 px-6 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50">
                      {selectedCustomer.recentOrders.map((order, idx) => (
                        <tr key={idx} className="hover:bg-brand-50/50 transition-colors cursor-pointer">
                          <td className="py-4 px-6 font-bold text-brand-900">{order.id}</td>
                          <td className="py-4 px-6 text-brand-500">{order.date}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              order.status === 'Confirmée' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Livrée' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>{order.status}</span>
                          </td>
                          <td className="py-4 px-6 text-right font-medium">{order.amount.toFixed(2)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               ) : (
                 <div className="p-8 text-center text-brand-500 text-sm">Ce client n'a pas encore passé de commande.</div>
               )}
            </div>

            {/* Address */}
            <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
               <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-500" /> Adresses Enregistrées</h3>
               <div className="p-4 border border-brand-200 rounded-xl relative">
                  <div className="absolute top-4 right-4 bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded">Par défaut</div>
                  <p className="font-bold text-brand-900 mb-1">{selectedCustomer.name}</p>
                  <p className="text-sm text-brand-600 leading-relaxed">{selectedCustomer.address}</p>
                  <p className="text-sm text-brand-500 mt-2">{selectedCustomer.phone}</p>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
              <h3 className="font-bold text-brand-900 mb-4">Contact</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-brand-500 mb-1">Email</p>
                  <p className="font-medium text-brand-900 break-all">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-brand-500 mb-1">Téléphone</p>
                  <p className="font-medium text-brand-900">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-brand-500 mb-1">Inscrit(e) le</p>
                  <p className="font-medium text-brand-900">{selectedCustomer.joinDate}</p>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm bg-yellow-50/30">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-brand-900">Notes Internes</h3>
                 <button className="text-brand-600 text-sm hover:underline font-medium">Modifier</button>
              </div>
              <p className="text-sm text-brand-700 italic">
                {selectedCustomer.notes || "Aucune note interne pour ce client."}
              </p>
            </div>
          </div>
        </div>
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
            <div className="flex gap-2 animate-in fade-in">
              <button 
                onClick={() => setShowBulkActionModal('email')}
                className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium"
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button 
                onClick={() => setShowBulkActionModal('coupon')}
                className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium"
              >
                <Tag className="w-4 h-4" /> Code Promo
              </button>
              <button 
                onClick={() => setShowBulkActionModal('points')}
                className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm"
              >
                <Gift className="w-4 h-4" /> Points Bonus
              </button>
            </div>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium">
              <Download className="w-4 h-4" /> Exporter
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        {/* Toolbar & Segments */}
        <div className="p-4 border-b border-brand-100 space-y-4">
           {/* Segments (Tabs) */}
           <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
             {['Tous', 'VIP', 'Régulier', 'Nouveau', 'Inactif'].map(seg => (
                <button 
                  key={seg}
                  onClick={() => setActiveSegmentFilter(seg)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    activeSegmentFilter === seg 
                      ? 'bg-brand-900 text-white' 
                      : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                  }`}
                >
                  {seg}
                </button>
             ))}
           </div>
           
           <div className="flex flex-col sm:flex-row justify-between gap-4">
             <div className="flex-1 max-w-md flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                 <input 
                   type="text" 
                   placeholder="Rechercher un client (nom, email)..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none text-sm"
                 />
               </div>
             </div>
             <button className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 hover:bg-brand-50 transition text-sm font-medium">
               <Filter className="w-4 h-4" /> Plus de Filtres
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
                    onChange={(e) => setSelectedBulk(e.target.checked ? filteredCustomers.map(c => c.id) : [])}
                    checked={selectedBulk.length === filteredCustomers.length && filteredCustomers.length > 0}
                    className="rounded text-brand-900 focus:ring-brand-900" 
                  />
                </th>
                <th className="py-3 px-4 font-medium">Client</th>
                <th className="py-3 px-4 font-medium">Segment</th>
                <th className="py-3 px-4 font-medium">Commandes</th>
                <th className="py-3 px-4 font-medium text-right">Total Dépensé</th>
                <th className="py-3 px-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className={`hover:bg-brand-50/50 transition-colors ${selectedBulk.includes(customer.id) ? 'bg-brand-50/30' : ''}`}>
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      onChange={() => toggleBulkSelect(customer.id)}
                      checked={selectedBulk.includes(customer.id)}
                      className="rounded text-brand-900 focus:ring-brand-900" 
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-900">{customer.name}</div>
                    <div className="text-xs text-brand-500">{customer.email}</div>
                  </td>
                  <td className="py-3 px-4">{getSegmentBadge(customer.segment)}</td>
                  <td className="py-3 px-4 font-medium">{customer.ordersCount}</td>
                  <td className="py-3 px-4 text-right font-bold text-brand-900">{customer.totalSpent.toFixed(2)} DT</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => setSelectedCustomer(customer)} className="p-1.5 border border-brand-200 rounded hover:bg-brand-100 text-brand-700 bg-white shadow-sm transition" title="Voir la fiche">
                         <Eye className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                 <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-500">Aucun client trouvé pour ces critères.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Modal Simulation */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-brand-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-serif font-bold text-brand-900 mb-2">
              {showBulkActionModal === 'email' ? 'Campagne Email' : showBulkActionModal === 'coupon' ? 'Distribuer Code Promo' : 'Attribuer Points Bonus'}
            </h3>
            <p className="text-sm text-brand-600 mb-6">
               Action groupée pour <strong className="text-brand-900">{selectedBulk.length} client(s)</strong> sélectionné(s).
            </p>
            
            {showBulkActionModal === 'points' && (
               <div className="mb-6">
                 <label className="block text-sm font-medium text-brand-700 mb-1">Nombre de points à ajouter</label>
                 <input type="number" defaultValue={50} className="w-full px-4 py-2 border border-brand-200 rounded-lg outline-none focus:border-brand-900" />
               </div>
            )}
            
            {showBulkActionModal === 'coupon' && (
               <div className="mb-6">
                 <label className="block text-sm font-medium text-brand-700 mb-1">Code Promo (ex: VIP20)</label>
                 <input type="text" placeholder="Entrez le code..." className="w-full px-4 py-2 border border-brand-200 rounded-lg outline-none focus:border-brand-900 text-transform uppercase" />
               </div>
            )}

            {showBulkActionModal === 'email' && (
               <div className="mb-6 space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-brand-700 mb-1">Sujet</label>
                   <input type="text" placeholder="Découvrez nos nouveautés..." className="w-full px-4 py-2 border border-brand-200 rounded-lg outline-none focus:border-brand-900" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-brand-700 mb-1">Message</label>
                   <textarea rows={4} placeholder="Bonjour {prenom}..." className="w-full px-4 py-2 border border-brand-200 rounded-lg outline-none focus:border-brand-900"></textarea>
                 </div>
               </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setShowBulkActionModal(null)} className="flex-1 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-lg border border-brand-200 transition">Annuler</button>
              <button onClick={executeBulkAction} className="flex-1 py-2 bg-brand-900 text-white font-bold rounded-lg hover:bg-brand-950 transition">Confirmer l'envoi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
