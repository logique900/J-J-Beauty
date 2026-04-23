import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, ChevronRight, MapPin, Truck, CreditCard, 
  Gift, Edit2, Lock, AlertCircle, ShoppingBag, ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

interface CheckoutPageProps {
  onNavigateHome: () => void;
  onNavigateToCart: () => void;
}

type CheckoutStep = 'identification' | 'delivery' | 'payment' | 'confirmation';

export function CheckoutPage({ onNavigateHome, onNavigateToCart }: CheckoutPageProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('identification');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [useCustomAddress, setUseCustomAddress] = useState(true);

  // Form States
  const [email, setEmail] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.name?.split(' ')?.[0] || '', lastName: user?.name?.split(' ')?.slice(1).join(' ') || '', address1: '', address2: '', city: '', zipCode: '', country: 'France', company: ''
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Costs
  const shippings: Record<string, { label: string, price: number, time: string }> = {
    delivery: { label: 'Livraison à domicile', price: 7.00, time: '2-4 jours ouvrés' },
    store: { label: 'Retrait direct depuis le magasin', price: 0, time: 'Sous 2h' },
  };

  const currentShippingCost = shippings[deliveryMethod].price;
  const giftCost = isGift ? 3.50 : 0;
  const finalTotal = cartTotal + currentShippingCost + giftCost;

  useEffect(() => {
    if (user) {
      getDocs(collection(db, `users/${user.id}/addresses`)).then(snap => {
        const addrs = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          const def = addrs.find((a:any) => a.isDefault) || addrs[0];
          setShippingAddress({
            firstName: def.name?.split(' ')?.[0] || user?.name?.split(' ')?.[0] || '', 
            lastName: def.name?.split(' ')?.slice(1).join(' ') || user?.name?.split(' ')?.slice(1).join(' ') || '', 
            address1: def.street || '', 
            address2: '', 
            city: def.city || '', 
            zipCode: def.zip || '', 
            country: def.country || 'France', 
            company: ''
          });
          setUseCustomAddress(false);
        }
      });
    }
  }, [user]);

  const handleNextStep = (next: CheckoutStep) => {
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    if (isProcessing) return; // Prevent double click
    setIsProcessing(true);
    
    try {
      // Easy readable ID (e.g. CMD-49218)
      const easyOrderId = 'CMD-' + Math.floor(10000 + Math.random() * 90000);
      
      if (user) {
        await setDoc(doc(db, 'orders', easyOrderId), {
          userId: user.id,
          status: 'pending',
          totalAmount: finalTotal,
          items: items.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            color: item.color || null,
            size: item.size || null,
            image: item.product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/800'
          })),
          shippingAddress,
          shippingMethod: deliveryMethod,
          paymentMethod: deliveryMethod === 'store' ? 'store_payment' : 'cash',
          email,
          orderNotes: orderNotes || null,
          giftOptions: isGift ? {
            giftMessage: giftMessage || null,
            giftCost: giftCost
          } : null,
          createdAt: serverTimestamp()
        });
        setOrderId(easyOrderId);
      } else {
        setOrderId(easyOrderId);
      }
      setIsSuccess(true);
      if (clearCart) clearCart();
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la validation de la commande.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
        <button onClick={onNavigateHome} className="bg-black text-white px-6 py-3 rounded-xl">Retour à la boutique</button>
      </div>
    );
  }

  if (isSuccess) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (deliveryMethod === 'delivery' ? 4 : 0));
    const deliveryDateString = deliveryDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center min-h-[70vh] flex flex-col items-center justify-center">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-200">
           <Check className="w-10 h-10 text-green-600" />
         </div>
         <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Merci pour votre commande !</h1>
         <p className="text-gray-500 mb-8 max-w-lg">Votre numéro de commande est le <strong className="text-gray-900">{orderId}</strong>. Un e-mail de confirmation contenant les détails de votre commande a été envoyé à <strong className="text-gray-900">{email || 'votre adresse'}</strong>.</p>
         
         <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 md:p-8 mb-8 max-w-2xl w-full text-left">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Récapitulatif</h3>
            <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-gray-200">
               <div className="flex justify-between"><span className="text-gray-500">Montant total</span><span className="font-bold text-gray-900">{finalTotal.toFixed(2)} DT</span></div>
               <div className="flex justify-between"><span className="text-gray-500">Date de livraison estimée</span><span className="font-bold text-gray-900 capitalize">{deliveryDateString}</span></div>
               <div className="flex justify-between items-start"><span className="text-gray-500">Lieu de livraison</span><span className="font-bold text-gray-900 text-right max-w-[200px]">{shippingAddress.address1}<br/>{shippingAddress.zipCode} {shippingAddress.city}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
               <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-white transition-colors w-full justify-center">Télécharger la facture (PDF)</button>
            </div>
         </div>

         {!user && (
           <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 md:p-8 mb-8 max-w-lg w-full text-center">
             <h3 className="text-lg font-bold text-gray-900 mb-2">Gagnez du temps la prochaine fois</h3>
             <p className="text-sm text-gray-600 mb-6">Créez un compte pour suivre votre commande et sauvegarder vos informations pour vos prochains achats.</p>
             <button onClick={openAuthModal} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition">
               Créer un compte
             </button>
           </div>
         )}
         
         <button onClick={onNavigateHome} className="px-8 py-4 border-2 border-black text-black font-bold rounded-full hover:bg-gray-50 transition">Continuer mes achats</button>
      </div>
    );
  }

  return (
    <div className="bg-brand-50 min-h-screen pb-20 text-brand-950 font-sans">
      {/* Header mini pour Checkout (Often simplified to reduce distraction) */}
      <div className="bg-brand-50 border-b border-brand-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-3xl font-serif font-bold tracking-tight text-brand-900 cursor-pointer" onClick={onNavigateHome}>
            J&J Beauty
          </div>
          <button onClick={onNavigateToCart} className="text-sm font-medium text-brand-600 flex items-center gap-2 hover:text-brand-950 transition">
            <ShoppingBag className="w-4 h-4" /> Retour au panier
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Column: Steps */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Step 1: Identification */}
          <div className={`bg-white rounded-2xl shadow-sm border ${currentStep === 'identification' ? 'border-brand-900 ring-1 ring-brand-900' : 'border-brand-100'} overflow-hidden transition-all duration-300`}>
            <div className="p-6 sm:p-8 flex items-center justify-between cursor-pointer" onClick={() => currentStep !== 'identification' && setCurrentStep('identification')}>
              <h2 className="text-xl font-serif font-bold text-brand-900 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'identification' || email ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-400'}`}>
                  {email && currentStep !== 'identification' ? <Check className="w-4 h-4" /> : '1'}
                </span>
                Identification
              </h2>
              {email && currentStep !== 'identification' && <button className="text-brand-400 hover:text-brand-900"><Edit2 className="w-4 h-4"/></button>}
            </div>
            <AnimatePresence>
              {currentStep === 'identification' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 sm:px-8 sm:pb-8">
                   <div className="border-t border-brand-100 pt-6">
                     <p className="text-sm text-brand-600 mb-4">Commandez plus rapidement avec un compte ou continuez en tant qu'invité.</p>
                     <div className="max-w-md space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-brand-800 mb-1">Adresse e-mail *</label>
                         <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-brand-900 focus:border-brand-900 outline-none" placeholder="jean.dupont@exemple.com" required />
                       </div>
                       <div className="flex items-center gap-2">
                         <input type="checkbox" id="newsletter" className="rounded text-brand-900 focus:ring-brand-900" />
                         <label htmlFor="newsletter" className="text-sm text-brand-700">Je souhaite recevoir les offres exclusives par email.</label>
                       </div>
                       <button 
                         disabled={!email.includes('@')}
                         onClick={() => handleNextStep('delivery')}
                         className="w-full sm:w-auto px-8 py-3 bg-brand-900 text-white rounded-xl font-bold hover:bg-brand-950 disabled:bg-brand-200 disabled:cursor-not-allowed transition"
                       >
                         Continuer
                       </button>
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 2: Livraison */}
          <div className={`bg-white rounded-2xl shadow-sm border ${currentStep === 'delivery' ? 'border-brand-900 ring-1 ring-brand-900' : 'border-brand-100'} overflow-hidden transition-all duration-300`}>
            <div className="p-6 sm:p-8 flex items-center justify-between cursor-pointer" onClick={() => currentStep !== 'delivery' && email ? setCurrentStep('delivery') : null}>
              <h2 className="text-xl font-serif font-bold text-brand-900 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'delivery' || shippingAddress.firstName ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-400'}`}>
                   {shippingAddress.firstName && currentStep !== 'delivery' ? <Check className="w-4 h-4" /> : '2'}
                </span>
                Livraison
              </h2>
              {shippingAddress.firstName && currentStep !== 'delivery' && <button className="text-brand-400 hover:text-brand-900"><Edit2 className="w-4 h-4"/></button>}
            </div>
            
            <AnimatePresence>
              {currentStep === 'delivery' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 sm:px-8 sm:pb-8">
                  <div className="border-t border-brand-100 pt-6 space-y-8">
                    
                    {/* Addresse */}
                    <div>
                      <h3 className="text-base font-serif font-bold text-brand-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-500" /> Adresse de livraison</h3>
                      
                      {savedAddresses.length > 0 && (
                        <div className="mb-6 space-y-3">
                          {savedAddresses.map(addr => (
                            <label key={addr.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${!useCustomAddress && shippingAddress.address1 === addr.street ? 'border-brand-900 bg-brand-50 ring-1 ring-brand-900' : 'border-brand-200 hover:border-brand-400'}`}>
                              <div className="flex items-center gap-3">
                                <input type="radio" name="saved-address" checked={!useCustomAddress && shippingAddress.address1 === addr.street} onChange={() => {
                                  setUseCustomAddress(false);
                                  setShippingAddress({
                                    firstName: addr.name.split(' ')[0], 
                                    lastName: addr.name.split(' ').slice(1).join(' '), 
                                    address1: addr.street, 
                                    address2: '', city: addr.city, zipCode: addr.zip, country: addr.country, company: ''
                                  });
                                }} className="text-black focus:ring-black" />
                                <div>
                                  <p className="font-semibold text-gray-900">{addr.label} <span className="font-normal text-gray-500">- {addr.name}</span></p>
                                  <p className="text-xs text-gray-500">{addr.street}, {addr.zip} {addr.city}</p>
                                </div>
                              </div>
                            </label>
                          ))}
                          <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${useCustomAddress ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="saved-address" checked={useCustomAddress} onChange={() => {
                                setUseCustomAddress(true);
                                setShippingAddress({firstName: user?.name.split(' ')[0] || '', lastName: user?.name.split(' ').slice(1).join(' ') || '', address1: '', address2: '', city: '', zipCode: '', country: 'France', company: ''});
                              }} className="text-black focus:ring-black" />
                              <span className="font-semibold text-gray-900">Nouvelle adresse</span>
                            </div>
                          </label>
                        </div>
                      )}

                      {useCustomAddress && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                            <input type="text" value={shippingAddress.firstName} onChange={e=>setShippingAddress({...shippingAddress, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                            <input type="text" value={shippingAddress.lastName} onChange={e=>setShippingAddress({...shippingAddress, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (optionnel)</label>
                            <input type="text" value={shippingAddress.company} onChange={e=>setShippingAddress({...shippingAddress, company: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (Ligne 1) *</label>
                            <input type="text" value={shippingAddress.address1} onChange={e=>setShippingAddress({...shippingAddress, address1: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" placeholder="Numéro et nom de rue" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complément d'adresse (optionnel)</label>
                            <input type="text" value={shippingAddress.address2} onChange={e=>setShippingAddress({...shippingAddress, address2: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" placeholder="Appartement, bâtiment, etc." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                            <input type="text" value={shippingAddress.zipCode} onChange={e=>setShippingAddress({...shippingAddress, zipCode: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                            <input type="text" value={shippingAddress.city} onChange={e=>setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black" />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                         <input type="checkbox" id="billing" checked={billingSameAsShipping} onChange={e => setBillingSameAsShipping(e.target.checked)} className="rounded text-black focus:ring-black" />
                         <label htmlFor="billing" className="text-sm text-gray-600">L'adresse de facturation est identique à l'adresse de livraison</label>
                      </div>
                    </div>

                    {/* Méthode Livraison */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-4 h-4 text-gray-500" /> Mode de livraison</h3>
                      <div className="space-y-3">
                        {Object.entries(shippings).map(([key, info]) => (
                          <label key={key} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${deliveryMethod === key ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="dev-method" checked={deliveryMethod === key} onChange={() => setDeliveryMethod(key)} className="text-black focus:ring-black" />
                              <div>
                                <p className="font-semibold text-gray-900">{info.label}</p>
                                <p className="text-xs text-gray-500">{info.time}</p>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900">{info.price === 0 ? 'Gratuit' : `${info.price.toFixed(2)} DT`}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notes & Cadeau */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Gift className="w-4 h-4 text-gray-500" /> Options supplémentaires</h3>
                      <div className="space-y-4">
                        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${isGift ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}>
                          <input type="checkbox" checked={isGift} onChange={e => setIsGift(e.target.checked)} className="mt-1 text-black focus:ring-black rounded" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">Emballage cadeau (+3,50 DT)</p>
                            <p className="text-xs text-gray-500 mb-2">Ajoutez une touche spéciale pour vos proches.</p>
                            {isGift && (
                               <textarea value={giftMessage} onChange={e=>setGiftMessage(e.target.value)} placeholder="Message personnalisé (optionnel)" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-black" rows={2}/>
                            )}
                          </div>
                        </label>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Instructions pour le livreur (optionnel)</label>
                           <input type="text" value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} placeholder="Code porte, laisser au gardien..." className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-black" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                       <button 
                         disabled={!shippingAddress.firstName || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.zipCode}
                         onClick={() => handleNextStep('payment')}
                         className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 transition"
                       >
                         Continuer vers le paiement
                       </button>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 3: Payment */}
          <div className={`bg-white rounded-2xl shadow-sm border ${currentStep === 'payment' ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100'} overflow-hidden transition-all duration-300`}>
            <div className="p-6 sm:p-8 flex items-center justify-between cursor-pointer" onClick={() => currentStep !== 'payment' && shippingAddress.firstName ? setCurrentStep('payment') : null}>
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'payment' || paymentMethod === 'cash' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {paymentMethod === 'cash' && currentStep !== 'payment' ? <Check className="w-4 h-4" /> : '3'}
                </span>
                Paiement
              </h2>
            </div>
            
            <AnimatePresence>
              {currentStep === 'payment' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 sm:px-8 sm:pb-8">
                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-xl mb-4 text-sm font-medium border border-blue-100">
                      <Truck className="w-4 h-4" /> {deliveryMethod === 'store' ? 'Le paiement s\'effectue directement en magasin.' : 'Le paiement s\'effectue directement à la livraison.'}
                    </div>
                    
                    <label className={`block border rounded-xl p-4 cursor-pointer transition ${paymentMethod === 'cash' ? 'border-gray-900 ring-1 ring-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="text-black focus:ring-black" />
                           <span className="font-semibold text-gray-900 flex items-center gap-2">{deliveryMethod === 'store' ? 'Paiement en magasin' : 'Paiement à la livraison (Cash)'}</span>
                         </div>
                         <div className="flex gap-1 text-gray-400">
                           <CreditCard className="w-5 h-5 opacity-20" />
                         </div>
                      </div>
                      <p className="text-sm mt-2 text-gray-600">{deliveryMethod === 'store' ? 'Réglez vos achats lors du retrait de votre commande en magasin.' : 'Payez en espèces lorsque vous recevez votre colis à votre porte.'}</p>
                    </label>

                    <div className="pt-6 flex justify-end">
                       <button 
                         onClick={() => handleNextStep('confirmation')}
                         className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition"
                       >
                         Continuer
                       </button>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 4: Confirmation */}
          <div className={`bg-white rounded-2xl shadow-sm border ${currentStep === 'confirmation' ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100'} overflow-hidden transition-all duration-300`}>
             <div className="p-6 sm:p-8 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === 'confirmation' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>4</span>
                Confirmation
              </h2>
            </div>
            <AnimatePresence>
              {currentStep === 'confirmation' && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 sm:px-8 sm:pb-8">
                    <div className="border-t border-gray-100 pt-6">
                       
                       <div className="bg-gray-50 rounded-xl p-6 mb-6 text-sm text-gray-600 space-y-4">
                          <h3 className="font-bold text-gray-900">Récapitulatif de vos informations</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                             <div>
                                <p className="font-semibold text-gray-900 mb-1 flex justify-between">Livraison <button onClick={()=>setCurrentStep('delivery')} className="text-blue-600 text-xs hover:underline">Modifier</button></p>
                                <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                                <p>{shippingAddress.address1}</p>
                                {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                                <p>{shippingAddress.zipCode} {shippingAddress.city}</p>
                             </div>
                             <div>
                                <p className="font-semibold text-gray-900 mb-1 flex justify-between">Méthode & contact <button onClick={()=>setCurrentStep('delivery')} className="text-blue-600 text-xs hover:underline">Modifier</button></p>
                                <p>{shippings[deliveryMethod].label}</p>
                                <p>{email}</p>
                             </div>
                          </div>
                          {isGift && giftMessage && (
                            <div className="pt-2 border-t border-gray-200">
                               <p className="font-semibold text-gray-900">Message cadeau :</p>
                               <p className="italic">"{giftMessage}"</p>
                            </div>
                          )}
                       </div>

                       <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 mb-6 flex items-start gap-3">
                         <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                         <p className="text-sm text-blue-900">En cliquant sur « Confirmer », vous acceptez nos conditions générales de vente. {deliveryMethod === 'store' ? 'Le paiement se fera directement en magasin.' : 'Le paiement se fera à la livraison.'}</p>
                       </div>

                       <button 
                         onClick={handlePlaceOrder}
                         disabled={isProcessing}
                         className="w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl transition-all"
                       >
                         {isProcessing ? (
                           <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Confirmation en cours...
                           </>
                         ) : (
                           <>Confirmer la commande ({finalTotal.toFixed(2)} DT) <ArrowRight className="w-5 h-5"/></>
                         )}
                       </button>

                    </div>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Order Summary Overlay / Sticky */}
        <div className="w-full lg:w-96 shrink-0 relative">
          <div className="bg-white border text-gray-900 rounded-2xl p-6 sm:p-8 sticky top-24 shadow-sm">
             <h3 className="font-bold text-lg mb-6 flex items-center gap-2">Votre Panier <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{items.length}</span></h3>
             
             {/* Mini items list */}
             <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2 hide-scrollbar">
               {items.map(item => (
                 <div key={item.id} className="flex gap-3 text-sm">
                   <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                     <img src={item.product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/800'} alt={item.product.name} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1">
                     <p className="font-bold line-clamp-1">{item.product.name}</p>
                     <p className="text-gray-500 text-xs mb-1">
                       {item.color && `Couleur: ${item.color} `}
                       {item.size && `Taille: ${item.size}`}
                     </p>
                     <div className="flex justify-between items-center mt-1">
                       <span className="text-gray-500 font-medium">Qté: {item.quantity}</span>
                       <span className="font-bold border-b border-transparent">{(item.product.price * item.quantity).toFixed(2)} DT</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="border-t border-gray-100 pt-4 space-y-3 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{(cartTotal).toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frais de livraison</span>
                  <span>{currentShippingCost === 0 ? <span className="text-green-600 font-medium">Gratuit</span> : `${currentShippingCost.toFixed(2)} DT`}</span>
                </div>
                {isGift && (
                  <div className="flex justify-between text-gray-600">
                    <span>Emballage cadeau</span>
                    <span>{giftCost.toFixed(2)} DT</span>
                  </div>
                )}
             </div>

             <div className="border-t border-black pt-4 flex justify-between items-end">
               <span className="font-bold text-lg">Total</span>
               <span className="text-2xl font-extrabold">{finalTotal.toFixed(2)} DT</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
