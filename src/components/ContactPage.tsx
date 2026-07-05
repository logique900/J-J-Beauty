import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '../lib/toast';

export function ContactPage({ onNavigateHome }: { onNavigateHome: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Question sur un produit',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        status: 'unread',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      toast.success('Message envoyé avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-6 py-32 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-brand-900 mb-4">Merci pour votre message !</h1>
        <p className="text-brand-600 mb-8">Nous avons bien reçu votre question et nous vous répondrons dans les plus brefs délais.</p>
        <button 
          onClick={onNavigateHome}
          className="px-8 py-3 bg-brand-900 text-white rounded-xl font-bold hover:bg-brand-950 transition"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-serif font-bold text-brand-900 mb-4">Contactez-nous</h1>
        <p className="text-brand-600 max-w-2xl mx-auto">
          Une question sur un produit, une commande ou simplement envie de nous dire bonjour ? 
          Notre équipe est à votre écoute.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Info Cards */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-brand-100 shadow-sm">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-6">
              <Phone className="w-6 h-6 text-brand-900" />
            </div>
            <h3 className="font-bold text-lg text-brand-900 mb-2">Téléphone</h3>
            <p className="text-brand-600 text-sm">+216 12 345 678</p>
            <p className="text-brand-400 text-xs mt-1">Lun - Ven, 9h - 18h</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-brand-100 shadow-sm">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-brand-900" />
            </div>
            <h3 className="font-bold text-lg text-brand-900 mb-2">Email</h3>
            <p className="text-brand-600 text-sm">contact@jjbeauty.com</p>
            <p className="text-brand-400 text-xs mt-1">Réponse sous 24h</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-brand-100 shadow-sm">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6 text-brand-900" />
            </div>
            <h3 className="font-bold text-lg text-brand-900 mb-2">Boutique</h3>
            <p className="text-brand-600 text-sm">Avenue Habib Bourguiba, Tunis</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-3xl border border-brand-100 shadow-xl">
          <h2 className="text-2xl font-serif font-bold text-brand-900 mb-8">Envoyez-nous votre question</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wider text-[10px]">Votre Nom</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  className="w-full px-4 py-3 bg-brand-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-900 outline-none transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wider text-[10px]">Adresse Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                  className="w-full px-4 py-3 bg-brand-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-900 outline-none transition-all"
                  placeholder="jean@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wider text-[10px]">Sujet de votre question</label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-3 bg-brand-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-900 outline-none transition-all"
              >
                <option>Question sur un produit</option>
                <option>Suivi de commande</option>
                <option>Réclamation</option>
                <option>Partenariat</option>
                <option>Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-900 mb-2 uppercase tracking-wider text-[10px]">Votre Message / Question</label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required 
                className="w-full px-4 py-3 bg-brand-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-900 outline-none transition-all min-h-[150px] resize-none"
                placeholder="Dites-nous tout..."
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-10 py-4 bg-brand-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-950 transition disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Envoyer ma question
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
