import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Archive, 
  RotateCcw, 
  Navigation2, 
  LayoutDashboard,
  MapPin,
  Hash,
  Phone,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  fetchLivreurDashboardStats, 
  fetchReadyOrders, 
  fetchReadyForDelivery 
} from '../../store/livreur/livreurThunk';
import { 
  selectDashboardStats, 
  selectReadyOrders, 
  selectReadyForDelivery,
  selectLoading 
} from '../../store/livreur/livreurSelectors';

const StatCard = ({ label, count, icon: Icon, colorClass, iconBgClass, iconColorClass, barColorClass, t, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full bg-surface rounded-[2rem] shadow-card p-5 border border-border/50 transition-all hover:shadow-card-hover active:scale-95 text-start group relative overflow-hidden`}
  >
    <div className={`absolute top-0 start-0 w-1 h-full ${barColorClass}`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass} transition-transform group-hover:scale-110`}>
        <Icon className={iconColorClass} size={20} />
      </div>
      <span className="text-2xl font-black text-text-primary tracking-tight">{count}</span>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] leading-tight truncate">
        {label}
      </span>
      <p className={`text-[8px] font-bold uppercase tracking-wider ${iconColorClass} opacity-80`}>
        {label === t('driver.dashboard.stats.ready_delivery') ? t('driver.dashboard.stats.deliveries') : label === t('driver.dashboard.stats.collect_workshop') ? t('driver.dashboard.stats.collections') : t('driver.dashboard.stats.to_return')}
      </p>
    </div>
  </button>
);

const getClientDisplayName = (mission, t) => {
  return mission.client?.name || mission.clientNom || mission.client?.nom || t('admin.dashboard.external_client');
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

const getInitials = (name, t) => {
  if (!name || name === t('admin.dashboard.external_client')) return 'C';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const MissionTableRow = ({ mission, onNavigate, t }) => {
  const isDelivery = mission.status === 'livree';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName, t);

  return (
    <tr className="border-b border-border/40 last:border-0 hover:bg-background/40 transition-colors group">
      <td className="px-8 py-5 text-start">
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-primary-500" />
          <span className="text-sm font-black text-text-primary tracking-tight">#{mission.numeroCommande}</span>
        </div>
      </td>
      <td className="px-8 py-5 text-start">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-background text-primary-600 font-black text-xs flex items-center justify-center shrink-0 border border-border shadow-sm">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-text-primary truncate tracking-tight">{displayName}</span>
            <span className="text-[10px] text-text-muted truncate font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <MapPin size={10} /> {mission.client?.addresses?.[0]?.fullAddress || mission.client?.address || '—'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 text-start">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
          ${isDelivery 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
            : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-500/20'}`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.collect')}
        </span>
      </td>
      <td className="px-8 py-5 text-end">
        <button 
          onClick={() => onNavigate(mission.id)}
          className="w-10 h-10 rounded-xl bg-background text-text-muted flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-sm active:scale-90"
        >
          <ChevronRight size={18} className="rtl:rotate-180" strokeWidth={3} />
        </button>
      </td>
    </tr>
  );
};

const MissionMobileCard = ({ mission, onNavigate, t }) => {
  const isDelivery = mission.status === 'livree';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName, t);

  return (
    <div 
      onClick={() => onNavigate(mission.id)}
      className="bg-surface rounded-3xl shadow-card p-5 border border-border/50 active:scale-[0.98] transition-all text-start group relative overflow-hidden"
    >
      <div className={`absolute top-0 start-0 w-1.5 h-full ${isDelivery ? 'bg-emerald-500' : 'bg-primary-500'}`} />
      
      <div className="flex justify-between items-start mb-5 ps-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1 opacity-60">
            <Hash size={12} className="text-primary-500" />
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('workshop.detail.labels.order')}</span>
          </div>
          <span className="text-lg font-black text-text-primary tracking-tighter">#{mission.numeroCommande}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border
          ${isDelivery 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-primary-50 text-primary-600 border-primary-100'}`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.collect')}
        </span>
      </div>

      <div className="flex items-center gap-4 bg-background/40 p-4 rounded-2xl mb-4 border border-border/40">
        <div className="w-12 h-12 rounded-xl bg-surface text-primary-600 font-black text-sm flex items-center justify-center shadow-sm border border-primary-500/10 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-text-primary truncate tracking-tight">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={12} className="text-text-muted shrink-0" />
            <p className="text-[10px] text-text-muted truncate font-bold uppercase tracking-tight">{mission.client?.addresses?.[0]?.address || '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between ps-2">
        <div className="flex items-center gap-2">
           <Phone size={12} className="text-primary-500" />
           <span className="text-[10px] font-black text-text-primary">{getClientPhone(mission.client)}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-primary-600 uppercase tracking-widest">
           {t('common.details')} <ChevronRight size={14} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

const NextMissionSpotlight = ({ mission, onNavigate, t }) => {
  if (!mission) return null;
  const isDelivery = mission.status === 'livree';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName, t);

  return (
    <div className="bg-primary-600 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl shadow-primary-500/30 overflow-hidden relative mb-10 animate-in zoom-in-95 duration-500 text-start group">
      <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Truck size={200} strokeWidth={1} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-sm">
            {t('driver.dashboard.missions.next_mission')}
          </span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{animationDelay: '0ms'}}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{animationDelay: '150ms'}}></span>
          </div>
        </div>
        
        <div className="flex items-center gap-5 sm:gap-6 mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white text-primary-600 font-black text-xl sm:text-2xl flex items-center justify-center shadow-xl border-4 border-white/20 shrink-0 uppercase">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <Hash size={14} className="opacity-60" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('workshop.detail.labels.order')} #{mission.numeroCommande}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight truncate leading-tight">{displayName}</h3>
            <p className="text-primary-100 text-xs sm:text-sm font-bold flex items-center gap-2 mt-1 opacity-90 truncate uppercase tracking-tight">
              <MapPin size={14} strokeWidth={3} /> {mission.client?.addresses?.[0]?.address || '—'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate(mission.id)}
          className="w-full bg-white text-primary-600 font-black py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] hover:bg-primary-50 shadow-xl text-[11px] uppercase tracking-[0.15em] group/btn"
        >
          <Navigation2 size={20} strokeWidth={3} fill="currentColor" className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform rtl:rotate-180" />
          {isDelivery ? t('driver.dashboard.missions.start_delivery') : t('driver.dashboard.missions.start_collect')}
        </button>
      </div>
    </div>
  );
};

export default function LivreurDashboard() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const stats = useSelector(selectDashboardStats);
  const readyOrders = useSelector(selectReadyOrders);
  const readyForDelivery = useSelector(selectReadyForDelivery);

  const [activeTab, setActiveTab] = React.useState('deliveries');

  useEffect(() => {
    dispatch(fetchLivreurDashboardStats());
    dispatch(fetchReadyOrders());
    dispatch(fetchReadyForDelivery());
  }, [dispatch]);

  const nextMission = useMemo(() => {
    if (readyForDelivery.length > 0) return readyForDelivery[0];
    if (readyOrders.length > 0) return readyOrders[0];
    return null;
  }, [readyOrders, readyForDelivery]);

  const filteredMissions = useMemo(() => {
    return activeTab === 'deliveries' ? readyForDelivery : readyOrders;
  }, [activeTab, readyOrders, readyForDelivery]);

  const handleNavigateToMission = (id) => {
    navigate(`/livreur/delivery/${id}`);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-16 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* KPI GRID - Optimized for Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
        <StatCard 
          label={t('driver.dashboard.stats.ready_delivery')}
          count={stats.commandesPretesCount}
          icon={Truck}
          colorClass="border-emerald-500"
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-600"
          barColorClass="bg-emerald-500"
          t={t}
          onClick={() => { setActiveTab('deliveries'); }}
        />
        <StatCard 
          label={t('driver.dashboard.stats.collect_workshop')}
          count={stats.commandesARecupererCount}
          icon={Archive}
          colorClass="border-primary-500"
          iconBgClass="bg-primary-500/10"
          iconColorClass="text-primary-600"
          barColorClass="bg-primary-500"
          t={t}
          onClick={() => setActiveTab('collections')}
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard 
            label={t('driver.dashboard.stats.canceled')}
            count={stats.commandesAnnuleesCount}
            icon={RotateCcw}
            colorClass="border-orange-500"
            iconBgClass="bg-orange-500/10"
            iconColorClass="text-orange-600"
            barColorClass="bg-orange-500"
            t={t}
            onClick={() => navigate('/livreur/canceled')}
          />
        </div>
      </div>

      {/* SPOTLIGHT HERO */}
      <NextMissionSpotlight mission={nextMission} onNavigate={handleNavigateToMission} t={t} />

      {/* MISSIONS SECTION */}
      <div className="space-y-6 text-start">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase">
              {t('driver.dashboard.missions.title')}
            </h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60 mt-1">{t('driver.dashboard.missions.subtitle')}</p>
          </div>
          
          <div className="bg-surface border border-border/50 p-1.5 rounded-[1.25rem] flex w-full sm:w-auto shadow-sm">
            <button 
              onClick={() => setActiveTab('deliveries')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deliveries' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary'}`}
            >
              {t('driver.dashboard.missions.badges.delivery')} ({readyForDelivery.length})
            </button>
            <button 
              onClick={() => setActiveTab('collections')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'collections' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary'}`}
            >
              {t('driver.dashboard.missions.badges.collect')} ({readyOrders.length})
            </button>
          </div>
        </div>

        {/* Mobile Missions List */}
        <div className="md:hidden space-y-4">
          {filteredMissions.length > 0 ? (
            filteredMissions.map(mission => (
              <MissionMobileCard 
                key={mission.id} 
                mission={mission} 
                onNavigate={handleNavigateToMission} 
                t={t}
              />
            ))
          ) : (
            <div className="bg-surface rounded-[2.5rem] border border-border/50 border-dashed py-24 flex flex-col items-center text-center opacity-40">
              <LayoutDashboard size={48} className="mb-4 text-text-muted" />
              <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('driver.dashboard.missions.empty_title')}</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('driver.dashboard.missions.empty_body')}</p>
            </div>
          )}
        </div>

        {/* Desktop Missions Table */}
        <div className="hidden md:block bg-surface rounded-[2rem] shadow-card overflow-hidden border border-border/50">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-start">
              <thead className="bg-background/50 border-b border-border/50">
                <tr>
                  <th className="px-8 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.labels.order')}</th>
                  <th className="px-8 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('driver.dashboard.missions.headers.client')}</th>
                  <th className="px-8 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('driver.dashboard.missions.headers.type')}</th>
                  <th className="px-8 py-4 text-end text-[10px] font-black text-text-muted uppercase tracking-[0.2em] w-24">{t('admin.clients.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                 {filteredMissions.length > 0 ? (
                  filteredMissions.map(mission => (
                    <MissionTableRow 
                      key={mission.id} 
                      mission={mission} 
                      onNavigate={handleNavigateToMission} 
                      t={t}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-24 text-center opacity-40">
                      <div className="flex flex-col items-center justify-center">
                        <LayoutDashboard size={48} className="mb-4" />
                        <p className="text-lg font-black text-text-primary uppercase tracking-tight">{t('driver.dashboard.missions.empty_title')}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('driver.dashboard.missions.empty_body')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
