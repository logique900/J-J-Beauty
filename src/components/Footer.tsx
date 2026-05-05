import React from 'react';
import { motion } from 'motion/react';
import { Mail, Instagram, Facebook, Twitter, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-50 text-brand-950 pt-16 pb-8 border-t border-brand-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Newsletter Section */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between border-b border-brand-200 pb-12 mb-12 gap-8 transition-colors text-center lg:text-left">
          <div className="max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-3">Rejoignez le Club J&J Beauty</h3>
            <p className="text-brand-700 text-sm sm:text-base transition-colors max-w-lg mx-auto lg:mx-0">
              Inscrivez-vous à notre newsletter pour recevoir nos conseils beauté, offres exclusives et découvrir nos nouveautés en avant-première.
            </p>
          </div>
          <form className="w-full sm:max-w-md lg:w-auto flex flex-col sm:flex-row gap-3 mx-auto lg:mx-0" onSubmit={(e) => e.preventDefault()}>
            <div className="relative w-full sm:w-80">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-500" />
              <input 
                type="email" 
                placeholder="Votre adresse email" 
                className="w-full pl-10 pr-4 py-3 bg-brand-100 border border-brand-200 rounded-lg text-brand-950 placeholder:text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full sm:w-auto px-6 py-3 bg-brand-900 text-brand-50 font-semibold rounded-lg hover:bg-brand-800 transition-colors whitespace-nowrap"
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
              <div className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center transition-colors">
                <span className="text-brand-50 font-serif font-bold text-lg">J</span>
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-brand-950 transition-colors">J&J Beauty</span>
            </div>
            <p className="text-brand-700 text-sm leading-relaxed transition-colors">
              L'excellence cosmétique à votre portée. Nous croyons en une beauté authentique, naturelle et responsable.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 hover:text-brand-50 hover:bg-brand-900 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 hover:text-brand-50 hover:bg-brand-900 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 hover:text-brand-50 hover:bg-brand-900 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Boutique */}
          <div>
            <h4 className="text-brand-950 font-semibold mb-6 transition-colors">La Boutique</h4>
            <ul className="space-y-3 text-sm text-brand-700 transition-colors">
              <li><a href="#" className="hover:text-brand-950 transition-colors">Tous les produits</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Maquillage</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Soins Visage</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Soins Corps</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Nos Collections</a></li>
            </ul>
          </div>

          {/* Assistance */}
          <div>
            <h4 className="text-brand-950 font-semibold mb-6 transition-colors">Assistance</h4>
            <ul className="space-y-3 text-sm text-brand-700 transition-colors">
              <li><a href="#" className="hover:text-brand-950 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Suivi de commande</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Livraisons & Retours</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Nous contacter</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Points de vente</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-brand-950 font-semibold mb-6 transition-colors">Nous trouver</h4>
            <ul className="space-y-4 text-sm text-brand-700 transition-colors">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-brand-600 mt-0.5" />
                <span>123 Avenue des Champs-Élysées<br/>75008 Paris, France</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 shrink-0 text-brand-600" />
                <span>+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 shrink-0 text-brand-600" />
                <span>contact@jjbeauty.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-brand-200 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-sm text-brand-600 transition-colors text-center md:text-left">
          <p className="shrink-0 order-2 md:order-1">© {new Date().getFullYear()} J&J Beauty. Tous droits réservés.</p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 order-1 md:order-2">
            <a href="#" className="hover:text-brand-950 transition-colors">Conditions Générales de Vente</a>
            <a href="#" className="hover:text-brand-950 transition-colors">Politique de Confidentialité</a>
            <a href="#" className="hover:text-brand-950 transition-colors">Mentions Légales</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
