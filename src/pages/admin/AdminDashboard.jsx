import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TrendingUp, Search, Bell, ShoppingCart, 
  DollarSign, ClipboardList, Clock, 
  RefreshCw, Loader2, AlertCircle, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  ChevronRight, Calendar, Package, MapPin
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
  fetchStatisticsByDateRange,
  fetchDailyStatistics
} from '../../store/statistics/statisticsThunks';
import { fetchAllCommandes } from '../../store/admin/adminThunk';
import {
  selectTodayStats, selectOverallStats, selectLastNDays,
  selectStatisticsLoading, selectStatisticsError,
  selectDateRangeStats, selectDailyStats
} from '../../store/statistics/statisticsSelectors';
import { selectAllCommandes } from '../../store/admin/adminSelectors';
import { selectCurrentUser } from '../../store/auth/authSelector';
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
    month: 'short',
    year: 'numeric'
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, trendValue, bgColorClass, iconColorClass }) {
  const isUp = trendValue > 0;
  const isDown = trendValue < 0;

  return (
    <div className="bg-white md:bg-surface rounded-2xl p-4 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50 group">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${bgColorClass} rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon size={20} className={iconColorClass} />
        </div>
        {trendValue !== null && trendValue !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs md:text-[10px] md:font-bold ${isUp ? 'text-green-500 md:bg-green-50 md:text-green-600' : isDown ? 'text-red-500 md:bg-red-50 md:text-red-600' : 'text-gray-500 md:bg-gray-50 md:text-gray-600'}`}>
            {Math.abs(trendValue)}% 
            {isUp && <ArrowUpRight size={12} />}
            {isDown && <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs md:font-bold text-text-muted md:uppercase md:tracking-wider mb-1">{label}</h3>
        <p className="text-xl md:text-2xl font-bold md:font-black text-text-primary tracking-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  
  // Stats selectors
  const todayStats = useSelector(selectTodayStats);
  const overall = useSelector(selectOverallStats);
  const lastNDays = useSelector(selectLastNDays);
  const dateRangeStats = useSelector(selectDateRangeStats);
  const dailyStats = useSelector(selectDailyStats);
  const loading = useSelector(selectStatisticsLoading);
  const error = useSelector(selectStatisticsError);
  
  // Admin selectors for recent orders
  const allCommandes = useSelector(selectAllCommandes);
  const recentOrders = useMemo(() => {
    return Array.isArray(allCommandes) ? [...allCommandes].sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)).slice(0, 10) : [];
  }, [allCommandes]);

  // Statut chart states
  const [statutPeriod, setStatutPeriod] = useState('today');
  const [statutDateRange, setStatutDateRange] = useState({ debut: '', fin: '' });
  const [showStatutDatePicker, setShowStatutDatePicker] = useState(false);

  // Revenu chart states
  const [revenuPeriod, setRevenuPeriod] = useState('7j');
  const [revenuDateRange, setRevenuDateRange] = useState({ debut: '', fin: '' });
  const [showRevenuDatePicker, setShowRevenuDatePicker] = useState(false);

  // Yesterday stats for trends
  const [yesterdayData, setYesterdayData] = useState(null);

  useEffect(() => {
    dispatch(fetchTodayStatistics());
    dispatch(fetchOverallStatistics());
    dispatch(fetchAllCommandes({ limit: 20 }));

    // Fetch yesterday stats for trends
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    dispatch(fetchStatisticsByDateRange({ dateDebut: yStr, dateFin: yStr }))
      .unwrap()
      .then(data => setYesterdayData(data))
      .catch(() => setYesterdayData(null));
  }, [dispatch]);

  // Chart data dependency update
  useEffect(() => {
    if (revenuPeriod === '7j') dispatch(fetchLastNDaysStatistics(7));
    else if (revenuPeriod === '30j') dispatch(fetchLastNDaysStatistics(30));
    else if (revenuPeriod === '1an') dispatch(fetchLastNDaysStatistics(365));
  }, [dispatch, revenuPeriod]);

  // Handle Statut Period changes
  useEffect(() => {
    const end = new Date();
    if (statutPeriod === '7days') {
      const start = new Date();
      start.setDate(end.getDate() - 7);
      dispatch(fetchStatisticsByDateRange({ 
        dateDebut: start.toISOString().split('T')[0], 
        dateFin: end.toISOString().split('T')[0] 
      }));
    } else if (statutPeriod === '30days') {
      const start = new Date();
      start.setDate(end.getDate() - 30);
      dispatch(fetchStatisticsByDateRange({ 
        dateDebut: start.toISOString().split('T')[0], 
        dateFin: end.toISOString().split('T')[0] 
      }));
    }
  }, [dispatch, statutPeriod]);

  const initials = (name) => {
    if (!name || name === 'Client #?') return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getClientDisplayName = (order) => {
    const name = order.client?.name || order.clientNom || order.client?.nom || order.nomClient || order.livreur?.client?.nom;
    if (name) return name;
    return `Client #${order.clientId || order.client?.id || '?'}`;
  };

  // Pie chart data preparation
  const pieData = useMemo(() => {
    let sourceStats = {};

    if (statutPeriod === 'today') {
      // getTodayStatistics does not return commandesByStatus map directly, so we reconstruct it
      sourceStats = {
        'EN_ATTENTE': todayStats?.commandesEnAttente || 0,
        'VALIDEE': todayStats?.commandesValidees || 0,
        'EN_TRAITEMENT': todayStats?.commandesEnTraitement || 0,
        'PRETE': todayStats?.commandesPretes || 0,
        'LIVREE': todayStats?.commandesLivrees || 0,
        'PAYEE': todayStats?.commandesPayees || 0,
        'ANNULEE': 0
      };
    } else if (statutPeriod === 'range' || statutPeriod === '7days' || statutPeriod === '30days') {
      // Use dateRangeStats for 7days and 30days since fetchStatisticsByDateRange fetches status breakdown
      sourceStats = dateRangeStats?.commandesByStatus || {};
    } else {
      sourceStats = overall?.commandesByStatus || {};
    }

    // Normalize keys
    const stats = {};
    Object.entries(sourceStats).forEach(([k, v]) => {
      stats[k.toUpperCase()] = v;
    });

    const completed = (stats['PAYEE'] || 0) + (stats['LIVREE'] || 0);
    const inProgress = (stats['EN_TRAITEMENT'] || 0) + (stats['VALIDEE'] || 0) + (stats['PRETE'] || 0) + (stats['EN_ATTENTE'] || 0);
    const cancelled = (stats['ANNULEE'] || 0);

    const fullBreakdown = Object.entries(stats).map(([key, value]) => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: value
    })).filter(item => item.value > 0);
    
    return {
      mobile: [
        { name: t('admin.dashboard.status_groups.completed'), value: completed, color: '#F97316' },
        { name: t('admin.dashboard.status_groups.in_progress'), value: inProgress, color: '#6366F1' },
        { name: t('admin.dashboard.status_groups.cancelled'), value: cancelled, color: '#EF4444' }
      ].filter(item => item.value > 0),
      desktop: fullBreakdown
    };
  }, [statutPeriod, todayStats, dateRangeStats, lastNDays, overall]);

  const COLORS = ['#F97316', '#6366F1', '#14B8A6', '#8B5CF6', '#EC4899', '#FBBF24', '#EF4444'];
  
  const totalPie = useMemo(() => {
    return (window.innerWidth < 768 ? pieData.mobile : pieData.desktop).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [pieData]);

  // Revenue chart grouping for 1 year
  const groupByMonth = (data) => {
    const months = {};
    data.forEach(d => {
      const dateObj = new Date(d.date);
      const monthLabel = dateObj.toLocaleDateString('fr-FR', { 
        month: 'short', year: '2-digit' 
      });
      if (!months[monthLabel]) {
        months[monthLabel] = { 
          date: monthLabel, 
          revenusTotal: 0, 
          nombreCommandes: 0 
        };
      }
      months[monthLabel].revenusTotal += d.revenusTotal || 0;
      months[monthLabel].nombreCommandes += d.nombreCommandes || 0;
    });
    return Object.values(months);
  };

  const chartData = useMemo(() => {
    if (revenuPeriod === '1an') return groupByMonth(lastNDays || []);
    return lastNDays || [];
  }, [lastNDays, revenuPeriod]);

  const handleApplyStatutRange = () => {
    if (statutDateRange.debut && statutDateRange.fin) {
      dispatch(fetchStatisticsByDateRange({ 
        dateDebut: statutDateRange.debut, 
        dateFin: statutDateRange.fin 
      }));
      setStatutPeriod('range');
    }
  };

  const handleApplyRevenuRange = () => {
    if (revenuDateRange.debut && revenuDateRange.fin) {
      dispatch(fetchStatisticsByDateRange({ 
        dateDebut: revenuDateRange.debut, 
        dateFin: revenuDateRange.fin 
      }));
      setRevenuPeriod('range');
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 pb-20 md:pb-12 animate-fade-in md:mt-0">

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 animate-slide-up mx-2 md:mx-0">
          <AlertCircle size={20} />
          <p className="text-sm font-semibold">{typeof error === 'string' ? error : t('common.error')}</p>
        </div>
      )}

      {/* DASHBOARD HEADER (Desktop Only) */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
        <div className="relative z-10 text-start">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{t('admin.dashboard.performance')}</h2>
          <p className="text-primary-100 text-sm font-medium opacity-90 max-w-md">
            {t('admin.dashboard.overview_desc')}
          </p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button 
            onClick={() => {
              dispatch(fetchTodayStatistics());
              dispatch(fetchOverallStatistics());
              dispatch(fetchAllCommandes({ limit: 20 }));
            }}
            className="px-4 py-2.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold hover:bg-white/25 transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {t('admin.dashboard.last_data')}
          </button>
        </div>
        <div className="absolute -end-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 px-2 md:px-0">
        <KpiCard 
          icon={ShoppingCart} 
          label={t('admin.dashboard.kpi.orders_today')} 
          value={fmt(todayStats?.totalCommandesToday, i18n.language)} 
          trendValue={calculateTrend(todayStats?.totalCommandesToday, yesterdayData?.totalCommandes)}
          bgColorClass="bg-blue-50"
          iconColorClass="text-blue-500"
        />
        <KpiCard 
          icon={DollarSign} 
          label={t('admin.dashboard.kpi.revenue_today')} 
          value={<>{fmt(todayStats?.revenuesToday, i18n.language)} <span className="text-xs md:text-sm font-normal text-text-muted font-normal">DH</span></>} 
          trendValue={calculateTrend(todayStats?.revenuesToday, yesterdayData?.totalRevenues)}
          bgColorClass="bg-green-50"
          iconColorClass="text-green-500"
        />
        <KpiCard 
          icon={Clock} 
          label={t('admin.dashboard.kpi.pending')} 
          value={fmt(todayStats?.commandesEnAttente, i18n.language)} 
          bgColorClass="bg-orange-50"
          iconColorClass="text-orange-500"
        />
        <KpiCard 
          icon={RefreshCw} 
          label={t('admin.dashboard.kpi.processing')} 
          value={fmt(todayStats?.commandesEnTraitement || 0, i18n.language)} 
          bgColorClass="bg-purple-50"
          iconColorClass="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 px-2 md:px-0">
        {/* REVENUE CHART CARD */}
        <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-card border border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
            <div className="text-start">
              <h3 className="text-base md:text-lg font-bold text-text-primary">{t('admin.dashboard.revenue_evolution')}</h3>
              <p className="text-xs text-text-muted mt-0.5">{t('admin.dashboard.period_perf')}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex bg-gray-100 p-1 rounded-xl flex-wrap gap-1">
                {[
                  { id: '7j', label: t('admin.dashboard.periods.7d') },
                  { id: '30j', label: t('admin.dashboard.periods.30d') },
                  { id: '1an', label: t('admin.dashboard.periods.1y') },
                  { id: 'Période', label: t('admin.dashboard.periods.custom') }
                ].map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                        setRevenuPeriod(p.id);
                        if(p.id !== 'Période') setShowRevenuDatePicker(false);
                        else setShowRevenuDatePicker(true);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${revenuPeriod === p.id ? 'bg-white shadow-sm text-primary-600' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {showRevenuDatePicker && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="date" 
                    className="border border-border rounded-xl px-2 py-1 text-[10px] font-bold outline-none focus:border-primary-500"
                    value={revenuDateRange.debut}
                    onChange={(e) => setRevenuDateRange({...revenuDateRange, debut: e.target.value})}
                  />
                  <input 
                    type="date" 
                    className="border border-border rounded-xl px-2 py-1 text-[10px] font-bold outline-none focus:border-primary-500"
                    value={revenuDateRange.fin}
                    onChange={(e) => setRevenuDateRange({...revenuDateRange, fin: e.target.value})}
                  />
                  <button 
                    onClick={handleApplyRevenuRange}
                    className="bg-primary-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="h-48 md:h-80 w-full mt-3 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9CA3AF'}}
                  tickFormatter={(str) => {
                    if (revenuPeriod === '1an') return str;
                    const d = new Date(str);
                    if (isNaN(d.getTime())) return '';
                    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9CA3AF'}}
                  tickFormatter={(val) => `${val} DH`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: '900', fontSize: '12px', color: '#1E293B', marginBottom: '4px', textTransform: 'uppercase' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '700' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenusTotal" 
                  stroke="#F97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  name="Revenus (DH)"
                />
                <Area 
                  type="monotone" 
                  dataKey="nombreCommandes" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fill="transparent"
                  name="Commandes"
                  className={revenuPeriod === '1an' ? '' : 'hidden md:block'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DONUT CHART CARD */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-card border border-border/50 flex flex-col">
          <div className="mb-6 text-start">
            <h3 className="text-base md:text-lg font-bold text-text-primary mb-3">{t('admin.dashboard.order_status')}</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
               {[
                 { id: 'today', label: t('admin.dashboard.periods.today') || "Aujourd'hui" },
                 { id: '7days', label: t('admin.dashboard.periods.7d') },
                 { id: '30days', label: t('admin.dashboard.periods.30d') },
                 { id: 'range', label: t('admin.dashboard.periods.custom') }
               ].map(p => (
                 <button 
                   key={p.id}
                   onClick={() => {
                     setStatutPeriod(p.id);
                     if(p.id === 'range') setShowStatutDatePicker(true);
                     else setShowStatutDatePicker(false);
                   }}
                   className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statutPeriod === p.id ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-white text-text-muted border-border hover:border-primary-300'}`}
                 >
                   {p.label}
                 </button>
               ))}
            </div>
            {showStatutDatePicker && (
               <div className="flex items-center gap-2 mt-3 animate-slide-up">
                 <input 
                   type="date" 
                   value={statutDateRange.debut}
                   onChange={(e) => setStatutDateRange({...statutDateRange, debut: e.target.value})}
                   className="flex-1 border border-border rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus:border-primary-500"
                 />
                 <input 
                   type="date" 
                   value={statutDateRange.fin}
                   onChange={(e) => setStatutDateRange({...statutDateRange, fin: e.target.value})}
                   className="flex-1 border border-border rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus:border-primary-500"
                 />
                 <button 
                   onClick={handleApplyStatutRange}
                   className="bg-primary-500 text-white p-2 rounded-xl"
                 >
                   <RefreshCw size={14} />
                 </button>
               </div>
            )}
          </div>
          
          <div className="h-48 md:h-64 relative flex items-center justify-center min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={176}>
              <PieChart>
                <Pie
                  data={window.innerWidth < 768 ? pieData.mobile : pieData.desktop}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 768 ? 60 : 75}
                  outerRadius={window.innerWidth < 768 ? 85 : 100}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={800}
                >
                  {(window.innerWidth < 768 ? pieData.mobile : pieData.desktop).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
              </PieChart>
            </ResponsiveContainer>
            {/* Pie Chart Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-text-primary leading-none">{totalPie}</span>
              <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1.5">{t('common.total') || 'TOTAL'}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {(window.innerWidth < 768 ? pieData.mobile : pieData.desktop).map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{entry.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-text-primary">
                    {entry.value}
                  </span>
                  <span className="text-[10px] text-text-muted font-bold ms-1 px-1.5 py-0.5 bg-gray-50 rounded-md">
                    {totalPie > 0 ? Math.round((entry.value / totalPie) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS CARD */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-card border border-border/50 overflow-hidden mx-2 md:mx-0">
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between bg-gray-50/30">
          <div className="text-start">
            <h3 className="text-base md:text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.dashboard.recent_orders')}</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{t('admin.dashboard.activity_flow')}</p>
          </div>
          <button 
            onClick={() => navigate('/admin/commandes')}
            className="px-4 py-2 text-[10px] font-black text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-widest border border-primary-100 rounded-xl bg-white shadow-sm active:scale-95"
          >
            {t('admin.dashboard.see_all')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead className="bg-gray-50/50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.client')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.details')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.timestamp')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.dashboard.table.amount')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">{t('admin.dashboard.table.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentOrders.length > 0 ? recentOrders.map((order) => {
                const clientName = getClientDisplayName(order);
                const orderDate = formatDate(order.dateDernierStatut || order.updatedAt || order.dateCreation || order.createdAt, i18n.language);
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50/30 transition-all group cursor-pointer" onClick={() => navigate(`/admin/commandes/${order.id}`)}>
                    <td className="px-4 py-4 md:px-6 md:py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-black shadow-inner shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                          {initials(clientName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-text-primary tracking-tight truncate">{clientName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] text-text-muted font-bold">#{order.numeroCommande}</span>
                             <span className="md:hidden">
                                <StatusBadge status={order.status} size="sm" />
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                         <Package size={14} className="text-text-muted" />
                         <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">
                           {order.commandeTapis?.reduce((sum, item) => sum + (item.quantite || 1), 0) || 0} {t('admin.dashboard.carpets')}
                         </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 text-end md:text-start">
                       <div className="flex flex-col">
                          <span className="text-[11px] md:text-xs font-black text-text-primary">
                             {orderDate.split(' ')[0]}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-text-muted font-bold opacity-60 uppercase tracking-widest mt-0.5">
                             {orderDate.split(' ')[1]}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="bg-gray-50 rounded-xl px-3 py-1.5 inline-block">
                        <p className="text-sm font-black text-text-primary">{fmt(order.montantTotal, i18n.language)} <span className="text-[10px] text-text-muted">DH</span></p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center hidden md:table-cell">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Loader2 size={32} className="animate-spin text-primary-300" />
                      </div>
                      <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{t('admin.dashboard.syncing')}</p>
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

