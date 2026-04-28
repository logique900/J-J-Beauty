import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Store, Truck, Bell, AlertCircle, Check, Instagram, Facebook, Settings2, ShieldAlert } from 'lucide-react';
import { toast } from '../../lib/toast';

interface AppSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryPrice: number;
  freeDeliveryThreshold: number;
  promoBannerActive: boolean;
  promoBannerText: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  maintenanceMode: boolean;
  orderNotificationEmail: string;
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
    socialLinks: { instagram: '', facebook: '', tiktok: '' },
    maintenanceMode: false,
    orderNotificationEmail: 'admin@jjbeauty.com'
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

  const handleSocialChange = (network: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: { ...(prev.socialLinks || {}), [network]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: new Date()
      }, { merge: true });
      toast.success('Paramètres enregistrés avec succès.');
    } catch (err) {
      console.error("Error saving settings", err);
      toast.error("Une erreur est survenue lors de l'enregistrement des paramètres.");
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
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Informations Boutique */}
          <div className="bg-white border border-brand-100 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900 bg-brand-50/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Email de contact principal</label>
                <input 
                  type="email" 
                  value={settings.contactEmail} 
                  onChange={(e) => handleChange('contactEmail', e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900 bg-brand-50/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Téléphone / WhatsApp</label>
                <input 
                  type="text" 
                  value={settings.contactPhone} 
                  onChange={(e) => handleChange('contactPhone', e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900 bg-brand-50/30"
                />
              </div>
            </div>
          </div>

          {/* Social Networks */}
          <div className="bg-white border border-brand-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
              <Instagram className="w-5 h-5 text-brand-500" /> Réseaux Sociaux
            </h2>
            <div className="space-y-4">
              <div className="flex relative items-center">
                <div className="w-12 h-full absolute left-0 flex items-center justify-center text-brand-400">
                  <Instagram className="w-5 h-5" />
                </div>
                <input 
                  type="url" 
                  placeholder="Lien profil Instagram"
                  value={settings.socialLinks?.instagram || ''} 
                  onChange={(e) => handleSocialChange('instagram', e.target.value)} 
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
                />
              </div>
              <div className="flex relative items-center">
                <div className="w-12 h-full absolute left-0 flex items-center justify-center text-brand-400">
                  <Facebook className="w-5 h-5" />
                </div>
                <input 
                  type="url" 
                  placeholder="Lien page Facebook"
                  value={settings.socialLinks?.facebook || ''} 
                  onChange={(e) => handleSocialChange('facebook', e.target.value)} 
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
                />
              </div>
            </div>
          </div>

          {/* Configuration Système */}
          <div className="bg-white border border-brand-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
              <Settings2 className="w-5 h-5 text-brand-500" /> Options Système & Notifications
            </h2>
            <div className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Email pour notifications de commandes (Admin)</label>
                <div className="flex relative items-center">
                  <div className="w-12 h-full absolute left-0 flex items-center justify-center text-brand-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <input 
                    type="email" 
                    value={settings.orderNotificationEmail} 
                    onChange={(e) => handleChange('orderNotificationEmail', e.target.value)} 
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
                    placeholder="admin@boutique.com"
                  />
                </div>
                <p className="text-xs text-brand-500 mt-2">Cet email recevra une alerte à chaque nouvelle commande réussie (Intégration email à configurer).</p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-4 mt-6">
                <div>
                  <h4 className="font-bold text-orange-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Mode Maintenance
                  </h4>
                  <p className="text-sm text-orange-800 mt-1">Désactive l'accès à la boutique pour les clients (page de maintenance).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.maintenanceMode} 
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)} 
                  />
                  <div className="w-14 h-7 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Livraison */}
          <div className="bg-white border border-brand-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
              <Truck className="w-5 h-5 text-brand-500" /> Livraison
            </h2>
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                Appliqué automatiquement au panier. Le retrait en magasin reste gratuit.
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Frais de port (DT)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    value={settings.deliveryPrice} 
                    onChange={(e) => handleChange('deliveryPrice', parseFloat(e.target.value) || 0)} 
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
                  />
                  <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pointer-events-none text-brand-400 font-bold">DT</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Gratuit à partir de (DT)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    value={settings.freeDeliveryThreshold} 
                    onChange={(e) => handleChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)} 
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900"
                  />
                  <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pointer-events-none text-brand-400 font-bold">DT</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bandeau d'annonce */}
          <div className="bg-white border border-brand-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 border-b border-brand-50 pb-4">
              <Bell className="w-5 h-5 text-brand-500" /> Annonce Top Bar
            </h2>
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-brand-50 shrink-0 rounded-lg transition-colors">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={settings.promoBannerActive} 
                    onChange={(e) => handleChange('promoBannerActive', e.target.checked)} 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${settings.promoBannerActive ? 'bg-brand-900' : 'bg-gray-200'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.promoBannerActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-bold text-brand-900">Activer le bandeau</span>
              </label>

              <div className={`${!settings.promoBannerActive ? 'opacity-50 pointer-events-none blur-[1px]' : ''} transition-all`}>
                <label className="block text-xs font-bold text-brand-700 mb-2 uppercase tracking-wide">Texte affiché</label>
                <textarea 
                  value={settings.promoBannerText} 
                  onChange={(e) => handleChange('promoBannerText', e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-brand-200 outline-none focus:border-brand-900 focus:ring-1 focus:ring-brand-900 min-h-[100px] resize-none"
                  placeholder="Ex: LIVRAISON GRATUITE SUR TOUTE LA TUNISIE..."
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
