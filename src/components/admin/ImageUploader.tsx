import React, { useState, useRef } from 'react';
import { auth } from '../../lib/firebase';
import { Upload, X, Check, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export function ImageUploader({ label, value, onChange, folder = 'categories', className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (PNG, JPG, etc.).');
      return;
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('L\'image est trop lourde (max 10MB).');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setUploading(false);
        return;
      }

      console.group(`Upload: ${file.name}`);
      console.log(`Processing image locally for Base64 (circumventing Storage)...`);

      // Compress and convert to Base64 to bypass Firebase Storage quota/permissions
      const compressAndGetBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800; // Compress appropriately for Firestore document limits
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Ensure transparent PNGs do not have black background when converting to JPEG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
              }
              
              // Resolve with JPEG format and 0.8 quality to keep size small (~50-100KB)
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Format d\'image invalide'));
          };
          reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        });
      };

      // Simulate a progress bar for better UX
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 100);

      const base64Url = await compressAndGetBase64(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      console.log('Image processing successful');
      console.groupEnd();
      
      setTimeout(() => {
        onChange(base64Url);
        setUploading(false);
      }, 300);

    } catch (err: any) {
      console.error("Local Image Compressor Error:", err);
      console.groupEnd();
      setError(`Erreur lors du traitement: ${err.message || "Impossible de compresser l'image"}`);
      setUploading(false);
    }
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-brand-700">{label}</label>
        <div className="flex bg-brand-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              mode === 'upload' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500 hover:text-brand-700'
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              mode === 'url' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500 hover:text-brand-700'
            }`}
          >
            URL Directe
          </button>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
          accept="image/*"
        />

        <AnimatePresence mode="wait">
          {mode === 'url' ? (
            <motion.div
              key="url-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 p-4 border-2 border-brand-200 rounded-xl bg-white"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                  className="flex-1 px-3 py-2 text-sm border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm font-bold hover:bg-brand-800 transition-colors shadow-sm"
                >
                  Valider
                </button>
              </div>
              
              {value && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-brand-100 group shadow-sm bg-brand-50">
                  <img 
                    src={value} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => { onChange(''); setUrlInput(''); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-[10px] text-brand-500 italic flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Alternative si l'upload Storage est bloqué (forfait Blaze requis).
              </p>
            </motion.div>
          ) : value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative aspect-video w-full rounded-xl border border-brand-200 overflow-hidden bg-brand-50 group shadow-sm"
            >
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white rounded-full text-brand-900 hover:bg-brand-50 transition shadow-lg"
                  title="Changer d'image"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition shadow-lg"
                  title="Supprimer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative aspect-video w-full rounded-xl border-2 border-dashed border-brand-200 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:bg-brand-50/50 hover:border-brand-400 ${
                uploading ? 'pointer-events-none' : ''
              }`}
            >
              {uploading ? (
                <div className="text-center space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-brand-100"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={175.9}
                        strokeDashoffset={175.9 * (1 - progress / 100)}
                        className="text-brand-900 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-900">
                      {progress}%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-brand-600">Envoi en cours...</p>
                  <p className="text-[10px] text-brand-400">Veuillez ne pas fermer cette fenêtre</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-brand-50 rounded-full text-brand-400 group-hover:text-brand-600 transition-colors">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-brand-900">Cliquez pour ajouter une image</p>
                    <p className="text-xs text-brand-500">ou glissez-déposez ici</p>
                  </div>
                  <p className="text-[10px] text-brand-400">JPG, PNG, WebP (max 5MB)</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:underline font-bold"
              >
                Réessayer
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
