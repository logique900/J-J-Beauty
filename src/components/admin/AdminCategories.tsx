import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, Move } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export function AdminCategories() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentCat, setCurrentCat] = useState<any>({ id: '', name: '', slug: '', description: '', status: 'Actif', position: 0, collections: [] as any[] });

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'categories'), orderBy('position', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Categories fetch error:", err);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if(window.confirm('Supprimer cette catégorie ?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  const handleSave = async () => {
    if (!currentCat.name) return alert('Nom requis');
    const slug = currentCat.slug || currentCat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    if (currentCat.id) {
      // Update
      const { id, ...data } = currentCat;
      await updateDoc(doc(db, 'categories', id), {
        ...data,
        slug,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create
      const { id, ...data } = currentCat;
      await addDoc(collection(db, 'categories'), { 
        ...data, 
        slug,
        count: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp() 
      });
    }

    setIsEditing(false);
    setCurrentCat({ id: '', name: '', slug: '', description: '', status: 'Actif', position: categories.length + 1, collections: [], coverImage: '', promo: { title: '', text: '', image: '' } });
  };

  const handleEdit = (cat: any) => {
    setCurrentCat({ ...cat, collections: cat.collections || [], promo: cat.promo || { title: '', text: '', image: '' } });
    setIsEditing(true);
  };

  const addCollection = () => {
    setCurrentCat({
      ...currentCat,
      collections: [...currentCat.collections, { id: 'col_' + Date.now(), name: '', slug: '' }]
    });
  };

  const removeCollection = (id: string) => {
    setCurrentCat({
      ...currentCat,
      collections: currentCat.collections.filter(c => c.id !== id)
    });
  };

  const updateCollection = (id: string, field: string, value: string) => {
    setCurrentCat({
      ...currentCat,
      collections: currentCat.collections.map(c => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  const filteredCategories = categories.filter(cat => 
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Catégories</h2>
        {!isEditing && (
          <button 
            onClick={() => {
              setCurrentCat({ id: '', name: '', slug: '', description: '', status: 'Actif', collections: [], position: categories.length + 1, coverImage: '', promo: { title: '', text: '', image: '' } });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouvelle Catégorie
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
                placeholder="Rechercher une catégorie..." 
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
                  <th className="py-3 px-4 font-medium w-12 text-center">Pos.</th>
                  <th className="py-3 px-4 font-medium">Catégorie</th>
                  <th className="py-3 px-4 font-medium">Slug</th>
                  <th className="py-3 px-4 font-medium text-center">Produits</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-brand-50/50 transition-colors group">
                    <td className="py-3 px-4 text-center cursor-move text-brand-400 group-hover:text-brand-900">
                      <div className="flex items-center justify-center gap-2">
                        <Move className="w-4 h-4" />
                        <span className="font-medium">{cat.position}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-400 overflow-hidden">
                        {cat.coverImage ? (
                          <img src={cat.coverImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                      <span className="font-bold text-brand-900">{cat.name}</span>
                    </td>
                     <td className="py-3 px-4 text-brand-500">/{cat.slug}</td>
                    <td className="py-3 px-4 text-center font-medium">{cat.count || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        cat.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 border border-brand-200 rounded hover:bg-brand-50 text-brand-600 bg-white transition" onClick={() => handleEdit(cat)}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 border border-red-200 rounded hover:bg-red-50 text-red-600 bg-white transition" onClick={() => handleDelete(cat.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-500">Aucune catégorie trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 max-w-3xl animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif font-bold text-brand-900">{currentCat.id ? 'Modifier la catégorie' : 'Créer une catégorie'}</h3>
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-brand-50 rounded-full transition"><X className="w-5 h-5 text-brand-500" /></button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Nom de la catégorie *</label>
                <input type="text" value={currentCat.name} onChange={e => setCurrentCat({...currentCat, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Ex: Nouveautés" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Slug (URL) *</label>
                <input type="text" value={currentCat.slug} onChange={e => setCurrentCat({...currentCat, slug: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none bg-brand-50" placeholder="nouveautes" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Description</label>
              <textarea rows={3} value={currentCat.description} onChange={e => setCurrentCat({...currentCat, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Description affichée en haut de la page catégorie..."></textarea>
            </div>

            <div className="border-t border-brand-100 pt-6">
              <h4 className="font-semibold text-brand-900 mb-4">Images & Promotion (Optionnel)</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Image de Banner (Cover URL)</label>
                  <input type="text" value={currentCat.coverImage || ''} onChange={e => setCurrentCat({...currentCat, coverImage: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="https://..." />
                  <p className="text-xs text-brand-500 mt-1">Image affichée en en-tête de la page catégorie de cette marque.</p>
                </div>
                
                <div className="bg-brand-50 p-4 rounded-xl space-y-4 border border-brand-100">
                  <h5 className="text-sm font-bold text-brand-900">Bloc Promo du Mega-Menu</h5>
                  <div>
                    <label className="block text-xs font-medium text-brand-700 mb-1">Titre principal</label>
                    <input type="text" value={currentCat.promo?.title || ''} onChange={e => setCurrentCat({...currentCat, promo: { ...currentCat.promo, image: currentCat.promo?.image || '', text: currentCat.promo?.text || '', title: e.target.value }})} className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-sm outline-none focus:border-brand-900" placeholder="Découvrir la collection..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-700 mb-1">Sous-titre (Sur-titre)</label>
                    <input type="text" value={currentCat.promo?.text || ''} onChange={e => setCurrentCat({...currentCat, promo: { ...currentCat.promo, image: currentCat.promo?.image || '', title: currentCat.promo?.title || '', text: e.target.value }})} className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-sm outline-none focus:border-brand-900" placeholder="Nouveautés" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-700 mb-1">Image Promo (URL)</label>
                    <input type="text" value={currentCat.promo?.image || ''} onChange={e => setCurrentCat({...currentCat, promo: { ...currentCat.promo, title: currentCat.promo?.title || '', text: currentCat.promo?.text || '', image: e.target.value }})} className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-sm outline-none focus:border-brand-900" placeholder="https://..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-brand-900">Collections (Sous-catégories)</h4>
                <button onClick={addCollection} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-900 transition">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>

              {currentCat.collections.length === 0 ? (
                <div className="text-sm text-brand-500 italic p-4 bg-brand-50 rounded-lg text-center">
                  Aucune collection pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCat.collections.map((col, idx) => (
                    <div key={col.id} className="flex gap-3 items-start bg-brand-50/50 p-3 rounded-xl border border-brand-100">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center font-bold text-brand-500 shrink-0 mt-1">{idx + 1}</div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          value={col.name} 
                          onChange={e => updateCollection(col.id, 'name', e.target.value)}
                          placeholder="Nom (ex: Fonds de teint)" 
                          className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-sm focus:ring-brand-900 focus:border-brand-900 outline-none"
                        />
                        <input 
                          type="text" 
                          value={col.group || ''} 
                          onChange={e => updateCollection(col.id, 'group', e.target.value)}
                          placeholder="Groupe (ex: TEINT)" 
                          className="w-full px-3 py-1.5 rounded-lg border border-brand-200 text-sm focus:ring-brand-900 focus:border-brand-900 outline-none uppercase"
                        />
                      </div>
                      <button onClick={() => removeCollection(col.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1">Statut</label>
              <select value={currentCat.status} onChange={e => setCurrentCat({...currentCat, status: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none bg-white">
                <option value="Actif">Actif</option>
                <option value="Brouillon">Brouillon</option>
              </select>
            </div>

            <div className="pt-6 border-t border-brand-100 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-6 py-2 border border-brand-200 rounded-lg text-brand-700 font-medium hover:bg-brand-50 transition">Annuler</button>
              <button onClick={handleSave} className="px-6 py-2 bg-brand-900 text-white rounded-lg font-bold hover:bg-brand-950 transition">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
