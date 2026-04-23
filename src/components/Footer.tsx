import React from 'react';
import { motion } from 'motion/react';
import { Mail, Instagram, Facebook, Twitter, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-50 pt-16 pb-8 border-t border-brand-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter Section */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-brand-800 pb-12 mb-12 gap-8">
          <div className="max-w-lg">
            <h3 className="text-2xl font-serif font-bold mb-2">Rejoignez le Club J&J Beauty</h3>
            <p className="text-brand-300 text-sm">
              Inscrivez-vous à notre newsletter pour recevoir nos conseils beauté, offres exclusives et découvrir nos nouveautés en avant-première.
            </p>
          </div>
          <form className="w-full md:w-auto flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="relative w-full sm:w-80">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
              <input 
                type="email" 
                placeholder="Votre adresse email" 
                className="w-full pl-10 pr-4 py-3 bg-brand-900/50 border border-brand-700 rounded-lg text-white placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <button 
              type="submit" 
              className="px-6 py-3 bg-white text-brand-950 font-semibold rounded-lg hover:bg-brand-100 transition-colors whitespace-nowrap"
            >
              S'inscrire
            </button>
          </form>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg">J</span>
              </div>
              <span className="font-serif font-bold text-xl tracking-tight">J&J Beauty</span>
            </div>
            <p className="text-brand-300 text-sm leading-relaxed">
              L'excellence cosmétique à votre portée. Nous croyons en une beauté authentique, naturelle et responsable.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-brand-300 hover:text-white hover:bg-brand-800 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-brand-300 hover:text-white hover:bg-brand-800 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-brand-300 hover:text-white hover:bg-brand-800 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Boutique */}
          <div>
            <h4 className="text-white font-semibold mb-6">La Boutique</h4>
            <ul className="space-y-3 text-sm text-brand-300">
              <li><a href="#" className="hover:text-white transition-colors">Tous les produits</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Maquillage</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Soins Visage</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Soins Corps</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Nos Collections</a></li>
            </ul>
          </div>

          {/* Assistance */}
          <div>
            <h4 className="text-white font-semibold mb-6">Assistance</h4>
            <ul className="space-y-3 text-sm text-brand-300">
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Suivi de commande</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Livraisons & Retours</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Nous contacter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Points de vente</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-6">Nous trouver</h4>
            <ul className="space-y-4 text-sm text-brand-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-brand-500 mt-0.5" />
                <span>123 Avenue des Champs-Élysées<br/>75008 Paris, France</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 shrink-0 text-brand-500" />
                <span>+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 shrink-0 text-brand-500" />
                <span>contact@jjbeauty.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-brand-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-400">
          <p>© {new Date().getFullYear()} J&J Beauty. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="#" className="hover:text-brand-300 transition-colors">Conditions Générales de Vente</a>
            <a href="#" className="hover:text-brand-300 transition-colors">Politique de Confidentialité</a>
            <a href="#" className="hover:text-brand-300 transition-colors">Mentions Légales</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
