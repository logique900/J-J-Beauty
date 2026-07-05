import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Mail, MessageSquare, Trash2, CheckCircle, Clock } from 'lucide-react';
import { toast } from '../../lib/toast';

export function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), { status: 'read' });
      toast.success('Marqué comme lu');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
      toast.success('Message supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Questions & Feedback</h2>
        <span className="bg-brand-100 text-brand-900 px-3 py-1 rounded-full text-xs font-bold">
          {messages.length} messages
        </span>
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-brand-100">
            <MessageSquare className="w-12 h-12 text-brand-200 mx-auto mb-4" />
            <p className="text-brand-500">Aucun message reçu pour le moment.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`bg-white p-6 rounded-2xl border transition-all ${m.status === 'unread' ? 'border-brand-900 ring-1 ring-brand-900/10 shadow-md' : 'border-brand-100'}`}>
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.status === 'unread' ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-500'}`}>
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-950 flex items-center gap-2">
                      {m.name} 
                      {m.status === 'unread' && <span className="w-2 h-2 bg-brand-900 rounded-full"></span>}
                    </h3>
                    <p className="text-sm text-brand-600">{m.email}</p>
                    <p className="text-xs text-brand-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {m.createdAt?.toDate ? m.createdAt?.toDate().toLocaleString('fr-FR') : 'Date inconnue'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {m.status === 'unread' && (
                    <button 
                      onClick={() => markAsRead(m.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Marquer comme lu"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteMessage(m.id)}
                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-brand-50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2 block">Sujet: {m.subject}</span>
                <p className="text-brand-800 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
              </div>

              {m.orderId && (
                <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100 inline-flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-900">Commande associée: #{m.orderId}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
