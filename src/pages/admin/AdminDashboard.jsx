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

function KpiCard({ icon: Icon, label, value, trendValue, type }) {
  const isUp = trendValue > 0;
  const isDown = trendValue < 0;

  const getAccentColor = () => {
    switch (type) {
      case 'commandes': return '#0D7377';
      case 'revenus': return '#C9A84C';
      case 'attente': return '#F59E0B';
      case 'traitement': return '#3B82F6';
      default: return '#0D7377';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'commandes': return 'rgba(13,115,119,0.1)';
      case 'revenus': return 'rgba(201,168,76,0.1)';
      case 'attente': return 'rgba(245,158,11,0.1)';
      case 'traitement': return 'rgba(59,130,246,0.1)';
      default: return 'rgba(13,115,119,0.1)';
    }
  };

  return (
    <div className="bg-white rounded-[16px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] p-4 relative overflow-hidden text-start">
      <div 
        className="absolute top-0 left-0 right-0 h-[3px]" 
        style={{ backgroundColor: getAccentColor() }}
      />
      
      <div className="flex justify-between items-start">
        <div 
          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
          style={{ backgroundColor: getBgColor() }}
        >
          <Icon size={20} style={{ color: getAccentColor() }} />
        </div>

        {trendValue !== null && (
          <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            isUp ? 'bg-[#ECFDF5] text-[#10B981]' : isDown ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-gray-100 text-gray-500'
          }`}>
            {isUp ? '+' : ''}{trendValue}%
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">
          {label}
        </p>
        <p className="font-['Plus_Jakarta_Sans'] text-[28px] font-bold text-[var(--text)] tracking-[-0.02em] mt-1 leading-none truncate">
          {value}
        </p>
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

  const CHART_COLORS = ['#0D7377', '#C9A84C', '#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

  return (
    <div className="pb-12 animate-fade-in text-start">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-[-0.02em]">
            {t('admin.dashboard.title')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('admin.dashboard.overview_desc')}
          </p>
        </div>
        
        <button 
          onClick={() => {
            dispatch(fetchTodayStatistics());
            dispatch(fetchOverallStatistics());
            dispatch(fetchAllCommandes());
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-[10px] bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] shadow-[var(--shadow-sm)] text-[13px] font-medium text-[var(--text-secondary)] active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-[var(--primary)]`} />
          {t('admin.dashboard.last_data')}
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard 
          icon={ShoppingCart} 
          label={t('admin.dashboard.kpi.orders_today')} 
          value={fmt(todayStats?.totalCommandesToday, i18n.language)} 
          trendValue={calculateTrend(todayStats?.totalCommandesToday, yesterdayData?.totalCommandes)}
          type="commandes"
        />
        <KpiCard 
          icon={DollarSign} 
          label={t('admin.dashboard.kpi.revenue_today')} 
          value={<>{fmt(todayStats?.revenuesToday, i18n.language)} <span className="text-[12px] font-bold text-[var(--text-muted)]">DH</span></>} 
          trendValue={calculateTrend(todayStats?.revenuesToday, yesterdayData?.totalRevenues)}
          type="revenus"
        />
        <KpiCard 
          icon={Clock} 
          label={t('admin.dashboard.kpi.pending')} 
          value={fmt(todayStats?.commandesEnAttente, i18n.language)} 
          type="attente"
        />
        <KpiCard 
          icon={RefreshCw} 
          label={t('admin.dashboard.kpi.processing')} 
          value={fmt(todayStats?.commandesEnTraitement || 0, i18n.language)} 
          type="traitement"
        />
      </div>

      <div className="flex flex-col gap-6 text-start">
        {/* REVENUE CHART */}
        <div className="bg-white rounded-[16px] p-5 shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)]">
                  {t('admin.dashboard.revenue_evolution')}
                </h3>
                <div className="mt-4 flex flex-col gap-1">
                  <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">
                    {t('admin.dashboard.period_total')}
                  </p>
                  <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--primary)] leading-none">
                    {fmt(lastNDays?.reduce((acc, curr) => acc + (curr.revenusTotal || 0), 0), i18n.language)} <span className="text-sm">DH</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-[var(--bg)] p-1 rounded-[10px] flex gap-1">
                {['7j', '30j', '1an'].map(p => (
                  <button 
                    key={p}
                    onClick={() => setRevenuPeriod(p)}
                    className={`px-3 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                      revenuPeriod === p 
                        ? 'bg-white text-[var(--primary)] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]' 
                        : 'text-[var(--text-muted)] font-medium'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">
                  {t('admin.dashboard.daily_average')}
                </p>
                <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-semibold text-[var(--text)]">
                  {fmt(Math.round((lastNDays?.reduce((acc, curr) => acc + (curr.revenusTotal || 0), 0) || 0) / (lastNDays?.length || 1)), i18n.language)} <span className="text-xs">DH</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lastNDays || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fontWeight: 500, fill: 'var(--text-muted)', fontFamily: 'Inter'}}
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
                  tick={{fontSize: 11, fontWeight: 500, fill: 'var(--text-muted)', fontFamily: 'Inter'}}
                  tickFormatter={(val) => val > 0 ? `${val}` : ''}
                />
                <Tooltip 
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--primary)', boxShadow: 'var(--shadow-md)', padding: '12px' }}
                  labelStyle={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', fontFamily: 'Inter' }}
                  formatter={(value) => [`${fmt(value, i18n.language)} DH`, 'Revenu']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenusTotal" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--primary)' }}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STATUS PIE CHART */}
        <div className="bg-white rounded-[16px] p-5 shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)]">
          <div className="mb-6">
            <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)]">
              {t('admin.dashboard.order_status')}
            </h3>
            <div className="flex bg-[var(--bg)] p-1 rounded-[10px] mt-4">
              <button 
                onClick={() => setStatutPeriod('today')}
                className={`flex-1 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                  statutPeriod === 'today' 
                    ? 'bg-white text-[var(--primary)] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]' 
                    : 'text-[var(--text-muted)] font-medium'
                }`}
              >
                {t('admin.dashboard.periods.today')}
              </button>
              <button 
                onClick={() => setStatutPeriod('all')}
                className={`flex-1 py-1.5 rounded-[8px] text-[13px] transition-all duration-200 ${
                  statutPeriod === 'all' 
                    ? 'bg-white text-[var(--primary)] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]' 
                    : 'text-[var(--text-muted)] font-medium'
                }`}
              >
                {t('admin.dashboard.global')}
              </button>
            </div>
          </div>
          
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                 />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] leading-none">
                {pieData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="font-['Inter'] text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-[0.06em] mt-1">
                {t('admin.dashboard.total')}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="font-['Inter'] text-[11px] font-medium text-[var(--text-secondary)] truncate max-w-[80px]">{entry.name}</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-[var(--text)]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded-[16px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] overflow-hidden mt-6">
        <div className="p-5 flex items-center justify-between">
          <div className="text-start">
            <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)]">{t('admin.dashboard.recent_orders')}</h3>
          </div>
          <button 
            onClick={() => navigate('/admin/commandes')}
            className="text-[13px] font-bold text-[var(--primary)]"
          >
            {t('admin.dashboard.see_all')}
          </button>
        </div>
        
        {/* MOBILE CARDS (Hidden on desktop if needed, but this app is mobile-first) */}
        <div className="divide-y divide-[rgba(0,0,0,0.06)]">
          {recentOrders.length > 0 ? recentOrders.map((order) => (
            <div key={order.id} onClick={() => navigate(`/admin/commandes/${order.id}`)} className="p-4 flex flex-col gap-3 active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex justify-between items-center">
                <span className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  #{order.numeroCommande}
                </span>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-surface)] text-[var(--primary)] flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-sm">
                  {(order.client?.name || order.clientNom || 'C')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] truncate">
                    {getClientDisplayName(order)}
                  </p>
                  <p className="font-['Inter'] text-[12px] text-[var(--text-muted)]">
                    {formatDate(order.dateCreation, i18n.language)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--primary)]">
                    {fmt(order.montantTotal, i18n.language)} <span className="text-[10px]">DH</span>
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center opacity-40">
              <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[var(--primary)]" />
              <p className="text-[11px] font-bold uppercase tracking-wider">{t('admin.dashboard.syncing')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
