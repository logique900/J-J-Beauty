import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export function AdminBrands() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [newBrand, setNewBrand] = useState({ name: '', website: '', description: '', status: 'Actif' });

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Brands fetch error:", err);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if(window.confirm('Supprimer cette marque ?')) {
      await deleteDoc(doc(db, 'brands', id));
    }
  };

  const handleCreate = async () => {
    if (!newBrand.name) return alert('Nom requis');
    await addDoc(collection(db, 'brands'), { 
      ...newBrand, 
      count: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setIsEditing(false);
    setNewBrand({ name: '', website: '', description: '', status: 'Actif' });
  };

  const filteredBrands = brands.filter(brand => 
    brand.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Marques partenaires</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouvelle Marque
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brand-100 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input 
                type="text" 
                placeholder="Rechercher une marque..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-brand-700">
              <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 font-medium w-16 text-center">ID</th>
                  <th className="py-3 px-4 font-medium">Marque</th>
                  <th className="py-3 px-4 font-medium">Site Web</th>
                  <th className="py-3 px-4 font-medium text-center">Produits</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredBrands.map(brand => (
                  <tr key={brand.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-xs text-brand-400">{brand.id.slice(0, 6)}</td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-brand-200 flex items-center justify-center text-brand-400 shadow-sm overflow-hidden">
                         <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-brand-900">{brand.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      {brand.website ? (
                        <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-900 flex items-center gap-1">
                          {brand.website.replace('https://', '').replace('http://', '')} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{brand.count || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        brand.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {brand.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 border border-red-200 rounded hover:bg-red-50 text-red-600 bg-white transition" onClick={() => handleDelete(brand.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBrands.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-500">Aucune marque trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 max-w-3xl animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif font-bold text-brand-900">Créer une marque</h3>
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-brand-50 rounded-full transition"><X className="w-5 h-5 text-brand-500" /></button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Nom de la marque *</label>
                <input type="text" value={newBrand.name} onChange={e => setNewBrand({...newBrand, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Ex: Glow & Co" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Site Officiel</label>
                <input type="url" value={newBrand.website} onChange={e => setNewBrand({...newBrand, website: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="https://..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Description (Histoire, Valeurs)</label>
              <textarea rows={4} value={newBrand.description} onChange={e => setNewBrand({...newBrand, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Présentation de la marque pour la page dédiée..."></textarea>
            </div>

            <div className="pt-6 border-t border-brand-100 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2 border border-brand-200 rounded-lg text-brand-700 font-medium hover:bg-brand-50 transition">Annuler</button>
              <button onClick={handleCreate} className="px-6 py-2 bg-brand-900 text-white rounded-lg font-bold hover:bg-brand-950 transition">Enregistrer la marque</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
