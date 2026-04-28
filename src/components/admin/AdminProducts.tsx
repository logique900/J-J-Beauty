import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Copy, Archive, Filter, Upload, Download, MoreVertical, X, Image as ImageIcon } from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { ImageUploader } from './ImageUploader';
import { toast } from '../../lib/toast';

export function AdminProducts() {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New product form state
  const initialState = {
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    originalPrice: 0,
    cost: 0,
    sku: '',
    stock: 0,
    status: 'draft',
    category: 'Soin Visage',
    categoryId: '',
    brand: '',
    brandId: '',
    tags: '',
    images: [] as string[]
  };

  const [newProduct, setNewProduct] = useState(initialState);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const fetchedProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(fetchedProducts);
      setLoading(false);
    }, (err) => {
      console.error("Products fetch error:", err);
      setLoading(false);
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
        const fetchedCats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCats);
    }, (err) => {
      console.error("Categories fetch error:", err);
    });

    const unsubBrands = onSnapshot(collection(db, 'brands'), (snap) => {
        const fetchedBrands = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBrands(fetchedBrands);
    }, (err) => {
      console.error("Brands fetch error:", err);
    });

    return () => {
        unsubProducts();
        unsubCategories();
        unsubBrands();
    };
  }, [isAdmin]);

  const handleEditClick = (product: any) => {
    setNewProduct({
      name: product.name || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      cost: product.cost || 0,
      sku: product.sku || '',
      stock: product.stock || 0,
      status: product.status || 'draft',
      category: product.category || 'Soin Visage',
      categoryId: product.categoryId || '',
      brand: product.brand || '',
      brandId: product.brandId || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      images: product.images || []
    });
    setEditProductId(product.id);
    setIsEditing(true);
  };

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const confirmDeleteAction = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      toast.success('Contenu supprimé avec succès');
    } catch (err: any) {
      console.error("Delete Error", err);
      toast.error(`Erreur lors de la suppression: ${err.message || 'Permissions insuffisantes'}`);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProductToDelete(id);
  };

  const handleDuplicate = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const productData: any = {
        name: `${product.name || 'Produit'} (Copie)`,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        price: Number(product.price) || 0,
        originalPrice: Number(product.originalPrice) || 0,
        cost: Number(product.cost) || 0,
        sku: product.sku ? `${product.sku}-COPY` : '',
        stock: Number(product.stock) || 0,
        status: 'draft',
        category: product.category || 'Soin Visage',
        tags: Array.isArray(product.tags) ? product.tags : (typeof product.tags === 'string' ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
        images: product.images || [],
        slug: `${product.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'produit'}-copie-${Date.now()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (product.categoryId) {
        productData.categoryId = product.categoryId;
      }
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      toast.success('Produit dupliqué avec succès en mode brouillon !');
    } catch (err: any) {
      console.error("Duplicate Error", err);
      toast.error(`Erreur lors de la duplication: ${err.message || 'Vérifiez les règles de sécurité'}`);
    }
  };

  const handleExportCSV = () => {
    // Basic CSV Export implementation
    const headers = ['ID', 'Nom', 'SKU', 'Prix', 'Stock', 'Categorie', 'Statut'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n'
      + products.map(p => {
          return `${p.id},"${p.name || ''}",${p.sku || ''},${p.price || 0},${p.stock || 0},"${p.category || ''}",${p.status || ''}`;
        }).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export-produits-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      // Very basic UI feedback since implementing a full CSV parser handles is out of immediate scope 
      // but showing feedback helps user know it "works".
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.info(`Fichier ${file.name} reçu. L'importateur de CSV est en phase de test et sera activé prochainement.`);
      }
    };
    input.click();
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        price: Number(newProduct.price) || 0,
        originalPrice: Number(newProduct.originalPrice) || 0,
        cost: Number(newProduct.cost) || 0,
        stock: Number(newProduct.stock) || 0,
        tags: typeof newProduct.tags === 'string' ? newProduct.tags.split(',').map(t => t.trim()).filter(t => t !== '') : newProduct.tags,
        updatedAt: serverTimestamp()
      };

      if (editProductId) {
        await updateDoc(doc(db, 'products', editProductId), {
          ...productData,
        });
        toast.success('Produit mis à jour avec succès !');
      } else {
        const slug = newProduct.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        await addDoc(collection(db, 'products'), {
          ...productData,
          slug,
          createdAt: serverTimestamp()
        });
        toast.success('Produit créé avec succès !');
      }

      setIsEditing(false);
      setEditProductId(null);
      setNewProduct(initialState);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement du produit.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Produits</h2>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleImportCSVClick} className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 bg-white hover:bg-brand-50 transition shadow-sm font-medium">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button 
            onClick={() => {
              setEditProductId(null);
              setNewProduct(initialState);
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau Produit
          </button>
        </div>
      </div>

      {!isEditing ? (
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
            <button className="flex items-center gap-2 px-4 py-2 border border-brand-200 rounded-lg text-brand-700 hover:bg-brand-50 transition text-sm font-medium">
              <Filter className="w-4 h-4" /> Filtres
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-brand-700">
              <thead className="bg-brand-50/50 border-b border-brand-100 text-brand-500 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 font-medium w-12"><input type="checkbox" className="rounded text-brand-900 focus:ring-brand-900" /></th>
                  <th className="py-3 px-4 font-medium">Produit</th>
                  <th className="py-3 px-4 font-medium">Catégorie</th>
                  <th className="py-3 px-4 font-medium">Prix</th>
                  <th className="py-3 px-4 font-medium">Stock</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.id?.includes(searchTerm)).map(product => (
                  <tr key={product.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="py-3 px-4"><input type="checkbox" className="rounded text-brand-900 focus:ring-brand-900" /></td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-brand-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-brand-100 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-brand-900">{product.name}</div>
                        <div className="text-xs text-brand-400">SKU: {product.sku || product.id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{product.category}</td>
                    <td className="py-3 px-4 font-medium text-brand-900">{(product.price || 0).toFixed(2)} DT</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {product.status === 'active' ? 'Actif' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => handleEditClick(product)} className="p-1 hover:text-brand-900 transition"><Edit2 className="w-4 h-4" /></button>
                        <button type="button" onClick={(e) => handleDuplicate(product, e)} className="p-1 hover:text-brand-900 transition"><Copy className="w-4 h-4" /></button>
                        <button type="button" onClick={(e) => handleDelete(product.id, e)} className="p-1 text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-brand-100 flex items-center justify-between text-sm text-brand-500">
            <span>Affichage de {products.length > 0 ? '1 à ' + products.length : '0'} sur {products.length} produits</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-brand-200 rounded hover:bg-brand-50">Précédent</button>
              <button className="px-3 py-1 border border-brand-200 rounded hover:bg-brand-50">Suivant</button>
            </div>
          </div>
          
          {/* Modal suppression produit */}
          {productToDelete && (
            <div className="fixed inset-0 bg-brand-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-xl font-bold text-brand-900 mb-4">Supprimer le produit ?</h3>
                <p className="text-sm text-brand-600 mb-6">Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={() => setProductToDelete(null)} className="flex-1 py-2 text-brand-700 font-medium hover:bg-brand-50 rounded-lg border border-brand-200 transition">Annuler</button>
                  <button onClick={confirmDeleteAction} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">Confirmer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif font-bold text-brand-900">{editProductId ? 'Modifier le produit' : 'Créer un nouveau produit'}</h3>
            <button onClick={() => { setIsEditing(false); setEditProductId(null); }} className="p-2 hover:bg-brand-50 rounded-full transition"><X className="w-5 h-5 text-brand-500" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h4 className="font-bold text-brand-900 border-b border-brand-100 pb-2">Informations Générales</h4>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Nom du produit *</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Ex: Sérum Hydratant Intense" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Description courte</label>
                  <textarea rows={2} value={newProduct.shortDescription} onChange={e => setNewProduct({...newProduct, shortDescription: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Un bref résumé pour les aperçus"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Description détaillée (Éditeur riche)</label>
                  <textarea rows={5} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Description complète du produit, ingrédients, conseils d'utilisation..."></textarea>
                </div>
              </div>

              {/* Médias */}
              <div className="space-y-4">
                <h4 className="font-bold text-brand-900 border-b border-brand-100 pb-2 flex justify-between items-center">
                  Médias 
                  <span className="text-xs font-normal text-brand-400">{newProduct.images.length} fichier(s)</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {newProduct.images.map((img, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-brand-100 shadow-sm">
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-brand-900/80 text-white text-[10px] py-1 text-center font-bold">
                          Principale
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {newProduct.images.length < 5 && (
                    <div className="aspect-square">
                      <ImageUploader 
                        label=""
                        value=""
                        onChange={(url) => {
                          if (url) setNewProduct(prev => ({ ...prev, images: [...prev.images, url] }));
                        }}
                        folder="products"
                        className="h-full"
                      />
                    </div>
                  )}
                </div>

                {newProduct.images.length === 0 && (
                  <div 
                    className="border-2 border-dashed border-brand-200 rounded-xl p-8 flex flex-col items-center justify-center text-brand-500 bg-brand-50/30"
                  >
                    <ImageIcon className="w-10 h-10 mb-3 text-brand-300" />
                    <p className="font-medium text-brand-700 text-center">Aucune image sélectionnée</p>
                    <p className="text-xs mt-1 text-brand-400 text-center">Utilisez le bouton ci-dessus pour ajouter des images</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Prix */}
              <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 space-y-4">
                <h4 className="font-bold text-brand-900">Prix & Taxes</h4>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Prix de vente (DT) *</label>
                  <input type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Prix comparatif (Avant réduction)</label>
                  <input type="number" value={newProduct.originalPrice || ''} onChange={e => setNewProduct({...newProduct, originalPrice: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Coût d'achat (Optionnel)</label>
                  <input type="number" value={newProduct.cost || ''} onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="0.00" />
                </div>
              </div>

              {/* Inventaire */}
              <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 space-y-4">
                <h4 className="font-bold text-brand-900">Inventaire</h4>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">SKU (Unité de Stock)</label>
                  <input type="text" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Quantité disponible</label>
                  <input type="number" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" />
                </div>
              </div>

              {/* Organisation */}
              <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 space-y-4">
                <h4 className="font-bold text-brand-900">Organisation</h4>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Statut</label>
                  <select value={newProduct.status} onChange={e => setNewProduct({...newProduct, status: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none bg-white">
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Marque</label>
                  <select 
                    value={newProduct.brandId || ''} 
                    onChange={e => {
                      const selectedBrand = brands.find(b => b.id === e.target.value);
                      setNewProduct({
                        ...newProduct, 
                        brandId: e.target.value, 
                        brand: selectedBrand ? selectedBrand.name : ''
                      });
                    }} 
                    className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none bg-white"
                  >
                    <option value="">Sélectionner une marque</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Catégorie</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => {
                      setNewProduct({...newProduct, category: e.target.value, categoryId: ''});
                    }} 
                    className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none bg-white"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))
                    ) : (
                      <>
                        <option>Soin Visage</option>
                        <option>Maquillage</option>
                        <option>Parfums</option>
                      </>
                    )}
                  </select>
                </div>
                {newProduct.category && categories.find(c => c.name === newProduct.category)?.collections?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Collection</label>
                    <select 
                      value={newProduct.categoryId || ''} 
                      onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} 
                      className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none bg-white"
                    >
                      <option value="">Aucune / Générale</option>
                      {categories.find(c => c.name === newProduct.category)?.collections.map((col: any) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1">Tags</label>
                  <input type="text" value={newProduct.tags} onChange={e => setNewProduct({...newProduct, tags: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="Vegan, Cruelty-Free..." />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-brand-100 flex justify-end gap-4">
            <button onClick={() => { setIsEditing(false); setEditProductId(null); }} className="px-6 py-2 border border-brand-200 rounded-lg text-brand-700 font-medium hover:bg-brand-50 transition">Annuler</button>
            <button onClick={handleSaveProduct} className="px-6 py-2 bg-brand-900 text-white rounded-lg font-bold hover:bg-brand-950 transition">
              {editProductId ? 'Mettre à jour' : 'Enregistrer le produit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
