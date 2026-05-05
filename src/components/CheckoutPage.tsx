import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, ChevronRight, MapPin, Truck, CreditCard, 
  Gift, Edit2, Lock, AlertCircle, ShoppingBag, ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { sendNotification } from '../services/notificationService';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { toast } from '../lib/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [useCustomAddress, setUseCustomAddress] = useState(true);

  // Form States
  const [email, setEmail] = useState(user?.email || '');
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.name?.split(' ')?.[0] || '', 
    lastName: user?.name?.split(' ')?.slice(1).join(' ') || '', 
    address1: '', 
    address2: '', 
    city: '', 
    zipCode: '', 
    country: 'Tunisie', 
    company: '',
    phone: ''
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
            country: def.country || 'Tunisie', 
            company: '',
            phone: def.phone || ''
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
      
      await setDoc(doc(db, 'orders', easyOrderId), {
        userId: user ? user.id : 'guest',
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
        newsletterOptIn,
        orderNotes: orderNotes || null,
        giftOptions: isGift ? {
          giftMessage: giftMessage || null,
          giftCost: giftCost
        } : null,
        createdAt: serverTimestamp()
      });

      setCompletedOrder({
        id: easyOrderId,
        total: finalTotal,
        subtotal: cartTotal,
        shippingCost: currentShippingCost,
        items: [...items],
        shippingAddress: { ...shippingAddress },
        deliveryMethod
      });

      // Send in-app notification to admin
      sendNotification(
        'admin',
        'Nouvelle commande !',
        `Une nouvelle commande (#${easyOrderId}) de ${finalTotal} DT vient d'être passée.`,
        'success',
        '/admin'
      );

        // Trigger email/backend notification
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
          let adminEmail = 'admin@jjbeauty.com';
          if (settingsSnap.exists()) {
            adminEmail = settingsSnap.data().orderNotificationEmail || adminEmail;
          }
          
          const response = await fetch(`${window.location.origin}/api/notifications/admin-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: easyOrderId,
              amount: finalTotal.toFixed(2),
              customerName: shippingAddress.firstName + ' ' + shippingAddress.lastName,
              adminEmail
            })
          });

          if (!response.ok) {
            console.error("Notification API failed:", response.status);
          }
        } catch (backendErr) {
          console.error("Failed to send notification:", backendErr);
        }

      if (newsletterOptIn && email) {
        try {
          await setDoc(doc(db, 'subscribers', email.toLowerCase()), {
            email: email.toLowerCase(),
            source: 'checkout',
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (subErr) {
          console.error("Failed to save subscriber", subErr);
        }
      }

      setIsSuccess(true);
      if (clearCart) clearCart();
      window.scrollTo({ top: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de la validation de la commande.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="bg-[#F9F9F8] min-h-screen py-32 font-sans flex flex-col items-center justify-center">
        <h2 className="text-3xl font-serif font-light text-black mb-6">Votre panier est vide</h2>
        <button onClick={onNavigateHome} className="px-10 py-5 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">Retour à la boutique</button>
      </div>
    );
  }

  if (isSuccess && completedOrder) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (completedOrder.deliveryMethod === 'delivery' ? 4 : 0));
    const deliveryDateString = deliveryDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const handleDownloadInvoice = () => {
      const doc = new jsPDF();
      
      let orderDate = '';
      if (completedOrder.createdAt) {
         const d = completedOrder.createdAt?.toDate ? completedOrder.createdAt.toDate() : new Date(completedOrder.createdAt);
         if (!isNaN(d.getTime())) {
           orderDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
         } else {
           orderDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
         }
      } else {
         orderDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }

      // Design: Header background
      doc.setFillColor(250, 250, 250);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.line(0, 40, 210, 40);
      
      // Logo text
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('J&J BEAUTY', 14, 26);
      
      // Invoice Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('FACTURE', 196, 26, { align: 'right' });
      
      // Order info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('N° de commande :', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`${completedOrder.id}`, 50, 55);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Date :', 14, 62);
      doc.setFont('helvetica', 'normal');
      doc.text(`${orderDate}`, 50, 62);
      
      // Billing Info
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Adressé à :', 14, 80);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${completedOrder.shippingAddress.firstName} ${completedOrder.shippingAddress.lastName}`, 14, 87);
      doc.text(`${completedOrder.shippingAddress.address1}`, 14, 93);
      if (completedOrder.shippingAddress.address2) {
        doc.text(`${completedOrder.shippingAddress.address2}`, 14, 99);
        doc.text(`${completedOrder.shippingAddress.zipCode} ${completedOrder.shippingAddress.city}`, 14, 105);
        if (completedOrder.shippingAddress.phone) {
          doc.text(`Tél: ${completedOrder.shippingAddress.phone}`, 14, 111);
        }
      } else {
        doc.text(`${completedOrder.shippingAddress.zipCode} ${completedOrder.shippingAddress.city}`, 14, 99);
        if (completedOrder.shippingAddress.phone) {
          doc.text(`Tél: ${completedOrder.shippingAddress.phone}`, 14, 105);
        }
      }
      
      const startY = completedOrder.shippingAddress.address2 
        ? (completedOrder.shippingAddress.phone ? 121 : 115) 
        : (completedOrder.shippingAddress.phone ? 115 : 109);
      
      const tableData = completedOrder.items.map((item: any) => [
        item.product.name,
        item.quantity.toString(),
        `${item.product.price.toFixed(2)} DT`,
        `${(item.product.price * item.quantity).toFixed(2)} DT`
      ]);

      autoTable(doc, {
        startY,
        head: [['Article', 'Qté', 'Prix unitaire', 'Montant']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, cellPadding: 6, textColor: 20 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Sous-total:', 140, finalY);
      doc.text(`${completedOrder.subtotal.toFixed(2)} DT`, 196, finalY, { align: 'right' });
      
      doc.text('Frais de livraison:', 140, finalY + 8);
      doc.text(completedOrder.shippingCost === 0 ? 'Offerte' : `${completedOrder.shippingCost.toFixed(2)} DT`, 196, finalY + 8, { align: 'right' });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(140, finalY + 12, 196, finalY + 12);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 140, finalY + 20);
      doc.text(`${completedOrder.total.toFixed(2)} DT`, 196, finalY + 20, { align: 'right' });

      // Footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Merci pour votre confiance.', 105, 280, { align: 'center' });
      doc.text('J&J BEAUTY - contact@jjbeauty.com', 105, 285, { align: 'center' });

      doc.save(`Facture_${completedOrder.id}.pdf`);
    };

    return (
      <div className="bg-[#F9F9F8] min-h-screen font-sans">
        <div className="bg-white border-b border-gray-100 py-6 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 flex justify-center items-center">
            <div className="text-2xl font-serif font-light tracking-tight text-black cursor-pointer" onClick={onNavigateHome}>
              J&J Beauty
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-10 shadow-sm border border-gray-100">
             <Check className="w-8 h-8 text-black" />
           </div>
           
           <h1 className="text-4xl font-serif font-light text-black mb-6 tracking-tight">Merci pour votre commande.</h1>
           <p className="text-gray-500 mb-12 max-w-lg text-sm font-serif italic">Votre numéro de commande est le <strong className="text-black font-semibold not-italic">{completedOrder.id}</strong>. Un e-mail de confirmation vous a été envoyé.</p>
           
           <div className="bg-white border border-gray-100 p-10 mb-12 max-w-2xl w-full text-left">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-8 pb-4 border-b border-black">Récapitulatif</h3>
              <div className="flex flex-col gap-5 mb-8 pb-8 border-b border-gray-100 text-sm">
                 <div className="flex justify-between"><span className="text-gray-500">Montant total</span><span className="font-medium text-black">{completedOrder.total.toFixed(2)} DT</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">Date de livraison estimée</span><span className="font-medium text-black capitalize">{deliveryDateString}</span></div>
                 <div className="flex justify-between items-start">
                   <span className="text-gray-500">Adresse</span>
                   <span className="font-medium text-black text-right max-w-[200px] leading-relaxed">{completedOrder.shippingAddress.address1}<br/>{completedOrder.shippingAddress.zipCode} {completedOrder.shippingAddress.city}</span>
                 </div>
              </div>
              <div className="flex justify-center">
                 <button onClick={handleDownloadInvoice} className="text-[10px] font-bold uppercase tracking-[0.15em] text-black border-b border-transparent hover:border-black transition-colors pb-0.5">Télécharger la facture</button>
              </div>
           </div>

           {!user && (
             <div className="bg-white border border-gray-100 p-10 mb-12 max-w-lg w-full text-center">
               <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-4">Gagnez du temps la prochaine fois</h3>
               <p className="text-sm font-serif italic text-gray-500 mb-8">Créez un compte pour suivre votre commande et sauvegarder vos informations pour vos futurs achats.</p>
               <button onClick={openAuthModal} className="w-full bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
                 Créer un compte
               </button>
             </div>
           )}
           
           <button onClick={onNavigateHome} className="text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:text-gray-500 transition-colors flex items-center gap-3">
             <ArrowRight className="w-4 h-4" /> Continuer vos achats
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F9F8] min-h-screen pb-20 text-brand-950 font-sans">
      {/* Elegant Header for Checkout */}
      <div className="bg-white border-b border-gray-100 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex justify-between items-center">
          <div className="text-2xl font-serif font-light tracking-tight text-black cursor-pointer" onClick={onNavigateHome}>
            J&J Beauty
          </div>
          <button onClick={onNavigateToCart} className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-black flex items-center gap-2 transition-colors">
            <ShoppingBag className="w-4 h-4 mb-0.5" /> Retour au panier
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-16 flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
        {/* Left Column: Steps */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Step Progression (Optional Visual) */}
          <div className="flex items-center justify-between mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-4">
            <span className={currentStep === 'identification' || email ? 'text-black' : ''}>1. Identification</span>
            <ChevronRight className="w-4 h-4 opacity-30" />
            <span className={currentStep === 'delivery' || shippingAddress.firstName ? 'text-black' : ''}>2. Livraison</span>
            <ChevronRight className="w-4 h-4 opacity-30" />
            <span className={currentStep === 'payment' || currentStep === 'confirmation' ? 'text-black' : ''}>3. Paiement</span>
          </div>

          {/* Step 1: Identification */}
          <div className="bg-white rounded-none border border-gray-100 overflow-hidden transition-all duration-300">
            <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => currentStep !== 'identification' && setCurrentStep('identification')}>
              <h2 className="text-2xl font-serif font-light text-black flex items-center gap-4">
                Identification
              </h2>
              {email && currentStep !== 'identification' && <button className="text-gray-400 hover:text-black transition-colors"><Edit2 className="w-4 h-4"/></button>}
            </div>
            <AnimatePresence>
              {currentStep === 'identification' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                   <div className="border-t border-gray-100 pt-8 mt-2">
                     <p className="text-sm text-gray-500 mb-8 font-serif italic">Commandez plus rapidement avec un compte ou continuez en tant qu'invité.</p>
                     <div className="max-w-md space-y-6">
                       <div>
                         <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Adresse e-mail *</label>
                         <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black placeholder:text-gray-300" placeholder="jean.dupont@exemple.com" required />
                       </div>
                       <div className="flex items-center gap-3 pt-4">
                         <input type="checkbox" id="newsletter" checked={newsletterOptIn} onChange={e => setNewsletterOptIn(e.target.checked)} className="w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black" />
                         <label htmlFor="newsletter" className="text-xs text-gray-600">Je souhaite recevoir les offres exclusives et actualités.</label>
                       </div>
                       <div className="pt-4">
                         <button 
                           disabled={!email.includes('@')}
                           onClick={() => handleNextStep('delivery')}
                           className="w-full sm:w-auto px-10 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                         >
                           Continuer
                         </button>
                       </div>
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 2: Livraison */}
          <div className="bg-white rounded-none border border-gray-100 overflow-hidden transition-all duration-300">
            <div className={`p-8 flex items-center justify-between ${email ? 'cursor-pointer' : 'opacity-50'}`} onClick={() => currentStep !== 'delivery' && email ? setCurrentStep('delivery') : null}>
              <h2 className="text-2xl font-serif font-light text-black flex items-center gap-4">
                Livraison
              </h2>
              {shippingAddress.firstName && currentStep !== 'delivery' && <button className="text-gray-400 hover:text-black"><Edit2 className="w-4 h-4"/></button>}
            </div>
            
            <AnimatePresence>
              {currentStep === 'delivery' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                  <div className="border-t border-gray-100 pt-8 mt-2 space-y-12">
                    
                    {/* Addresse */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">Adresse de livraison</h3>
                      
                      {savedAddresses.length > 0 && (
                        <div className="mb-8 space-y-3">
                          {savedAddresses.map(addr => (
                            <label key={addr.id} className={`flex items-center justify-between p-5 border cursor-pointer transition-colors ${!useCustomAddress && shippingAddress.address1 === addr.street ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                              <div className="flex items-center gap-4">
                                <input type="radio" name="saved-address" checked={!useCustomAddress && shippingAddress.address1 === addr.street} onChange={() => {
                                  setUseCustomAddress(false);
                                  setShippingAddress({
                                    firstName: addr.name.split(' ')[0], 
                                    lastName: addr.name.split(' ').slice(1).join(' '), 
                                    address1: addr.street, 
                                    address2: '', city: addr.city, zipCode: addr.zip, country: addr.country, company: '',
                                    phone: addr.phone || ''
                                  });
                                }} className="text-black focus:ring-black w-4 h-4" />
                                <div>
                                  <p className="font-medium text-black text-sm">{addr.label} <span className="font-normal text-gray-500 ml-2">{addr.name}</span></p>
                                  <p className="text-xs text-gray-500 mt-1">{addr.street}, {addr.zip} {addr.city}</p>
                                </div>
                              </div>
                            </label>
                          ))}
                          <label className={`flex items-center justify-between p-5 border cursor-pointer transition-colors ${useCustomAddress ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                            <div className="flex items-center gap-4">
                              <input type="radio" name="saved-address" checked={useCustomAddress} onChange={() => {
                                setUseCustomAddress(true);
                                setShippingAddress({
                                  firstName: user?.name.split(' ')[0] || '', 
                                  lastName: user?.name.split(' ').slice(1).join(' ') || '', 
                                  address1: '', 
                                  address2: '', 
                                  city: '', 
                                  zipCode: '', 
                                  country: 'Tunisie', 
                                  company: '',
                                  phone: ''
                                });
                              }} className="text-black focus:ring-black w-4 h-4" />
                              <span className="font-medium text-black text-sm">Saisir une nouvelle adresse</span>
                            </div>
                          </label>
                        </div>
                      )}

                      {useCustomAddress && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                           <div className="relative">
                             <input type="text" id="fn" value={shippingAddress.firstName} onChange={e=>setShippingAddress({...shippingAddress, firstName: e.target.value})} className="peer w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black placeholder-transparent" placeholder="Prénom" />
                             <label htmlFor="fn" className="absolute left-0 -top-3.5 text-[9px] text-gray-500 uppercase tracking-widest transition-all peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:normal-case peer-focus:-top-3.5 peer-focus:text-[9px] peer-focus:text-black peer-focus:uppercase peer-focus:tracking-widest">Prénom *</label>
                           </div>
                           <div className="relative">
                             <input type="text" id="ln" value={shippingAddress.lastName} onChange={e=>setShippingAddress({...shippingAddress, lastName: e.target.value})} className="peer w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black placeholder-transparent" placeholder="Nom" />
                             <label htmlFor="ln" className="absolute left-0 -top-3.5 text-[9px] text-gray-500 uppercase tracking-widest transition-all peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:normal-case peer-focus:-top-3.5 peer-focus:text-[9px] peer-focus:text-black peer-focus:uppercase peer-focus:tracking-widest">Nom *</label>
                           </div>
                           <div className="sm:col-span-2 relative mt-4">
                             <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Adresse (Numéro et voie) *</label>
                             <input type="text" value={shippingAddress.address1} onChange={e=>setShippingAddress({...shippingAddress, address1: e.target.value})} className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black" />
                           </div>
                           <div className="sm:col-span-2 relative pt-2">
                             <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Code Postal & Ville *</label>
                             <div className="grid grid-cols-3 gap-6">
                               <input type="text" value={shippingAddress.zipCode} onChange={e=>setShippingAddress({...shippingAddress, zipCode: e.target.value})} className="col-span-1 px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black placeholder:text-gray-300" placeholder="Code postal" />
                               <input type="text" value={shippingAddress.city} onChange={e=>setShippingAddress({...shippingAddress, city: e.target.value})} className="col-span-2 px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black placeholder:text-gray-300" placeholder="Ville" />
                             </div>
                           </div>
                           <div className="sm:col-span-2 relative pt-2">
                             <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Téléphone *</label>
                             <div className="flex">
                               <span className="py-3 pr-2 text-gray-400 border-b border-gray-300">+216</span>
                               <input 
                                 type="tel" 
                                 value={shippingAddress.phone.replace('+216', '')} 
                                 onChange={e=>setShippingAddress({...shippingAddress, phone: '+216' + e.target.value.replace(/\D/g, '')})} 
                                 className="flex-1 px-0 py-3 bg-transparent border-0 border-b border-gray-300 focus:ring-0 focus:border-black outline-none transition-colors text-black" 
                                 placeholder="XX XXX XXX" 
                                 required
                               />
                             </div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Méthode Livraison */}
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">Mode de livraison</h3>
                      <div className="space-y-4">
                        {Object.entries(shippings).map(([key, info]) => (
                          <label key={key} className={`flex items-start justify-between p-5 border cursor-pointer transition-colors ${deliveryMethod === key ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                            <div className="flex gap-4">
                              <input type="radio" name="dev-method" checked={deliveryMethod === key} onChange={() => setDeliveryMethod(key)} className="mt-1 text-black focus:ring-black w-4 h-4" />
                              <div>
                                <p className="font-medium text-black text-sm">{info.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{info.time}</p>
                              </div>
                            </div>
                            <span className="font-medium text-black text-sm">{info.price === 0 ? 'Gratuit' : `${info.price.toFixed(2)} DT`}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                       <button 
                         disabled={!shippingAddress.firstName || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.phone}
                         onClick={() => handleNextStep('payment')}
                         className="w-full sm:w-auto px-10 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
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
          <div className="bg-white rounded-none border border-gray-100 overflow-hidden transition-all duration-300">
            <div className={`p-8 flex items-center justify-between ${shippingAddress.firstName ? 'cursor-pointer' : 'opacity-50'}`} onClick={() => currentStep !== 'payment' && currentStep !== 'confirmation' && shippingAddress.firstName ? setCurrentStep('payment') : null}>
              <h2 className="text-2xl font-serif font-light text-black flex items-center gap-4">
                Paiement
              </h2>
            </div>
            
            <AnimatePresence>
              {currentStep === 'payment' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                  <div className="border-t border-gray-100 pt-8 mt-2 space-y-6">
                    
                    <label className={`block border p-6 cursor-pointer transition ${paymentMethod === 'cash' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="text-black focus:ring-black w-4 h-4" />
                           <span className="font-medium text-black text-sm uppercase tracking-wide">{deliveryMethod === 'store' ? 'Paiement en magasin' : 'Paiement à la livraison'}</span>
                         </div>
                      </div>
                      <p className="text-sm mt-3 text-gray-600 font-serif italic ml-8">{deliveryMethod === 'store' ? 'Réglez vos achats lors du retrait de votre commande en magasin.' : 'Payez en espèces lorsque vous recevez votre colis à votre porte.'}</p>
                    </label>

                    <div className="pt-8 flex justify-end">
                       <button 
                         onClick={() => handleNextStep('confirmation')}
                         className="w-full sm:w-auto px-10 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors"
                       >
                         Vérifier la commande
                       </button>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 4: Confirmation */}
          <div className={`bg-white rounded-none border border-gray-100 overflow-hidden transition-all duration-300 ${currentStep !== 'confirmation' ? 'hidden md:block opacity-50' : ''}`}>
             <div className="p-8 flex items-center justify-between">
              <h2 className="text-2xl font-serif font-light text-black flex items-center gap-4">
                Confirmation
              </h2>
            </div>
            <AnimatePresence>
              {currentStep === 'confirmation' && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                    <div className="border-t border-gray-100 pt-8 mt-2">
                       
                       <div className="bg-[#F9F9F8] p-8 mb-8 text-sm text-gray-600">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-6">Récapitulatif de vos informations</h3>
                          <div className="grid sm:grid-cols-2 gap-8">
                             <div>
                                <p className="font-medium text-black mb-2 flex justify-between uppercase tracking-wider text-xs">Livraison <button onClick={()=>setCurrentStep('delivery')} className="text-gray-400 hover:text-black hover:underline transition-colors">Modifier</button></p>
                                <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                                <p>{shippingAddress.address1}</p>
                                {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                                <p>{shippingAddress.zipCode} {shippingAddress.city}</p>
                             </div>
                             <div>
                                <p className="font-medium text-black mb-2 flex justify-between uppercase tracking-wider text-xs">Contact <button onClick={()=>setCurrentStep('identification')} className="text-gray-400 hover:text-black hover:underline transition-colors">Modifier</button></p>
                                <p>{email}</p>
                                <p>{shippingAddress.phone}</p>
                                <p className="mt-4 font-medium text-black uppercase tracking-wider text-xs mb-2">Méthode</p>
                                <p>{shippings[deliveryMethod].label}</p>
                             </div>
                          </div>
                       </div>

                       <div className="mb-8">
                         <p className="text-xs text-gray-500 italic font-serif">En cliquant sur « Confirmer », vous acceptez nos conditions générales de vente. {deliveryMethod === 'store' ? 'Le paiement se fera directement en magasin.' : 'Le paiement se fera à la livraison.'}</p>
                       </div>

                       <button 
                         onClick={handlePlaceOrder}
                         disabled={isProcessing}
                         className="w-full py-5 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                       >
                         {isProcessing ? (
                           <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                              Traitement en cours...
                           </>
                         ) : (
                           <>Confirmer la commande - {finalTotal.toFixed(2)} DT</>
                         )}
                       </button>

                    </div>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Order Summary Overlay / Sticky */}
        <div className="w-full lg:w-[400px] shrink-0 relative">
          <div className="bg-white border border-gray-100 p-8 sticky top-32 shadow-sm">
             <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-8 pb-4 border-b border-black">Votre Panier <span className="ml-2 bg-[#F9F9F8] text-gray-600 px-2.5 py-1 rounded-sm text-[10px]">{items.length}</span></h3>
             
             {/* Mini items list */}
             <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
               {items.map(item => (
                 <div key={item.id} className="flex gap-4 group">
                   <div className="w-20 h-24 bg-[#F9F9F8] overflow-hidden shrink-0">
                     <img src={item.product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/800'} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   </div>
                   <div className="flex-1 flex flex-col pt-1">
                     <p className="text-sm font-serif font-medium line-clamp-2 leading-snug">{item.product.name}</p>
                     <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">
                       {item.color && `${item.color} `}
                       {item.size && `| ${item.size}`}
                     </p>
                     <div className="flex justify-between items-end mt-auto pb-1">
                       <span className="text-xs text-gray-400">Qté: {item.quantity}</span>
                       <span className="text-sm font-medium">{(item.product.price * item.quantity).toFixed(2)} DT</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="border-t border-gray-100 pt-6 space-y-4 text-xs tracking-wide">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total</span>
                  <span className="text-black">{(cartTotal).toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Livraison</span>
                  <span>{currentShippingCost === 0 ? <span className="text-black uppercase tracking-widest text-[10px]">Offerte</span> : <span className="text-black">{currentShippingCost.toFixed(2)} DT</span>}</span>
                </div>
             </div>

             <div className="border-t border-black mt-6 pt-6 flex justify-between items-end">
               <span className="text-xs font-bold uppercase tracking-widest text-black">Total</span>
               <span className="text-2xl font-serif font-light">{finalTotal.toFixed(2)} DT</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
