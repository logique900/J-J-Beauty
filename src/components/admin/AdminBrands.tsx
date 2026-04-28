import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, ExternalLink, Filter, Check, MoreVertical } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ImageUploader } from './ImageUploader';
import { toast } from '../../lib/toast';

export function AdminBrands() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    website: '', 
    description: '', 
    status: 'Actif',
    logoUrl: '',
    bannerUrl: ''
  });

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Brands fetch error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if(window.confirm('Êtes-vous sûr de vouloir supprimer cette marque ? Cette action est irréversible.')) {
      try {
        await deleteDoc(doc(db, 'brands', id));
        toast.success('Marque supprimée avec succès');
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  const handleEdit = (brand: any) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name || '',
      website: brand.website || '',
      description: brand.description || '',
      status: brand.status || 'Actif',
      logoUrl: brand.logoUrl || '',
      bannerUrl: brand.bannerUrl || ''
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.success('Le nom de la marque est requis');
    
    try {
      if (selectedBrand) {
        // Update
        await updateDoc(doc(db, 'brands', selectedBrand.id), {
          ...formData,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          updatedAt: serverTimestamp()
        });
        toast.success('Marque mise à jour !');
      } else {
        // Create
        await addDoc(collection(db, 'brands'), { 
          ...formData, 
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          count: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Nouvelle marque créée !');
      }
      
      setIsEditing(false);
      setSelectedBrand(null);
      setFormData({ name: '', website: '', description: '', status: 'Actif', logoUrl: '', bannerUrl: '' });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement.');
    }
  };

  const toggleStatus = async (brand: any) => {
    const newStatus = brand.status === 'Actif' ? 'Brouillon' : 'Actif';
    try {
      await updateDoc(doc(db, 'brands', brand.id), { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBrands = brands.filter(brand => 
    brand.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-brand-500">Chargement des marques...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-brand-900">Marques partenaires</h2>
          <p className="text-sm text-brand-500">Gérez les marques affichées sur votre boutique et leurs informations.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => {
              setSelectedBrand(null);
              setFormData({ name: '', website: '', description: '', status: 'Actif', logoUrl: '' });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-xl hover:bg-brand-950 transition font-bold shadow-lg shadow-brand-900/20"
          >
            <Plus className="w-5 h-5" /> Ajouter une Marque
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brand-100 flex flex-col sm:flex-row justify-between gap-4 bg-brand-50/30">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input 
                type="text" 
                placeholder="Rechercher une marque par nom..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none text-sm transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-xl text-brand-700 bg-white hover:bg-brand-50 transition text-sm font-medium shadow-sm">
                 <Filter className="w-4 h-4" /> Filtres
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-brand-700">
              <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="py-4 px-6 font-bold">Aperçu</th>
                  <th className="py-4 px-6 font-bold">Marque</th>
                  <th className="py-4 px-6 font-bold">Lien Officiel</th>
                  <th className="py-4 px-6 font-bold text-center">Produits</th>
                  <th className="py-4 px-6 font-bold">Statut</th>
                  <th className="py-3 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredBrands.map(brand => (
                  <tr key={brand.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="w-16 h-12 rounded-lg bg-white border border-brand-100 p-2 flex items-center justify-center text-brand-400 shadow-sm overflow-hidden group-hover:border-brand-300 transition-colors">
                         {brand.logoUrl ? (
                           <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain" />
                         ) : (
                           <ImageIcon className="w-5 h-5 opacity-30" />
                         )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <p className="font-bold text-brand-900">{brand.name}</p>
                       <p className="text-[10px] font-mono text-brand-400 uppercase tracking-tighter">ID: {brand.id.slice(0, 12)}</p>
                    </td>
                    <td className="py-4 px-6">
                      {brand.website ? (
                        <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-900 flex items-center gap-1.5 font-medium">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="max-w-[150px] truncate">{brand.website.replace('https://', '').replace('http://', '').replace('www.', '')}</span>
                        </a>
                      ) : <span className="text-brand-300 italic text-xs italic">Non renseigné</span>}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-brand-900">
                      <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded text-xs">{brand.count || 0}</span>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => toggleStatus(brand)}
                        className={`group px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all ${
                          brand.status === 'Actif' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-brand-100 text-brand-500 hover:bg-brand-200'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${brand.status === 'Actif' ? 'bg-green-500 animate-pulse' : 'bg-brand-400'}`}></div>
                        {brand.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 border border-brand-200 rounded-lg hover:bg-brand-900 hover:text-white text-brand-700 bg-white shadow-sm transition" onClick={() => handleEdit(brand)}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 border border-red-100 rounded-lg hover:bg-red-600 hover:text-white text-red-600 bg-white shadow-sm transition" onClick={() => handleDelete(brand.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBrands.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                       <ImageIcon className="w-12 h-12 text-brand-100 mx-auto mb-3" />
                       <p className="text-brand-500 font-medium">Aucune marque trouvée.</p>
                       <button onClick={() => setSearchTerm('')} className="text-brand-900 text-sm font-bold mt-2 hover:underline">Effacer la recherche</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-100 shadow-xl overflow-hidden max-w-4xl mx-auto animate-in zoom-in-95 duration-200">
          <div className="bg-brand-900 p-6 flex justify-between items-center text-white">
            <div>
              <h3 className="text-xl font-serif font-bold">{selectedBrand ? 'Modifier la marque' : 'Nouvelle marque partenaire'}</h3>
              <p className="text-brand-100 text-sm">Remplissez les informations détaillées de la marque.</p>
            </div>
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wide">Identité de la Marque</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-500 mb-1">Nom commercial *</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none transition-all" 
                        placeholder="Ex: Sephora, Lancôme..." 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-500 mb-1">Statut initial</label>
                      <div className="flex gap-2">
                        {['Actif', 'Brouillon'].map(s => (
                          <button 
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, status: s})}
                            className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${
                              formData.status === s 
                                ? 'bg-brand-900 border-brand-900 text-white shadow-md' 
                                : 'bg-white border-brand-100 text-brand-400 hover:border-brand-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wide">Liens Externes</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-500 mb-1">URL Site Web Officiel</label>
                      <input 
                        type="url" 
                        value={formData.website} 
                        onChange={e => setFormData({...formData, website: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none transition-all" 
                        placeholder="https://www.exemple.com" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wide">Visuels & Branding</label>
                  <div className="space-y-4">
                    <ImageUploader 
                      label="Logo de la Marque (Fonds transparent conseillé)"
                      value={formData.logoUrl}
                      onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                      folder="brands/logos"
                    />
                    <ImageUploader 
                      label="Bannière de la Marque (Facultatif - Apparaît en haut de page)"
                      value={formData.bannerUrl}
                      onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
                      folder="brands/banners"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wide">Biographie de la marque</label>
              <textarea 
                rows={5} 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full px-4 py-4 rounded-2xl border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none transition-all" 
                placeholder="Racontez l'histoire de la marque, ses valeurs et ses engagements..."
              ></textarea>
            </div>

            <div className="pt-8 border-t border-brand-50 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="px-8 py-3 border border-brand-200 rounded-xl text-brand-700 font-bold hover:bg-brand-50 transition min-w-[150px]"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-brand-900 text-white rounded-xl font-bold hover:bg-brand-950 transition min-w-[200px] shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> {selectedBrand ? 'Enregistrer les modifications' : 'Créer la marque'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
