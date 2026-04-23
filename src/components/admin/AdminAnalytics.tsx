import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Globe, Package, Users, ShoppingCart, DollarSign, 
  Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, Settings
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// --- MOCK DATA --- (Keeping these for charts where real historical data isn't easily computable from single order docs without a dedicated stats collection)
const SALES_DATA = [
  { name: 'Lun', ventes: 4000, cible: 3000 },
  { name: 'Mar', ventes: 3000, cible: 3000 },
  { name: 'Mer', ventes: 5000, cible: 3500 },
  { name: 'Jeu', ventes: 2780, cible: 3500 },
  { name: 'Ven', ventes: 6890, cible: 4000 },
  { name: 'Sam', ventes: 8390, cible: 5000 },
  { name: 'Dim', ventes: 9490, cible: 5000 },
];

const TRAFFIC_SOURCES = [
  { name: 'Recherche Organique', value: 45 },
  { name: 'Réseaux Sociaux', value: 25 },
  { name: 'Direct', value: 15 },
  { name: 'Emailing', value: 10 },
  { name: 'Ads', value: 5 },
];

const COLORS = ['#9b4b4b', '#d4a373', '#e2ccb4', '#856A5D', '#D9C5B2'];

const FINANCE_DATA = [
  { name: 'Jan', CA: 45000, Couts: 20000, Marge: 25000 },
  { name: 'Fév', CA: 52000, Couts: 22000, Marge: 30000 },
  { name: 'Mar', CA: 48000, Couts: 21000, Marge: 27000 },
  { name: 'Avr', CA: 61000, Couts: 25000, Marge: 36000 },
];

const SUB_TABS = [
  { id: 'sales', label: 'Ventes', icon: TrendingUp },
  { id: 'traffic', label: 'Trafic Web', icon: Globe },
  { id: 'products', label: 'Performances Produits', icon: Package },
  { id: 'customers', label: 'Fidélité & Clients', icon: Users },
  { id: 'abandoned', label: 'Paniers Abandonnés', icon: ShoppingCart },
  { id: 'finance', label: 'Rapport Financier', icon: DollarSign },
];

const KpiBox = ({ title, value, trend, isPos }: { title: string, value: string, trend: string, isPos: boolean }) => (
  <div className="bg-white p-5 rounded-xl border border-brand-100 shadow-sm">
    <div className="text-sm font-medium text-brand-500 mb-2">{title}</div>
    <div className="text-2xl font-bold text-brand-900 mb-2">{value}</div>
    <div className={`text-xs font-bold flex items-center gap-1 ${isPos ? 'text-green-600' : 'text-red-500'}`}>
      {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {trend} vs période préc.
    </div>
  </div>
);

export function AdminAnalytics() {
  const { isAdmin } = useAuth();
  const [activeReport, setActiveReport] = useState('sales');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersCount: 0,
    averageValue: 0,
    conversionRate: 3.2
  });

  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snap) => {
      const orders = snap.docs.map(doc => doc.data());
      const total = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      const count = orders.length;
      setStats({
        totalRevenue: total,
        ordersCount: count,
        averageValue: count > 0 ? total / count : 0,
        conversionRate: 3.2 // Hardcoded as we don't have visitor count tracking yet
      });
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const renderKPIs = () => {
    switch (activeReport) {
      case 'sales':
        return (
          <>
            <KpiBox title="Chiffre d'Affaires" value={`${stats.totalRevenue.toLocaleString()} DT`} trend="+12.5%" isPos={true} />
            <KpiBox title="Commandes" value={stats.ordersCount.toString()} trend="+5.2%" isPos={true} />
            <KpiBox title="Panier Moyen" value={`${stats.averageValue.toFixed(2)} DT`} trend="+1.2%" isPos={true} />
            <KpiBox title="Taux de Conversion" value={`${stats.conversionRate}%`} trend="-0.4%" isPos={false} />
          </>
        );
      case 'finance':
        return (
          <>
            <KpiBox title="Revenus Nets" value="184 000 DT" trend="+18.5%" isPos={true} />
            <KpiBox title="Coût des Marchandises" value="88 000 DT" trend="+10.2%" isPos={false} />
            <KpiBox title="Marge Brute" value="52.1%" trend="+2.4%" isPos={true} />
            <KpiBox title="Remboursements" value="1 240 DT" trend="-15.0%" isPos={true} />
          </>
        );
      case 'abandoned':
        return (
          <>
            <KpiBox title="Paniers Abandonnés" value="1 240" trend="+2.5%" isPos={false} />
            <KpiBox title="Montant Perdu" value="58 000 DT" trend="+4.2%" isPos={false} />
            <KpiBox title="Paniers Récupérés" value="342" trend="+12.5%" isPos={true} />
            <KpiBox title="Taux de Récupération" value="27.5%" trend="+5.4%" isPos={true} />
          </>
        );
      case 'traffic':
        return (
          <>
            <KpiBox title="Visiteurs Uniques" value="124K" trend="+22.5%" isPos={true} />
            <KpiBox title="Taux de Rebond" value="42.5%" trend="-5.2%" isPos={true} />
            <KpiBox title="Pages par Session" value="4.2" trend="+0.8%" isPos={true} />
            <KpiBox title="Temps Moyen" value="3m 45s" trend="+12s" isPos={true} />
          </>
        );
      default:
        return (
          <>
            <KpiBox title="Donnée Principale" value="--" trend="0%" isPos={true} />
            <KpiBox title="Indicateur Secondaire" value="--" trend="0%" isPos={true} />
            <KpiBox title="Valeur" value="--" trend="0%" isPos={true} />
            <KpiBox title="Évolution" value="--" trend="0%" isPos={true} />
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-brand-900">Analytiques & Rapports</h2>
        <div className="flex gap-3">
          <div className="flex items-center border border-brand-200 rounded-lg px-3 py-2 bg-white text-sm font-medium text-brand-700 shadow-sm cursor-pointer hover:bg-brand-50">
            <Calendar className="w-4 h-4 mr-2 text-brand-500" />
            01 Avr - 20 Avr 2026
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-950 transition font-bold shadow-sm">
            <Download className="w-4 h-4" /> Exporter le Rapport
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-4 space-y-1">
            {SUB_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeReport === tab.id 
                    ? 'bg-brand-50 text-brand-900 border border-brand-200' 
                    : 'text-brand-600 hover:bg-brand-50/50 hover:text-brand-900 border border-transparent'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeReport === tab.id ? 'text-brand-900' : 'text-brand-400'}`} />
                {tab.label}
              </button>
            ))}
            
            <div className="mt-8 pt-4 border-t border-brand-100">
               <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-brand-500 hover:text-brand-900 transition flex-row">
                 <span className="flex items-center gap-3"><Settings className="w-5 h-5"/> Dashboards Perso.</span>
               </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
            {renderKPIs()}
          </div>

          {/* Main Charts */}
          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-brand-900">
                {activeReport === 'sales' ? 'Comparaison des Ventes' : 
                 activeReport === 'finance' ? 'Chiffre d\'Affaires vs Coûts' : 
                 activeReport === 'traffic' ? 'Sources de Trafic' : 'Vue détaillée'}
              </h3>
              <button className="text-sm border border-brand-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-brand-50 text-brand-700">
                <Filter className="w-4 h-4"/> Filtrer la vue
              </button>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {activeReport === 'sales' ? (
                  <LineChart data={SALES_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f7eaea" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b3535', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b3535', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f7eaea' }} />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="ventes" name="Ventes Actuelles" stroke="#9b4b4b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="cible" name="Objectif" stroke="#d4a373" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                ) : activeReport === 'finance' ? (
                  <BarChart data={FINANCE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f7eaea" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b3535', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b3535', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f7eaea' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="CA" name="Chiffre d'Affaires" fill="#9b4b4b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Couts" name="Coûts" fill="#d4a373" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Marge" name="Marge Brute" fill="#e2ccb4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : activeReport === 'traffic' ? (
                  <PieChart>
                    <Pie
                      data={TRAFFIC_SOURCES}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                    >
                      {TRAFFIC_SOURCES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}%`, undefined]}
                    />
                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-brand-400 font-medium">
                     Sélectionnez une période contenant des données pour afficher le graphe.
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Table / Panel */}
          {activeReport === 'products' && (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-5 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
                <h3 className="font-bold text-brand-900">Performances par Produit</h3>
              </div>
              <table className="w-full text-left text-sm text-brand-700">
                <thead className="border-b border-brand-100 text-brand-500 text-xs uppercase bg-white">
                  <tr>
                    <th className="px-6 py-3 font-medium">Produit</th>
                    <th className="px-6 py-3 font-medium text-right">Vues</th>
                    <th className="px-6 py-3 font-medium text-right">Ajouts Panier</th>
                    <th className="px-6 py-3 font-medium text-right">Achats</th>
                    <th className="px-6 py-3 font-medium text-right">Conv. (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50 bg-white">
                  <tr>
                    <td className="px-6 py-4 font-bold text-brand-900">Sérum Éclat Vitamine C</td>
                    <td className="px-6 py-4 text-right">12,450</td>
                    <td className="px-6 py-4 text-right">3,200</td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold">850</td>
                    <td className="px-6 py-4 text-right font-medium">6.8%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-brand-900">Crème Hydratante Nuit</td>
                    <td className="px-6 py-4 text-right">8,120</td>
                    <td className="px-6 py-4 text-right">1,400</td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold">420</td>
                    <td className="px-6 py-4 text-right font-medium">5.1%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-brand-900">Fond de Teint Fluide</td>
                    <td className="px-6 py-4 text-right">15,000</td>
                    <td className="px-6 py-4 text-right">4,500</td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold">1,200</td>
                    <td className="px-6 py-4 text-right font-medium">8.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
