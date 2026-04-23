import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Store, Truck, Bell, AlertCircle, Check } from 'lucide-react';

interface AppSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryPrice: number;
  freeDeliveryThreshold: number;
  promoBannerActive: boolean;
  promoBannerText: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    storeName: 'J&J Beauty',
    contactEmail: 'contact@jjbeauty.com',
    contactPhone: '+216 12 345 678',
    deliveryPrice: 7.00,
    freeDeliveryThreshold: 150,
    promoBannerActive: true,
    promoBannerText: 'LIVRAISON GRATUITE À PARTIR DE 150 DT D\'ACHAT',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...settings, ...docSnap.data() } as AppSettings);
        }
      } catch (err) {
        console.error("Error loading settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: new Date()
      }, { merge: true });
      setSuccessMsg('Paramètres enregistrés avec succès.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Error saving settings", err);
      alert("Une erreur est survenue lors de l'enregistrement des paramètres.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-900">Paramètres Généraux</h1>
          <p className="text-brand-600 text-sm mt-1">Gérez la configuration globale de votre boutique, la livraison et les annonces.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-950 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {/* Informations Boutique */}
      <div className="bg-white border border-brand-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
          <Store className="w-5 h-5 text-brand-500" /> Informations de la boutique
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-brand-700 mb-2">Nom de la boutique</label>
            <input 
              type="text" 
              value={settings.storeName} 
              onChange={(e) => handleChange('storeName', e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">Email de contact</label>
            <input 
              type="email" 
              value={settings.contactEmail} 
              onChange={(e) => handleChange('contactEmail', e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">Téléphone</label>
            <input 
              type="text" 
              value={settings.contactPhone} 
              onChange={(e) => handleChange('contactPhone', e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />
          </div>
        </div>
      </div>

      {/* Livraison */}
      <div className="bg-white border border-brand-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
          <Truck className="w-5 h-5 text-brand-500" /> Modalités de livraison
        </h2>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            Ces montants seront utilisés sur l'ensemble du site lors du passage en caisse (Page Checkout) et dans le simulateur de livraison (Panier). Le retrait depuis le magasin est toujours gratuit.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">Frais de livraison à domicile (DT)</label>
            <input 
              type="number" 
              step="0.01"
              value={settings.deliveryPrice} 
              onChange={(e) => handleChange('deliveryPrice', parseFloat(e.target.value) || 0)} 
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">Seuil de livraison gratuite (DT)</label>
            <input 
              type="number" 
              step="0.01"
              value={settings.freeDeliveryThreshold} 
              onChange={(e) => handleChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)} 
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
            />
          </div>
        </div>
      </div>

      {/* Bandeau d'annonce */}
      <div className="bg-white border border-brand-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
          <Bell className="w-5 h-5 text-brand-500" /> Bandeau d'annonce (Top Bar)
        </h2>
        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={settings.promoBannerActive} 
                onChange={(e) => handleChange('promoBannerActive', e.target.checked)} 
              />
              <div className={`block w-12 h-6 rounded-full transition-colors ${settings.promoBannerActive ? 'bg-brand-900' : 'bg-gray-200'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.promoBannerActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-sm font-medium text-brand-900">Activer le bandeau promotionnel en haut du site</span>
          </label>

          <div className={`${!settings.promoBannerActive ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
            <label className="block text-sm font-medium text-brand-700 mb-2">Texte du bandeau</label>
            <input 
              type="text" 
              value={settings.promoBannerText} 
              onChange={(e) => handleChange('promoBannerText', e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
              placeholder="Ex: LIVRAISON GRATUITE SUR TOUTE LA TUNISIE..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
