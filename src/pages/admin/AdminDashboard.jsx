import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TrendingUp, ShoppingCart, 
  DollarSign, ClipboardList, Clock, 
  RefreshCw, Loader2, AlertCircle, 
  ArrowUpRight, ArrowDownRight,
  ChevronRight, Calendar, Package, Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, Area, 
  PieChart, Pie, Cell, 
  Tooltip, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { 
  fetchTodayStatistics, 
  fetchOverallStatistics, 
  fetchLastNDaysStatistics,
  fetchStatisticsByDateRange
} from '../../store/statistics/statisticsThunks';
import { fetchAllCommandes } from '../../store/admin/adminThunk';
import {
  selectTodayStats, selectOverallStats, selectLastNDays,
  selectStatisticsLoading, selectStatisticsError,
  selectDateRangeStats
} from '../../store/statistics/statisticsSelectors';
import { selectAllCommandes } from '../../store/admin/adminSelectors';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n, lang = 'fr') => (n ?? 0).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-MA');

const formatDate = (dateStr, lang = 'fr') => {
  if (!dateStr) return lang === 'ar' ? 'تاريخ غير معروف' : 'Date inconnue';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return lang === 'ar' ? 'تاريخ غير معروف' : 'Date inconnue';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: '2-digit',
    month: 'short'
  }) + ' ' + d.toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return null;
  const diff = ((current - previous) / previous) * 100;
  return Math.round(diff * 10) / 10;
};

const getClientPhone = (client) => {
  if (!client) return '—';
  if (client.phone) return client.phone;
  if (client.telephone) return client.telephone;
  if (Array.isArray(client.phones) && client.phones.length > 0) {
    return client.phones[0].phoneNumber || client.phones[0].phone || '—';
  }
  return '—';
};

const getClientDisplayName = (order) => {
  return order.client?.name || order.clientNom || 'Client #' + (order.client?.id || order.clientId || '?');
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, trendValue, colorClass }) {
  const isUp = trendValue > 0;
  const isDown = trendValue < 0;

  return (
    <div className="bg-surface rounded-3xl p-4 sm:p-5 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon size={20} className={`${colorClass.replace('bg-', 'text-')} sm:w-6 sm:h-6`} />
        </div>
        {trendValue !== null && (
          <div className={`flex items-center gap-0.5 sm:gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${isUp ? 'bg-green-500/10 text-green-600 dark:text-green-400' : isDown ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-gray-500/10 text-gray-600'}`}>
            {isUp ? '+' : ''}{trendValue}% 
            {isUp && <ArrowUpRight size={10} className="sm:w-3 sm:h-3" />}
            {isDown && <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />}
          </div>
        )}
      </div>
      <div className="text-start">
        <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{label}</p>
        <p className="text-lg sm:text-xl md:text-2xl font-black text-text-primary tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const todayStats = useSelector(selectTodayStats);
  const overall = useSelector(selectOverallStats);
  const lastNDays = useSelector(selectLastNDays);
  const dateRangeStats = useSelector(selectDateRangeStats);
  const loading = useSelector(selectStatisticsLoading);
  const error = useSelector(selectStatisticsError);
  
  const allCommandes = useSelector(selectAllCommandes);
  const recentOrders = useMemo(() => {
    return Array.isArray(allCommandes) ? [...allCommandes].sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)).slice(0, 8) : [];
  }, [allCommandes]);

  const [statutPeriod, setStatutPeriod] = useState('today');
  const [revenuPeriod, setRevenuPeriod] = useState('7j');
  const [yesterdayData, setYesterdayData] = useState(null);

  useEffect(() => {
    dispatch(fetchTodayStatistics());
    dispatch(fetchOverallStatistics());
    dispatch(fetchAllCommandes({ limit: 20 }));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    dispatch(fetchStatisticsByDateRange({ dateDebut: yStr, dateFin: yStr }))
      .unwrap()
      .then(data => setYesterdayData(data))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    const days = revenuPeriod === '7j' ? 7 : revenuPeriod === '30j' ? 30 : 365;
    dispatch(fetchLastNDaysStatistics(days));
  }, [dispatch, revenuPeriod]);

  const pieData = useMemo(() => {
    let sourceStats = statutPeriod === 'today' 
      ? {
          'EN_ATTENTE': todayStats?.commandesEnAttente || 0,
          'VALIDEE': todayStats?.commandesValidees || 0,
          'EN_TRAITEMENT': todayStats?.commandesEnTraitement || 0,
          'PRETE': todayStats?.commandesPretes || 0,
          'LIVREE': todayStats?.commandesLivrees || 0,
          'PAYEE': todayStats?.commandesPayees || 0,
        }
      : overall?.commandesByStatus || {};

    return Object.entries(sourceStats).map(([key, value]) => ({
      name: key.replace('_', ' '),
      value: value
    })).filter(item => item.value > 0);
  }, [statutPeriod, todayStats, overall]);

  const CHART_COLORS = ['#F97316', '#6366F1', '#14B8A6', '#8B5CF6', '#EC4899', '#FBBF24'];

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight uppercase">{t('admin.dashboard.title')}</h1>
          <p className="text-[10px] sm:text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">{t('admin.dashboard.overview_desc')}</p>
        </div>
        <button 
          onClick={() => {
            dispatch(fetchTodayStatistics());
            dispatch(fetchOverallStatistics());
            dispatch(fetchAllCommandes());
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-surface border border-border/50 text-text-primary rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={14} className={`${loading ? 'animate-spin' : ''} sm:w-4 sm:h-4`} />
          <span className="truncate">{t('admin.dashboard.last_data')}</span>
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <KpiCard 
          icon={ShoppingCart} 
          label={t('admin.dashboard.kpi.orders_today')} 
          value={fmt(todayStats?.totalCommandesToday, i18n.language)} 
          trendValue={calculateTrend(todayStats?.totalCommandesToday, yesterdayData?.totalCommandes)}
          colorClass="bg-blue-500"
        />
        <KpiCard 
          icon={DollarSign} 
          label={t('admin.dashboard.kpi.revenue_today')} 
          value={<>{fmt(todayStats?.revenuesToday, i18n.language)} <span className="text-[10px] sm:text-xs font-bold text-text-muted">DH</span></>} 
          trendValue={calculateTrend(todayStats?.revenuesToday, yesterdayData?.totalRevenues)}
          colorClass="bg-green-500"
        />
        <KpiCard 
          icon={Clock} 
          label={t('admin.dashboard.kpi.pending')} 
          value={fmt(todayStats?.commandesEnAttente, i18n.language)} 
          colorClass="bg-orange-500"
        />
        <KpiCard 
          icon={RefreshCw} 
          label={t('admin.dashboard.kpi.processing')} 
          value={fmt(todayStats?.commandesEnTraitement || 0, i18n.language)} 
          colorClass="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-start">
        {/* REVENUE CHART */}
        <div className="md:col-span-2 lg:col-span-2 bg-surface rounded-[2rem] p-5 sm:p-6 md:p-8 shadow-card border border-border/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="text-start">
              <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.dashboard.revenue_evolution')}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('admin.dashboard.period_total')}</p>
                  <p className="text-xl font-black text-primary-600">
                    {fmt(lastNDays?.reduce((acc, curr) => acc + (curr.revenusTotal || 0), 0), i18n.language)} <span className="text-xs">DH</span>
                  </p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('admin.dashboard.daily_average')}</p>
                  <p className="text-sm font-bold text-text-primary">
                    {fmt(Math.round((lastNDays?.reduce((acc, curr) => acc + (curr.revenusTotal || 0), 0) || 0) / (lastNDays?.length || 1)), i18n.language)} DH
                  </p>
                </div>
              </div>
            </div>
            <div className="flex bg-background p-1 rounded-2xl border border-border/50">
              {['7j', '30j', '1an'].map(p => (
                <button 
                  key={p}
                  onClick={() => setRevenuPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${revenuPeriod === p ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastNDays || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="currentColor" className="text-border/30" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: 'var(--text-muted)'}}
                  dy={10}
                  tickFormatter={(str) => {
                    const d = new Date(str);
                    if (isNaN(d.getTime())) return '';
                    return revenuPeriod === '1an' 
                      ? d.toLocaleDateString('fr-FR', { month: 'short' })
                      : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: 'var(--text-muted)'}}
                  tickFormatter={(val) => val > 0 ? `${val} DH` : ''}
                />
                <Tooltip 
                  cursor={{ stroke: '#F97316', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                  labelStyle={{ fontWeight: '900', fontSize: '10px', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '800', color: '#F97316' }}
                  formatter={(value) => [`${fmt(value, i18n.language)} DH`, 'Revenu']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenusTotal" 
                  stroke="#F97316" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#F97316' }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STATUS PIE CHART */}
        <div className="bg-surface rounded-[2rem] p-6 md:p-8 shadow-card border border-border/50">
          <div className="mb-8">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.dashboard.order_status')}</h3>
            <div className="flex bg-background p-1 rounded-2xl border border-border/50 mt-4">
              <button 
                onClick={() => setStatutPeriod('today')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statutPeriod === 'today' ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted'}`}
              >
                {t('admin.dashboard.periods.today')}
              </button>
              <button 
                onClick={() => setStatutPeriod('all')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statutPeriod === 'all' ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted'}`}
              >
                {t('admin.dashboard.global')}
              </button>
            </div>
          </div>
          
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-text-primary leading-none">
                {pieData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1">{t('admin.dashboard.total')}</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border/50 flex items-center justify-between">
          <div className="text-start">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.dashboard.recent_orders')}</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{t('admin.dashboard.activity_flow')}</p>
          </div>
          <button 
            onClick={() => navigate('/admin/commandes')}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-background border border-border/50 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface hover:shadow-sm transition-all"
          >
            {t('admin.dashboard.see_all')} <ChevronRight size={14} className="rtl:rotate-180" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-background/50">
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.order')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.client')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.timestamp')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.amount')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">{t('admin.dashboard.table.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-background/40 transition-all cursor-pointer group" onClick={() => navigate(`/admin/commandes/${order.id}`)}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4 text-start">
                      <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary-500 font-black text-xs shadow-sm">
                        #{order.numeroCommande.slice(-3)}
                      </div>
                      <span className="text-sm font-black text-text-primary tracking-tight">#{order.numeroCommande}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 text-start">
                      <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center text-[10px] font-black border border-primary-500/20">
                        {(order.client?.name || order.clientNom || 'C')[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-text-primary truncate max-w-[120px]">{getClientDisplayName(order)}</span>
                        <span className="text-[9px] text-text-muted font-bold truncate">{getClientPhone(order.client)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-start">
                      <p className="text-xs font-bold text-text-primary">{formatDate(order.dateCreation, i18n.language).split(' ')[0]}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">{formatDate(order.dateCreation, i18n.language).split(' ')[1]}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-start">
                    <span className="text-sm font-black text-primary-600">{fmt(order.montantTotal, i18n.language)} DH</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center"><StatusBadge status={order.status} /></div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Loader2 size={32} className="animate-spin mb-4" />
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.dashboard.syncing')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
