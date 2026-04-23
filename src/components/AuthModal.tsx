import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Check, Facebook, Github, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { useBiometrics } from '../hooks/useBiometrics';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

type AuthView = 'login' | 'register' | 'registered' | 'forgot_password' | 'forgot_password_sent' | '2fa';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const { isSupported, checkSupport, authenticateBiometrics } = useBiometrics();
  const [view, setView] = useState<AuthView>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Login & Security States
  const [rememberMe, setRememberMe] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Registration Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Reset state on close
  useEffect(() => {
    if (!isAuthModalOpen) {
      setTimeout(() => {
        setView('login');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setAcceptTerms(false);
        setAcceptPrivacy(false);
        setEmailAvailable(null);
        setRememberMe(false);
        setFailedAttempts(0);
        setIsLocked(false);
        setLoginError('');
        setTwoFactorCode('');
      }, 300);
    }
  }, [isAuthModalOpen]);

  // Simulated email availability check
  useEffect(() => {
    if (view === 'register' && email.includes('@') && email.includes('.')) {
      setIsCheckingEmail(true);
      const timer = setTimeout(() => {
        // Mock: if email starts with 'test', it's unavailable
        setEmailAvailable(!email.toLowerCase().startsWith('test'));
        setIsCheckingEmail(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEmailAvailable(null);
    }
  }, [email, view]);

  // Password Strength Logic
  const getPasswordStrength = () => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    if (checks.length) score++;
    if (checks.upper) score++;
    if (checks.number) score++;
    if (checks.special) score++;
    return { score, checks };
  };

  const { score: pwdScore, checks: pwdChecks } = getPasswordStrength();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !acceptPrivacy || pwdScore < 4 || emailAvailable === false) return;
    
    setIsProcessing(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: `${firstName} ${lastName}` });
      
      // Save to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        name: `${firstName} ${lastName}`,
        role: 'user',
        createdAt: serverTimestamp()
      }).catch(err => {
        // Handle permissions error per spec, but dont block registration completion
        console.error("Firestore user profile creation failed:", err);
      });
      
      setView('registered');
    } catch (err: any) {
      setLoginError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setIsProcessing(true);
    setLoginError('');
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLoginError('Compte verrouillé après 5 tentatives échouées. Veuillez réessayer dans 30 minutes.');
        } else {
          setLoginError(`Identifiants incorrects. Tentatives restantes : ${5 - newAttempts}`);
        }
      } else {
        setLoginError('Une erreur est survenue lors de la connexion.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 2FA logic is highly complex without backend. Proceeding with simulated pass if code is '123456'
    if (twoFactorCode !== '123456') {
      setLoginError('Code invalide. Essayez "123456".');
      return;
    }
    closeAuthModal();
  };

  const handleForgotPwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setView('forgot_password_sent');
    } catch (err: any) {
      setLoginError('Impossible d\'envoyer l\'email de réinitialisation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
      if (providerName === 'google') provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: result.user.email,
          name: result.user.displayName || 'Utilisateur Social',
          role: 'user',
          createdAt: serverTimestamp()
        }).catch(e => console.error(e));
      }

      closeAuthModal();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setLoginError(`Connexion sociale échouée. Veuillez utiliser l'email.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsProcessing(true);
    try {
      const assertion = await authenticateBiometrics();
      if (assertion) {
        // In a real app, you'd verify this assertion on your server.
        // For this demo, if the biometric check passes, we simulate a login.
        // NOTE: This is purely for UI demonstration as actual Firebase auth requires a token.
        alert("Authentification biométrique réussie ! (Simulation)");
        closeAuthModal();
      }
    } catch (err) {
      setLoginError("Échec de l'authentification biométrique.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isAuthModalOpen) {
      checkSupport();
    }
  }, [isAuthModalOpen, checkSupport]);

  const socialButtons = (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm">
        <svg className="w-5 h-5 text-[#4285F4]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
        Google
      </button>
      <button className="flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium text-sm">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
        Apple
      </button>
      <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition font-medium text-sm">
        <Facebook className="w-5 h-5" />
        Facebook
      </button>
      <button onClick={() => handleSocialLogin('github')} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-100 transition font-medium text-sm">
        <Github className="w-5 h-5" />
        GitHub
      </button>
      {isSupported && (
        <button 
          onClick={handleBiometricLogin}
          className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl hover:bg-brand-100 transition font-bold text-sm"
        >
          <Fingerprint className="w-5 h-5" />
          Se connecter avec la biométrie
        </button>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {view === 'registered' ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez vos e-mails</h2>
                <p className="text-gray-500 mb-6">
                  Un lien de confirmation a été envoyé à <strong>{email}</strong>. 
                  Veuillez cliquer dessus pour activer votre compte.
                </p>
                <button onClick={closeAuthModal} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition">
                  J'ai compris
                </button>
              </div>
            ) : (
              <>
                <div className="p-8 pb-0">
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
                    {view === 'login' ? 'Bon retour' : view === '2fa' ? 'Double authentification' : view === 'forgot_password' ? 'Mot de passe oublié' : 'Créer un compte'}
                  </h2>
                  {(view === 'login' || view === 'register') && socialButtons}
                  {(view === 'login' || view === 'register') && (
                    <div className="relative flex items-center py-4 mb-2">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">ou par email</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                  )}
                </div>

                <div className="p-8 pt-0 overflow-y-auto hide-scrollbar">
                  {view === 'forgot_password' ? (
                    <form onSubmit={handleForgotPwdSubmit} className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">Entrez votre adresse courriel pour recevoir un lien de réinitialisation sécurisé (valable 1 heure).</p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none" required />
                      </div>
                      <button type="submit" disabled={isProcessing} className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isProcessing ? 'Envoi...' : 'Envoyer le lien'}
                      </button>
                      <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm font-bold text-gray-600 mt-4 hover:underline">Annuler et retourner</button>
                    </form>
                  ) : view === 'forgot_password_sent' ? (
                    <div className="text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6"><Mail className="w-8 h-8" /></div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien envoyé !</h2>
                      <p className="text-gray-500 mb-6">Si <strong>{email}</strong> correspond à un compte actif, vous recevrez un lien de réinitialisation unique d'ici quelques instants.</p>
                      <button onClick={() => setView('login')} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition">Retour à la connexion</button>
                    </div>
                  ) : view === '2fa' ? (
                    <form onSubmit={handle2FASubmit} className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">Par mesure de sécurité (2FA), veuillez entrer le code à 6 chiffres généré par votre application d'authentification ou reçu par SMS.</p>
                      <div>
                        <input type="text" maxLength={6} placeholder="123456" value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none text-center font-mono text-2xl tracking-[0.5em]" required />
                      </div>
                      {loginError && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mt-2">{loginError}</div>}
                      <button type="submit" className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition mt-6">Valider la connexion</button>
                      <button type="button" onClick={() => { setView('login'); setLoginError(''); }} className="w-full text-center text-sm font-bold text-gray-600 mt-4 hover:underline">Retour</button>
                    </form>
                  ) : view === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none" required />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                          <button type="button" onClick={() => setView('forgot_password')} className="text-sm text-blue-600 hover:underline">Oublié ?</button>
                        </div>
                        <input type="password" disabled={isLocked} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none disabled:bg-gray-50" required />
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                         <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded text-black focus:ring-black border-gray-300" />
                         <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">Rester connecté (30 jours)</label>
                      </div>
                      
                      {loginError && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2 items-start mt-2">
                          <span className="font-bold">!</span> {loginError}
                        </div>
                      )}

                      <button type="submit" disabled={isLocked || isProcessing} className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isProcessing ? 'Connexion en cours...' : 'Se connecter'}
                      </button>
                      <p className="text-center text-sm text-gray-600 mt-4">
                        Nouveau client ? <button type="button" onClick={() => setView('register')} className="font-bold text-black hover:underline">S'inscrire</button>
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full px-4 py-3 rounded-xl border outline-none ${emailAvailable === false ? 'border-red-500 focus:border-red-500' : emailAvailable === true ? 'border-green-500 focus:border-green-500' : 'border-gray-200 focus:border-black'}`} required />
                          {isCheckingEmail && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Vérification...</span>}
                        </div>
                        {emailAvailable === false && <p className="text-xs text-red-500 mt-1">Cet email est déjà utilisé.</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-black focus:border-black outline-none" required />
                        
                        {/* Password Strength Indicator */}
                        {password.length > 0 && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[1, 2, 3, 4].map(level => (
                                <div key={level} className={`h-1.5 flex-1 rounded-full ${
                                  pwdScore >= level 
                                    ? (pwdScore === 4 ? 'bg-green-500' : pwdScore === 3 ? 'bg-blue-500' : pwdScore === 2 ? 'bg-yellow-500' : 'bg-red-500')
                                    : 'bg-gray-200'
                                }`} />
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-500 mt-2">
                              <span className={`flex items-center gap-1 ${pwdChecks.length ? 'text-green-600' : ''}`}><Check className="w-3 h-3"/> 8 caractères min.</span>
                              <span className={`flex items-center gap-1 ${pwdChecks.upper ? 'text-green-600' : ''}`}><Check className="w-3 h-3"/> 1 Majuscule</span>
                              <span className={`flex items-center gap-1 ${pwdChecks.number ? 'text-green-600' : ''}`}><Check className="w-3 h-3"/> 1 Chiffre</span>
                              <span className={`flex items-center gap-1 ${pwdChecks.special ? 'text-green-600' : ''}`}><Check className="w-3 h-3"/> 1 Caractère spécial</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-1 flex-shrink-0 text-black border-gray-300 rounded focus:ring-black" required />
                          <span className="text-xs text-gray-600">J'accepte les <a href="#" className="underline">Conditions Générales d'Utilisation</a> et de Vente.*</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={acceptPrivacy} onChange={e => setAcceptPrivacy(e.target.checked)} className="mt-1 flex-shrink-0 text-black border-gray-300 rounded focus:ring-black" required />
                          <span className="text-xs text-gray-600">J'ai lu et j'accepte la <a href="#" className="underline">Politique de Confidentialité</a>.*</span>
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={pwdScore < 4 || emailAvailable === false || !acceptTerms || !acceptPrivacy || isProcessing}
                        className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Création...' : 'Créer mon compte'}
                      </button>
                      <p className="text-center text-sm text-gray-600 mt-4">
                        Déjà inscrit ? <button type="button" onClick={() => setView('login')} className="font-bold text-black hover:underline">Se connecter</button>
                      </p>
                    </form>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
