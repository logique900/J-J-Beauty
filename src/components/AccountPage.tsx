import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, onSnapshot, where, serverTimestamp } from 'firebase/firestore';
import { 
  User, MapPin, CreditCard, Bell, Clock, ShieldAlert, 
  LogOut, Edit2, Plus, Trash2, CheckCircle2, Package, Truck, Check, XCircle, Fingerprint
} from 'lucide-react';
import { OrderHistory } from './OrderHistory';
import { Product } from '../types';
import { useBiometrics } from '../hooks/useBiometrics';
import { toast } from '../lib/toast';

interface AccountPageProps {
  onNavigateHome: () => void;
  onNavigateToProduct: (id: string) => void;
  onNavigateToAdmin: () => void;
  allProducts?: Product[];
}

type TabType = 'info' | 'orders' | 'addresses' | 'payments' | 'preferences' | 'history' | 'security';

interface AddressData {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export function AccountPage({ onNavigateHome, onNavigateToProduct, onNavigateToAdmin, allProducts = [] }: AccountPageProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isProcessing, setIsProcessing] = useState(false);

  // Firestore Data State
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState(user?.name?.split(' ')?.[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ')?.slice(1).join(' ') || '');
  const [addresses, setAddresses] = useState<AddressData[]>([]);

  // Address Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '', name: '', street: '', city: '', zip: '', country: 'France', phone: '', isDefault: false
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.phone) setPhone(data.phone);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();

    const q = query(collection(db, `users/${user.id}/addresses`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const addrs: AddressData[] = [];
      snapshot.forEach((doc) => {
        addrs.push({ id: doc.id, ...doc.data() } as AddressData);
      });
      setAddresses(addrs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        name: `${firstName} ${lastName}`.trim(),
        phone: phone
      });
      toast.success('Profil mis à jour');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, `users/${user.id}/addresses`), {
        ...newAddress,
        createdAt: serverTimestamp()
      });
      setIsAddingAddress(false);
      setNewAddress({ label: '', name: '', street: '', city: '', zip: '', country: 'France', phone: '', isDefault: false });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout de l'adresse.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (window.confirm("Supprimer cette adresse ?")) {
      try {
        await deleteDoc(doc(db, `users/${user.id}/addresses`, id));
      } catch (e) {
         console.error(e);
      }
    }
  };

  const [cards, setCards] = useState([
    { id: 'c1', type: 'Visa', last4: '4242', exp: '12/25', isDefault: true },
    { id: 'c2', type: 'Mastercard', last4: '8888', exp: '08/26', isDefault: false }
  ]);

  const [history, setHistory] = useState(allProducts.slice(0, 4));

  const { isSupported, checkSupport, registerBiometrics } = useBiometrics();
  const [passkeys, setPasskeys] = useState<any[]>([]);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'passkeys'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      setPasskeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleRegisterPasskey = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const regObj = await registerBiometrics(user.id, user.email);
      if (regObj) {
        await addDoc(collection(db, 'passkeys'), {
          ...regObj,
          userId: user.id,
          email: user.email,
          createdAt: serverTimestamp(),
          deviceName: navigator.userAgent.split(')')[0].split('(')[1] || 'Appareil actuel'
        });
        toast.success('Biométrie enregistrée !');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement biométrique');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (window.confirm("Supprimer cet accès biométrique ?")) {
      try {
        await deleteDoc(doc(db, 'passkeys', id));
      } catch (err) {
        console.error(err);
      }
    }
  };
  const tabs = [
    { id: 'info', label: 'Mes informations', icon: User },
    { id: 'orders', label: 'Mes commandes', icon: Package },
    { id: 'addresses', label: 'Mes adresses', icon: MapPin },
    { id: 'preferences', label: 'Préférences', icon: Bell },
    { id: 'history', label: 'Historique de navigation', icon: Clock },
    { id: 'security', label: 'Sécurité & Confidentialité', icon: ShieldAlert },
  ];

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Vous devez être connecté.</h2>
        <button onClick={onNavigateHome} className="bg-black text-white px-6 py-2 rounded-full font-bold">Retour à l'accueil</button>
      </div>
    );
  }

  const handleDeleteAccount = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Un délai de 30 jours sera appliqué avant la suppression définitive (conformité RGPD).")) {
      logout();
      onNavigateHome();
      toast.success('Votre compte sera supprimé dans 30 jours.');
    }
  };

  return (
    <div className="bg-brand-50 dark:bg-brand-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-900 text-white rounded-full flex items-center justify-center text-2xl font-bold border-2 border-brand-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-extrabold text-brand-900">Bonjour, {user.name.split(' ')[0]}</h1>
              <p className="text-brand-500">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); onNavigateHome(); }}
            className="flex items-center gap-2 text-brand-500 hover:text-brand-900 font-medium transition"
          >
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-brand-100 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-200 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-4 ${
                        activeTab === tab.id 
                          ? 'border-brand-900 bg-brand-50 dark:bg-brand-200 text-brand-900' 
                          : 'border-transparent text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-200 hover:text-brand-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white dark:bg-brand-100 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-200 p-6 md:p-8 min-h-[500px]">
            
            {activeTab === 'orders' && (
              <OrderHistory onNavigateToProduct={onNavigateToProduct} />
            )}

            {activeTab === 'info' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">Informations personnelles</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-brand-700 mb-1">Prénom</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white dark:bg-brand-50 outline-none focus:border-brand-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-700 mb-1">Nom</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white dark:bg-brand-50 outline-none focus:border-brand-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">Email</label>
                    <input type="email" disabled value={user.email} className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none bg-brand-50 dark:bg-brand-200 text-brand-500 cursor-not-allowed" />
                    <p className="text-xs text-brand-500 mt-1">L'email ne peut pas être modifié depuis cet espace.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-brand-700 mb-1">Téléphone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 ... ..." className="w-full px-4 py-2.5 rounded-xl border border-brand-200 bg-white dark:bg-brand-50 outline-none focus:border-brand-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-700 mb-1">Date de naissance</label>
                      <input type="date" disabled defaultValue="1990-01-01" className="w-full px-4 py-2.5 rounded-xl border border-brand-200 outline-none bg-brand-50 dark:bg-brand-200 text-brand-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <button type="submit" disabled={isProcessing} className="bg-brand-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-950 transition disabled:opacity-50 shadow-lg shadow-brand-900/20">
                    {isProcessing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif font-bold text-brand-900">Carnet d'adresses</h2>
                  {!isAddingAddress && (
                    <button onClick={() => setIsAddingAddress(true)} className="text-sm font-bold text-brand-900 border border-brand-900 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-900 hover:text-white transition">
                      <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  )}
                </div>

                {isAddingAddress ? (
                  <form onSubmit={handleAddAddress} className="max-w-2xl bg-brand-50 dark:bg-brand-200 p-6 rounded-xl border border-brand-100 dark:border-brand-300 mb-6 space-y-4">
                    <h3 className="font-bold text-lg text-brand-900 mb-2">Nouvelle adresse</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-700 mb-1">Libellé (ex: Bureau, Maison)</label>
                        <input type="text" value={newAddress.label} onChange={e=>setNewAddress({...newAddress, label: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-100 outline-none focus:border-brand-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-700 mb-1">Nom complet</label>
                        <input type="text" value={newAddress.name} onChange={e=>setNewAddress({...newAddress, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-100 outline-none focus:border-brand-900" required />
                      </div>
                      <div className="sm:col-span-2">
                         <label className="block text-sm font-medium text-brand-700 mb-1">Rue</label>
                         <input type="text" value={newAddress.street} onChange={e=>setNewAddress({...newAddress, street: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-100 outline-none focus:border-brand-900" required />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-brand-700 mb-1">Code Postal</label>
                         <input type="text" value={newAddress.zip} onChange={e=>setNewAddress({...newAddress, zip: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-100 outline-none focus:border-brand-900" required />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-brand-700 mb-1">Ville</label>
                         <input type="text" value={newAddress.city} onChange={e=>setNewAddress({...newAddress, city: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-brand-200 dark:border-brand-300 bg-white dark:bg-brand-100 outline-none focus:border-brand-900" required />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={isProcessing} className="bg-brand-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-950 disabled:opacity-50">Sauvegarder</button>
                      <button type="button" onClick={() => setIsAddingAddress(false)} className="text-brand-500 font-bold hover:text-brand-900">Annuler</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.length === 0 ? (
                      <p className="text-brand-500 py-4 col-span-2">Aucune adresse enregistrée.</p>
                    ) : (
                      addresses.map(addr => (
                        <div key={addr.id} className="border border-brand-200 dark:border-brand-300 rounded-xl p-5 relative group text-sm bg-white dark:bg-brand-50 shadow-sm">
                          {addr.isDefault && <span className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Par défaut</span>}
                          <h3 className="font-bold text-base text-brand-900 mb-2 flex items-center gap-2">{addr.label}</h3>
                          <p className="font-medium text-brand-900">{addr.name}</p>
                          <p className="text-brand-600 line-clamp-1">{addr.street}</p>
                          <p className="text-brand-600">{addr.zip} {addr.city}, {addr.country}</p>
                          <p className="text-brand-600 mt-1">{addr.phone}</p>
                          
                          <div className="flex gap-4 mt-6 pt-4 border-t border-brand-100 dark:border-brand-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="flex items-center gap-1 text-brand-500 hover:text-brand-900 font-medium"><Edit2 className="w-4 h-4" /> Modifier</button>
                            <button onClick={() => handleDeleteAddress(addr.id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"><Trash2 className="w-4 h-4" /> Supprimer</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-serif font-bold text-brand-900 mb-6">Préférences de communication</h2>
                <div className="space-y-6">
                  {[
                    { title: 'Newsletter & Nouveautés', desc: 'Soyez alerté de nos dernières collections.' },
                    { title: 'Offres & Promotions', desc: 'Recevez nos bons plans et soldes.' },
                    { title: 'Suivi de commande par SMS', desc: 'Notifications en temps réel sur la livraison.' },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-start justify-between p-4 border border-brand-100 dark:border-brand-200 rounded-xl bg-brand-50/50 dark:bg-brand-200/50">
                      <div>
                        <h4 className="font-bold text-brand-900">{pref.title}</h4>
                        <p className="text-sm text-brand-500">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i !== 2} />
                        <div className="w-11 h-6 bg-brand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-900"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif font-bold text-brand-900">Consultés récemment</h2>
                  {history.length > 0 && (
                    <button onClick={() => setHistory([])} className="text-sm text-brand-500 hover:text-red-500 underline">Effacer l'historique</button>
                  )}
                </div>
                {history.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {history.map(item => (
                      <div key={item.id} className="group cursor-pointer" onClick={() => onNavigateToProduct(item.id)}>
                        <div className="aspect-[3/4] bg-brand-100 rounded-xl overflow-hidden mb-3">
                          <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h4 className="font-bold text-sm text-brand-900 truncate">{item.name}</h4>
                        <p className="text-sm text-brand-500">{item.price.toFixed(2)} DT</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-brand-500 text-center py-10">Aucun historique de navigation.</p>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-2xl space-y-8">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">Sécurité du compte</h2>
                  <p className="text-brand-500 text-sm mb-6">Gérez vos méthodes d'authentification et la sécurité de votre compte.</p>
                </div>

                <div className="p-6 border border-brand-100 rounded-2xl bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 text-brand-900 rounded-lg">
                        <Fingerprint className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-900">Authentification biométrique</h3>
                        <p className="text-xs text-brand-500">Utilisez Touch ID, Face ID ou Windows Hello pour vous connecter.</p>
                      </div>
                    </div>
                    {isSupported ? (
                      <button 
                        onClick={handleRegisterPasskey}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-brand-900 text-white text-sm font-bold rounded-xl hover:bg-brand-950 transition disabled:opacity-50"
                      >
                        Enregistrer cet appareil
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">Non supporté</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {passkeys.map(pk => (
                      <div key={pk.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-100">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-brand-900">{pk.deviceName}</p>
                            <p className="text-[10px] text-brand-500 italic">Enregistré le {pk.createdAt?.toDate ? pk.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeletePasskey(pk.id)} className="p-1.5 text-brand-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {passkeys.length === 0 && (
                      <p className="text-xs text-center text-brand-400 py-4">Aucun appareil enregistré pour la biométrie.</p>
                    )}
                  </div>
                </div>

                <div className="p-6 border border-red-100 bg-red-50/30 rounded-2xl">
                  <h3 className="text-lg font-bold text-red-700 mb-2 font-serif">Zone de danger</h3>
                  <p className="text-sm text-red-600 mb-6">
                    La suppression de votre compte est irréversible. Un délai de 30 jours (RGPD) est appliqué 
                    durant lequel vous pourrez annuler cette demande. Toutes vos données seront effacées après 
                    cette période.
                  </p>
                  <button onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition">
                    Demander la suppression
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
        
      </div>
    </div>
  );
}
