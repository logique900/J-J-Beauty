import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, ShoppingCart, Users, AlertTriangle, 
  ChevronDown, ArrowUpRight, ArrowDownRight, RefreshCcw, Bell,
  LayoutDashboard, PieChart as PieChartIcon, ShoppingBag, 
  Users2, Box, Tag, Globe, Settings, Menu, X, LogOut, Search
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

import { AdminProducts } from './AdminProducts';
import { AdminInventory } from './AdminInventory';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminCategories } from './AdminCategories';
import { AdminBrands } from './AdminBrands';
import { AdminSettings } from './AdminSettings';
import { AdminHero } from './AdminHero';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const REVENUE_DATA = [
  { name: '14 Avr', rev: 4000, conv: 2.4 },
  { name: '15 Avr', rev: 3000, conv: 1.8 },
  { name: '16 Avr', rev: 2000, conv: 1.2 },
  { name: '17 Avr', rev: 2780, conv: 2.1 },
  { name: '18 Avr', rev: 1890, conv: 1.4 },
  { name: '19 Avr', rev: 2390, conv: 1.9 },
  { name: '20 Avr', rev: 3490, conv: 2.8 },
];

const CATEGORY_DATA = [
  { name: 'Maquillage', value: 45 },
  { name: 'Soins', value: 35 },
  { name: 'Parfums', value: 20 },
];
const COLORS = ['#9b4b4b', '#d4a373', '#e2ccb4'];

const ALERTS = [
  { id: 1, type: 'stock', message: 'Sérum Éclat Vitamine C - Stock critique (5 restants)', level: 'high' },
  { id: 2, type: 'order', message: 'Commande anormale détectée (Montant: 850DT)', level: 'medium' },
  { id: 3, type: 'review', message: 'Nouvel avis négatif (1 étoile) sur "Fond de Teint Fluide"', level: 'medium' },
  { id: 4, type: 'traffic', message: 'Pic de trafic détecté (+45% de visiteurs)', level: 'info' }
];

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'overview' | 'analytics' | 'orders' | 'customers' | 'products' | 'categories' | 'brands' | 'inventory' | 'settings' | 'hero';

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState('7 Jours');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState({ revenue: 0, ordersCount: 0, avgCart: 0, uniqueVisitors: 0 });
  const [dbLoading, setDbLoading] = useState(true);
  const [adminAlerts, setAdminAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    setDbLoading(true);
    setError(null);

    // Fetch recent orders for the dashboard
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      try {
        const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const mappedOrders = orders.map((o: any) => ({
          id: o.id,
          customer: (o.shippingAddress?.firstName || '') + ' ' + (o.shippingAddress?.lastName || 'Client'),
          amount: o.totalAmount || 0,
          status: o.status || 'pending',
          date: new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        }));
        setRecentOrders(mappedOrders.slice(0, 5)); // Keep only latest 5 for overview

        // Create dynamic alerts from recent orders
        const dynamicOrderAlerts = orders.slice(0, 3).map((o: any) => ({
          id: `order-${o.id}`,
          type: 'order',
          message: `Nouvelle commande de ${(o.shippingAddress?.firstName || '')} ${o.shippingAddress?.lastName || 'Client'} (${o.totalAmount || 0} DT)`,
          level: 'medium',
          dateObj: o.createdAt?.toDate ? o.createdAt.toDate() : new Date()
        }));

        // Combine with some static mock alerts for UI fullness
        const mixedAlerts = [
          { id: 'stock-1', type: 'stock', message: 'Sérum Éclat Vitamine C - Stock critique (5 restants)', level: 'high', dateObj: new Date() },
          ...dynamicOrderAlerts,
          { id: 'traffic-1', type: 'traffic', message: 'Pic de trafic détecté (+45% de visiteurs)', level: 'info', dateObj: new Date(Date.now() - 3600000) }
        ];
        
        // Sort alerts by date
        mixedAlerts.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
        setAdminAlerts(mixedAlerts);

        // Simple aggregations for demo 
        const totalRev = orders.reduce((acc: number, cur: any) => acc + (cur.totalAmount || 0), 0);
        const count = orders.length;
        setKpiStats(prev => ({
          ...prev,
          revenue: totalRev,
          ordersCount: count,
          avgCart: count > 0 ? totalRev / count : 0
        }));
        setDbLoading(false);
      } catch (err: any) {
        console.error("Dashboard data processing error:", err);
        setError("Erreur lors du traitement des données.");
        setDbLoading(false);
      }
    }, (err) => {
      console.error("Dashboard onSnapshot error:", err);
      if (err.message.includes('Missing or insufficient permissions')) {
        setError("Permissions insuffisantes pour accéder au tableau de bord.");
      } else {
        setError("Erreur de connexion à la base de données.");
      }
      setDbLoading(false);
    });

    const unsubscribeVisits = onSnapshot(collection(db, 'visits'), (snap) => {
      try {
        const visitorIds = new Set();
        snap.docs.forEach(doc => {
          const data = doc.data();
          const id = data.userId || data.anonymousId;
          if (id) visitorIds.add(id);
        });
        const cnt = visitorIds.size;
        setKpiStats(prev => ({
           ...prev,
           uniqueVisitors: cnt
        }));
      } catch (err) {
        console.error("Error reading visitors:", err);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeVisits();
    };
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-brand-100 text-center">
          <h2 className="text-2xl font-serif font-bold text-brand-900 mb-4">Accès Refusé</h2>
          <p className="text-brand-600 mb-6">Vous n'avez pas les permissions pour accéder au panneau d'administration.</p>
          <button onClick={onBack} className="w-full py-3 bg-brand-900 text-white font-bold rounded-lg hover:bg-brand-950 transition">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-100 text-red-800 p-8 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Une erreur est survenue</h3>
          <p className="text-sm opacity-90 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
            Réessayer
          </button>
        </div>
      );
    }

    if (dbLoading && activeTab === 'overview') {
      return (
        <div className="py-20 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-48 bg-brand-100 rounded mb-4"></div>
            <div className="h-8 w-64 bg-brand-200 rounded"></div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'analytics':
        return <AdminAnalytics />;
      case 'orders':
        return <AdminOrders />;
      case 'customers':
        return <AdminCustomers />;
      case 'products':
        return <AdminProducts />;
      case 'inventory':
        return <AdminInventory />;
      case 'categories':
        return <AdminCategories />;
      case 'brands':
        return <AdminBrands />;
      case 'settings':
        return <AdminSettings />;
      case 'hero':
        return <AdminHero />;
      case 'overview':
      default:
        return (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h1 className="text-2xl font-serif font-bold text-brand-900">Vue d'ensemble</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-brand-600 font-medium">Période:</span>
                <div className="relative">
                  <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="appearance-none bg-white border border-brand-200 text-brand-800 text-sm font-medium rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-900 cursor-pointer shadow-sm"
                  >
                    <option>Aujourd'hui</option>
                    <option>7 Jours</option>
                    <option>30 Jours</option>
                    <option>Cette année</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-brand-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button className="p-2 bg-white border border-brand-200 rounded-xl text-brand-600 hover:bg-brand-100 hover:text-brand-900 transition-colors shadow-sm">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard title="Revenus" value={`${kpiStats.revenue.toFixed(2)} DT`} trend="+12.5%" isPositive={true} icon={<TrendingUp className="w-5 h-5 text-brand-700" />} />
              <KpiCard title="Commandes" value={kpiStats.ordersCount.toString()} trend="+5.2%" isPositive={true} icon={<ShoppingCart className="w-5 h-5 text-brand-700" />} />
              <KpiCard title="Panier Moyen" value={`${kpiStats.avgCart.toFixed(2)} DT`} trend="-1.2%" isPositive={false} icon={<Package className="w-5 h-5 text-brand-700" />} />
              <KpiCard title="Visiteurs Uniques" value={kpiStats.uniqueVisitors.toLocaleString()} trend="+18.4%" isPositive={true} icon={<Users className="w-5 h-5 text-brand-700" />} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Main Chart */}
              <div className="bg-white dark:bg-brand-100 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-200 lg:col-span-2 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-brand-900">Évolution des Revenus</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9b4b4b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#9b4b4b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f7eaea" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b3535' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b3535' }} dx={-10} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#fff' }}
                        itemStyle={{ color: '#9b4b4b', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="rev" stroke="#9b4b4b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white dark:bg-brand-100 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-200 transition-colors">
                <h3 className="font-bold text-brand-900 mb-6">Ventes par Catégorie</h3>
                <div className="h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={CATEGORY_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {CATEGORY_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                     <span className="text-2xl font-bold text-brand-900">450</span>
                     <span className="text-xs text-brand-500">Produits</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  {CATEGORY_DATA.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="text-brand-700">{item.name}</span>
                      </div>
                      <span className="font-medium text-brand-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alerts Panel */}
              <div className="bg-white dark:bg-brand-100 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-200 lg:col-span-1 flex flex-col transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-brand-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent-500" />
                    Alertes & Notifications
                  </h3>
                </div>
                <div className="flex flex-col gap-4 flex-1">
                  {adminAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                      alert.level === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400' :
                      alert.level === 'medium' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-400' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-400'
                    }`}>
                      <div className={`mt-0.5 rounded-full p-1 ${
                        alert.level === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' :
                        alert.level === 'medium' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300' :
                        'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      }`}>
                        {alert.level === 'high' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <p className="text-sm font-medium flex-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white dark:bg-brand-100 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-200 lg:col-span-2 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-brand-900">Dernières Commandes</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-brand-600 dark:text-brand-700 hover:text-brand-900">Voir tout</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-brand-700">
                    <thead className="border-b border-brand-100 dark:border-brand-200 text-brand-500 uppercase text-xs">
                      <tr>
                        <th className="pb-3 font-medium">Commande</th>
                        <th className="pb-3 font-medium">Client</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Montant</th>
                        <th className="pb-3 font-medium text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50 dark:divide-brand-200">
                      {recentOrders.map(order => (
                        <tr key={order.id} className="hover:bg-brand-50 dark:hover:bg-brand-200 transition-colors">
                          <td className="py-4 font-medium text-brand-900">{order.id.slice(0, 8)}...</td>
                          <td className="py-4">{order.customer}</td>
                          <td className="py-4 text-brand-500">{order.date}</td>
                          <td className="py-4 font-medium">{order.amount.toFixed(2)} DT</td>
                          <td className="py-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              order.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              order.status === 'shipped' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                              order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              order.status === 'processing' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {order.status === 'confirmed' ? 'Confirmée' : order.status === 'shipped' ? 'Expédiée' : order.status === 'delivered' ? 'Livrée' : order.status === 'cancelled' ? 'Annulée' : 'En attente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytiques', icon: PieChartIcon },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'customers', label: 'Clients', icon: Users2 },
    { id: 'products', label: 'Produits', icon: ShoppingBag },
    { id: 'categories', label: 'Catégories', icon: LayoutDashboard },
    { id: 'brands', label: 'Marques', icon: Globe },
    { id: 'inventory', label: 'Inventaire', icon: Box },
    { id: 'hero', label: 'Hero Section', icon: LayoutDashboard },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="bg-brand-50 min-h-screen flex text-brand-950 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-brand-200 flex-col sticky top-0 h-screen z-40">
        <div className="p-6 h-20 flex items-center border-b border-brand-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg">J</span>
            </div>
            <div>
              <h2 className="font-serif font-bold text-brand-900 leading-none">J&J Beauty Admin</h2>
              <p className="text-[10px] text-brand-500 font-bold tracking-wider mt-1 uppercase">Tableau de Bord</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-brand-900 text-white shadow-lg shadow-brand-900/10'
                  : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-100">
           <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 text-brand-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
             <LogOut className="w-5 h-5" />
             Quitter l'admin
           </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-[60] lg:hidden flex flex-col"
            >
               <div className="p-6 h-20 flex items-center justify-between border-b border-brand-100 bg-brand-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center">
                      <span className="text-white font-serif font-bold text-lg">J</span>
                    </div>
                    <span className="font-serif font-bold text-brand-900 text-lg">J&J Beauty Admin</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-brand-400 hover:text-brand-900">
                    <X className="w-6 h-6" />
                  </button>
               </div>
               <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
                 {menuItems.map((item) => (
                   <button
                     key={item.id}
                     onClick={() => { setActiveTab(item.id as AdminTab); setIsSidebarOpen(false); }}
                     className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                       activeTab === item.id
                         ? 'bg-brand-900 text-white shadow-md shadow-brand-900/10'
                         : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900'
                     }`}
                   >
                     <item.icon className="w-5 h-5" />
                     {item.label}
                   </button>
                 ))}
               </nav>
               <div className="p-4 border-t border-brand-100">
                 <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 text-brand-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                   <LogOut className="w-5 h-5" />
                   Quitter l'admin
                 </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-brand-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-brand-600 hover:text-brand-900 bg-brand-50 rounded-lg">
               <Menu className="w-6 h-6" />
             </button>
             <div className="hidden sm:flex items-center bg-brand-50 border border-brand-100 rounded-xl px-3 py-1.5 w-64 md:w-80 transition-all focus-within:ring-2 focus-within:ring-brand-900/20 focus-within:border-brand-900 focus-within:bg-white relative">
               <Search className="w-4 h-4 text-brand-400" />
               <input 
                 type="text" 
                 placeholder="Aller à (ex: Commandes...)" 
                 className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full outline-none"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     const val = (e.currentTarget.value || '').toLowerCase();
                     if (val.includes('comman') || val.includes('cmd')) setActiveTab('orders');
                     else if (val.includes('prod') || val.includes('articl')) setActiveTab('products');
                     else if (val.includes('client') || val.includes('user')) setActiveTab('customers');
                     else if (val.includes('param') || val.includes('reglag')) setActiveTab('settings');
                     e.currentTarget.value = '';
                     e.currentTarget.blur();
                   }
                 }}
               />
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative">
              <div 
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }} 
                className="cursor-pointer hover:bg-brand-50 p-2 rounded-full transition-colors relative"
              >
                <Bell className="w-6 h-6 text-brand-700" />
                <span className="absolute top-1.5 right-1.5 bg-accent-500 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" />
              </div>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95, pointerEvents: 'none' }} 
                      transition={{ duration: 0.15 }}
                      className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-brand-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
                    >
                      <div className="p-4 border-b border-brand-50 flex justify-between items-center bg-brand-50/50">
                        <h3 className="font-bold text-brand-900 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-brand-500" />
                          Notifications
                        </h3>
                        <button className="text-xs font-medium text-brand-500 hover:text-brand-900 transition hover:underline">Tout marquer comme lu</button>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto divide-y divide-brand-50 custom-scrollbar">
                        {adminAlerts.map((alert, i) => (
                          <div key={alert.id} className="p-4 flex items-start gap-3 hover:bg-brand-50 transition cursor-pointer group">
                            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${alert.level === 'high' ? 'bg-red-100 text-red-600' : alert.level === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                              {alert.level === 'high' ? <AlertTriangle className="w-4 h-4"/> : <Bell className="w-4 h-4"/>}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-brand-900 mb-1 leading-snug group-hover:text-brand-700 transition">{alert.message}</p>
                              <span className="text-xs text-brand-400">Il y a quelques instants</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-brand-50 bg-brand-50/30 text-center">
                        <button className="text-sm font-medium text-brand-600 hover:text-brand-900 transition">Voir toutes les notifications</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <div 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }} 
                className="flex items-center gap-3 pl-4 border-l border-brand-100 group cursor-pointer"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-brand-900">{user?.displayName || 'Admin'}</span>
                  <span className="text-[10px] text-brand-500 font-medium">Administrateur</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-900 text-white font-bold flex items-center justify-center border-2 border-brand-50 overflow-hidden shadow-sm shadow-brand-900/20">
                  {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : user?.displayName?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <ChevronDown className="w-4 h-4 text-brand-400 group-hover:text-brand-900 transition" />
              </div>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95, pointerEvents: 'none' }}
                      transition={{ duration: 0.15 }}
                      className="origin-top-right absolute right-0 mt-2 w-56 bg-white border border-brand-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
                    >
                      <div className="p-4 border-b border-brand-50 sm:hidden">
                        <span className="block text-sm font-bold text-brand-900">{user?.displayName || 'Admin'}</span>
                        <span className="block text-xs text-brand-500 font-medium mt-0.5">{user?.email}</span>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }} 
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 hover:text-brand-900 rounded-xl flex items-center gap-3 transition"
                        >
                          <Settings className="w-4 h-4 text-brand-400" />
                          Paramètres du compte
                        </button>
                        <div className="h-px bg-brand-50 my-1 mx-2"></div>
                        <button 
                          onClick={onBack} 
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Quitter l'admin
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
           <div className="max-w-[1600px] mx-auto">
             {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ title, value, trend, isPositive, icon }: { title: string, value: string, trend: string, isPositive: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-100 flex flex-col relative overflow-hidden group hover:border-brand-900 transition-all duration-300">
      <div className="absolute -top-2 -right-2 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all pointer-events-none transform">
        {icon}
      </div>
      <span className="text-brand-500 text-sm font-medium mb-2">{title}</span>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-3xl font-bold text-brand-900 tracking-tight">{value}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-500'} bg-opacity-10 py-1 rounded-full`}>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-50'}`}>
           {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
           <span>{trend}</span>
        </div>
        <span className="text-brand-400 font-normal ml-0.5">vs période diff.</span>
      </div>
    </div>
  );
}
