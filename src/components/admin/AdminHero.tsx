import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Save, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ImageUploader } from './ImageUploader';
import { HeroSlide } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '../../lib/toast';

export function AdminHero() {
  const { isAdmin } = useAuth();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editSlideId, setEditSlideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewSlide, setPreviewSlide] = useState<HeroSlide | null>(null);

  const initialState = {
    title: '',
    subtitle: '',
    image: '',
    cta: '',
    position: 0,
    status: 'active' as const
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (!isAdmin) return;
    const slidesQuery = query(collection(db, 'hero-slides'), orderBy('position', 'asc'));
    const unsub = onSnapshot(slidesQuery, (snap) => {
      const fetchedSlides = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroSlide));
      setSlides(fetchedSlides);
      setLoading(false);
    }, (err) => {
      console.error("Hero slides fetch error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [isAdmin]);

  const handleEditClick = (slide: HeroSlide) => {
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      image: slide.image,
      cta: slide.cta || '',
      position: slide.position,
      status: slide.status
    });
    setEditSlideId(slide.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer ce slide ?')) return;
    try {
      await deleteDoc(doc(db, 'hero-slides', id));
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image) {
      toast.success('Titre et image sont requis');
      return;
    }

    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editSlideId) {
        await updateDoc(doc(db, 'hero-slides', editSlideId), data);
        toast.success('Slide mis à jour !');
      } else {
        const finalPosition = formData.position || (slides.length > 0 ? Math.max(...slides.map(s => s.position)) + 1 : 1);
        await addDoc(collection(db, 'hero-slides'), {
          ...data,
          position: finalPosition,
          createdAt: serverTimestamp()
        });
        toast.success('Slide créé !');
      }

      setIsEditing(false);
      setEditSlideId(null);
      setFormData(initialState);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const moveSlide = async (slide: HeroSlide, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIndex = slides.findIndex(s => s.id === slide.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const targetSlide = slides[targetIndex];
    
    try {
      await updateDoc(doc(db, 'hero-slides', slide.id), { position: targetSlide.position, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'hero-slides', targetSlide.id), { position: slide.position, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-brand-900">Gestion du Hero Section</h2>
          <p className="text-brand-500 text-sm">Contrôlez les visuels et messages qui accueillent vos visiteurs.</p>
        </div>
        <button 
          onClick={() => {
            setEditSlideId(null);
            setFormData({...initialState, position: slides.length + 1});
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Ajouter un Slide
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-900"></div>
          <p className="text-brand-500 font-medium">Chargement des slides...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {slides.map((slide, index) => (
            <div key={slide.id} className="bg-white rounded-3xl border border-brand-100 shadow-sm overflow-hidden group hover:border-brand-300 transition-all duration-300">
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={slide.image} 
                  alt={slide.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                  <div className="flex justify-between items-end">
                    <div className="max-w-[70%]">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200 mb-2 opacity-80">Slide 0{index + 1}</div>
                      <h3 className="text-2xl font-serif font-bold text-white leading-tight mb-2">{slide.title}</h3>
                      {slide.subtitle && <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{slide.subtitle}</p>}
                    </div>
                    <button 
                      onClick={() => setPreviewSlide(slide)}
                      className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white transition-all transform hover:scale-110 shadow-lg border border-white/20 group/btn"
                    >
                      <Eye className="w-5 h-5 group-hover/btn:text-brand-900" />
                    </button>
                  </div>
                </div>
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${slide.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white shadow-lg'}`}>
                  {slide.status === 'active' ? 'Actif' : 'Inactif'}
                </div>
              </div>
              <div className="p-4 flex justify-between items-center bg-brand-50/30">
                <div className="flex items-center gap-1">
                  <button 
                    disabled={index === 0}
                    onClick={(e) => moveSlide(slide, 'up', e)}
                    className={`p-2 rounded-xl border ${index === 0 ? 'text-gray-200 border-gray-100' : 'text-brand-900 border-brand-200 bg-white hover:bg-brand-50 shadow-sm'}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={index === slides.length - 1}
                    onClick={(e) => moveSlide(slide, 'down', e)}
                    className={`p-2 rounded-xl border ${index === slides.length - 1 ? 'text-gray-200 border-gray-100' : 'text-brand-900 border-brand-200 bg-white hover:bg-brand-50 shadow-sm'}`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(slide)} className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-white border border-brand-200 text-brand-700 hover:bg-brand-900 hover:text-white hover:border-brand-900 rounded-xl transition-all shadow-sm">
                    <Edit2 className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button onClick={(e) => handleDelete(slide.id, e)} className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl transition-all shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {slides.length === 0 && (
            <div className="xl:col-span-2 py-32 border-2 border-dashed border-brand-200 rounded-[3rem] flex flex-col items-center justify-center text-brand-300 bg-white shadow-inner">
               <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                 <ImageIcon className="w-10 h-10 opacity-40 text-brand-300" />
               </div>
               <p className="text-2xl font-serif font-bold text-brand-900 mb-2">Votre vitrine est vide</p>
               <p className="text-brand-500 max-w-xs text-center mb-8">Ajoutez des slides hero pour présenter vos produits phares et vos promotions.</p>
               <button 
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-3 bg-brand-900 text-white rounded-full font-bold hover:scale-105 transition shadow-xl"
               >
                 Créer mon premier slide
               </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-brand-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] border border-brand-100"
            >
              <div className="px-8 py-6 border-b border-brand-50 flex justify-between items-center bg-brand-50/50 sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brand-900">
                    {editSlideId ? 'Éditer le Slide' : 'Concevoir un Slide'}
                  </h3>
                  <p className="text-xs text-brand-500 font-medium mt-1">Personnalisez votre affichage principal</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-3 hover:bg-brand-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-brand-400" />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                  <div className="lg:col-span-3 space-y-6">
                    <div className="p-6 bg-brand-50/50 rounded-3xl border border-brand-100/50 space-y-5">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Contenu Textuel</h4>
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-brand-600 mb-2 ml-1">Titre d'impact *</label>
                        <input 
                          type="text" 
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-5 py-3 rounded-2xl border-2 border-brand-100 focus:border-brand-900 outline-none transition-all font-serif text-lg text-brand-900 placeholder:text-brand-300"
                          placeholder="Ex: Révélez votre éclat"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-brand-600 mb-2 ml-1">Description accompagnatrice</label>
                        <textarea 
                          rows={3}
                          value={formData.subtitle}
                          onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                          className="w-full px-5 py-3 rounded-2xl border-2 border-brand-100 focus:border-brand-900 outline-none transition-all text-sm leading-relaxed text-brand-800 placeholder:text-brand-300 resize-none"
                          placeholder="Un message captivant pour vos clients..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-brand-600 mb-2 ml-1">Bouton d'appel</label>
                          <input 
                            type="text" 
                            value={formData.cta}
                            onChange={e => setFormData({ ...formData, cta: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl border-2 border-brand-100 focus:border-brand-900 outline-none transition-all text-sm"
                            placeholder="Ex: Explorer"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-brand-600 mb-2 ml-1">Statut d'affichage</label>
                          <select 
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-5 py-3 rounded-2xl border-2 border-brand-100 focus:border-brand-900 outline-none transition-all bg-white text-sm font-bold"
                          >
                            <option value="active">✓ Actif (En ligne)</option>
                            <option value="inactive">✕ Inactif (Brouillon)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-brand-600 ml-1">Visuel Hero-Background *</label>
                      <ImageUploader 
                        label=""
                        value={formData.image}
                        onChange={url => setFormData({ ...formData, image: url })}
                        folder="hero"
                        className="aspect-square rounded-[2rem] overflow-hidden shadow-inner border-2 border-brand-50"
                      />
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <p className="text-[10px] text-blue-700 leading-relaxed">
                          <strong className="block mb-1">💡 Conseil Designer:</strong>
                          Privilégiez des visuels avec un sujet décentré à droite pour laisser de la place au texte à gauche.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-brand-50 flex justify-end gap-4 bg-brand-50/30">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-3 text-brand-700 font-bold hover:text-brand-950 transition"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  className="px-10 py-3 bg-brand-900 text-white font-bold rounded-2xl hover:bg-brand-950 transition-all shadow-xl shadow-brand-900/20 flex items-center gap-2 transform active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  {editSlideId ? 'Enregistrer les modifications' : 'Publier le slide'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewSlide && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewSlide(null)}
              className="absolute inset-0 bg-brand-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl shadow-2xl rounded-[3rem] overflow-hidden"
            >
               <div className="relative h-[70vh] min-h-[500px] overflow-hidden bg-brand-900">
                  <img src={previewSlide.image} alt="" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-12 sm:px-24">
                    <motion.div 
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-2xl text-white"
                    >
                       <h2 className="text-4xl sm:text-6xl font-serif font-bold mb-6 leading-tight drop-shadow-xl">{previewSlide.title}</h2>
                       {previewSlide.subtitle && <p className="text-xl sm:text-2xl text-brand-100/90 mb-10 leading-relaxed font-medium">{previewSlide.subtitle}</p>}
                       <button className="px-12 py-4 bg-white text-brand-900 font-extrabold rounded-full text-lg shadow-2xl transform active:scale-95 transition-transform">
                          {previewSlide.cta || 'Explorer'}
                       </button>
                    </motion.div>
                  </div>
               </div>
               <button 
                onClick={() => setPreviewSlide(null)}
                className="absolute top-8 right-8 w-12 h-12 bg-white text-brand-950 rounded-full flex items-center justify-center hover:scale-110 transition shadow-2xl z-20"
               >
                 <X className="w-6 h-6" />
               </button>
               <div className="absolute bottom-0 inset-x-0 p-4 text-center text-[10px] font-bold text-brand-200 uppercase tracking-[0.5em] bg-black/20 backdrop-blur-sm">
                 Mode Prévisualisation Temps Réel
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
