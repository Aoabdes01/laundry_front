import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Archive, 
  RotateCcw, 
  Navigation2, 
  LayoutDashboard,
  MapPin
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
    className={`w-full bg-surface rounded-2xl shadow-card p-6 border-t-4 ${colorClass} transition-all hover:shadow-card-hover hover:-translate-y-1 text-start group`}
  >
    <div className="flex justify-between items-start">
      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider leading-tight max-w-[120px] group-hover:text-text-primary transition-colors">
        {label}
      </span>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass} group-hover:scale-105 transition-transform`}>
        <Icon className={iconColorClass} size={24} />
      </div>
    </div>
    <div className="mt-2">
      <span className="text-3xl font-bold text-text-primary tracking-tight">{count}</span>
    </div>
    <div className="mt-4 flex flex-col gap-2">
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${iconColorClass}`}>
        {label === t('driver.dashboard.stats.ready_delivery') ? t('driver.dashboard.stats.deliveries') : label === t('driver.dashboard.stats.collect_workshop') ? t('driver.dashboard.stats.collections') : t('driver.dashboard.stats.to_return')}
      </span>
      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
        <div className={`h-full ${barColorClass} transition-all duration-500`} style={{ width: count > 0 ? '70%' : '0%' }}></div>
      </div>
    </div>
  </button>
);

const getClientDisplayName = (mission, t) => {
  const name = mission.client?.nom || mission.clientNom || mission.nomClient || mission.client?.name;
  if (name) return name;
  return t('clients.not_specified');
};

const getInitials = (name) => {
  if (!name || name === 'Non renseigné' || name === 'بدون اسم' || name === 'Sans nom') return 'C';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const MissionTableRow = ({ mission, onNavigate, t }) => {
  const isDelivery = mission.status === 'livree';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
      <td className="px-8 py-5 text-start">
        <span className="text-sm font-semibold text-text-primary">#{mission.numeroCommande}</span>
      </td>
      <td className="px-8 py-5 text-start">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-background text-text-secondary font-semibold text-xs flex items-center justify-center shrink-0 border border-border">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate">{displayName}</span>
            <span className="text-xs text-text-muted truncate leading-tight">{mission.client?.addresses?.[0]?.address || t('admin.clients.not_specified')}</span>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 text-start">
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase border tracking-wide
          ${isDelivery 
            ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' 
            : 'bg-primary-500/10 text-primary-600 border-primary-500/20'}`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.collect')}
        </span>
      </td>
      <td className="px-8 py-5 text-end">
        <button 
          onClick={() => onNavigate(mission.id)}
          className="w-9 h-9 rounded-lg bg-background text-text-muted flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all border border-transparent ms-auto"
        >
          <Navigation2 size={16} className="rtl:rotate-180" />
        </button>
      </td>
    </tr>
  );
};

const MissionMobileCard = ({ mission, onNavigate, t }) => {
  const isDelivery = mission.status === 'livree';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName);

  return (
    <div className="bg-surface rounded-2xl shadow-card p-5 mb-4 border border-border/60 animate-in slide-in-from-bottom duration-300 text-start">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider mb-0.5">{t('workshop.detail.labels.order')}</span>
          <span className="text-lg font-bold text-text-primary tracking-tight">#{mission.numeroCommande}</span>
        </div>
        <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase border tracking-wide
          ${isDelivery 
            ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' 
            : 'bg-primary-500/10 text-primary-600 border-primary-500/20'}`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.collect')}
        </span>
      </div>

      <div className="flex items-center gap-4 bg-background/50 p-3.5 rounded-xl mb-4 border border-border/50">
        <div className="w-11 h-11 rounded-full bg-surface text-primary-600 font-bold text-sm flex items-center justify-center shadow-sm border border-primary-500/20 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-text-primary truncate leading-tight">{displayName}</p>
          <div className="flex items-start gap-1.5 mt-1">
            <MapPin size={13} className="text-text-muted shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted truncate leading-relaxed">{mission.client?.addresses?.[0]?.address}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onNavigate(mission.id)}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-md shadow-primary-500/10 text-sm"
      >
        <Navigation2 size={18} strokeWidth={2} fill="white" className="rtl:rotate-180" />
        {isDelivery ? t('driver.dashboard.missions.start_delivery', 'Lancer la livraison') : t('driver.dashboard.missions.start_collect', 'Récupérer à l\'atelier')}
      </button>
    </div>
  );
};

const NextMissionSpotlight = ({ mission, onNavigate, t }) => {
  if (!mission) return null;
  const isDelivery = mission.status === 'livree';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName);

  return (
    <div className="bg-primary-600 rounded-3xl p-7 text-white shadow-xl shadow-primary-500/20 overflow-hidden relative mb-8 animate-in zoom-in-95 duration-500 text-start">
      <div className="absolute top-0 end-0 p-4 opacity-10">
        <Truck size={100} strokeWidth={1} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
            {t('driver.dashboard.missions.next_mission', 'Prochaine Mission')}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
        </div>
        
        <div className="flex items-center gap-5 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-white text-primary-600 font-bold text-lg flex items-center justify-center shadow-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl font-bold tracking-tight truncate leading-tight mb-0.5">{displayName}</h3>
            <p className="text-primary-100 text-sm font-medium flex items-center gap-1.5 opacity-90">
              <MapPin size={14} /> {mission.client?.addresses?.[0]?.address || '—'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate(mission.id)}
          className="w-full bg-white text-primary-600 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg text-sm group"
        >
          <Navigation2 size={18} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rtl:rotate-180" />
          {isDelivery ? t('driver.dashboard.missions.start_delivery', 'Lancer la livraison') : t('driver.dashboard.missions.start_collect', 'Récupérer à l\'atelier')}
        </button>
      </div>
    </div>
  );
};

export default function LivreurDashboard() {
  const { t } = useTranslation();
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
    <div className="animate-fade-in space-y-8 pb-10 max-w-7xl mx-auto relative">
      
      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard 
          label={t('driver.dashboard.stats.ready_delivery')}
          count={stats.commandesPretesCount}
          icon={Truck}
          colorClass="border-teal-500"
          iconBgClass="bg-teal-500/10"
          iconColorClass="text-teal-600"
          barColorClass="bg-teal-500"
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
        <StatCard 
          label={t('driver.dashboard.stats.canceled')}
          count={stats.commandesAnnuleesCount}
          icon={RotateCcw}
          colorClass="border-orange-500"
          iconBgClass="bg-orange-500/10"
          iconColorClass="text-orange-600"
          barColorClass="bg-orange-500"
          t={t}
          onClick={() => navigate('/livreur/annulees')}
        />
      </div>

      {/* SPOTLIGHT */}
      <NextMissionSpotlight mission={nextMission} onNavigate={handleNavigateToMission} t={t} />

      {/* MISSIONS SECTION */}
      <div className="space-y-6 text-start">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {t('driver.dashboard.missions.title')}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5 font-medium">{t('driver.dashboard.missions.subtitle')}</p>
          </div>
          
          <div className="bg-background border border-border/60 p-1 rounded-xl flex w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('deliveries')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'deliveries' ? 'bg-surface text-primary-600 shadow-sm border border-border/40' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t('driver.dashboard.missions.badges.delivery')} ({readyForDelivery.length})
            </button>
            <button 
              onClick={() => setActiveTab('collections')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'collections' ? 'bg-surface text-primary-600 shadow-sm border border-border/40' : 'text-text-secondary hover:text-text-primary'}`}
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
            <div className="bg-surface rounded-2xl shadow-card p-12 text-center border border-border/60">
               <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center mb-4">
                    <LayoutDashboard size={28} className="text-text-muted opacity-30" />
                  </div>
                  <p className="text-sm font-bold text-text-primary uppercase tracking-tight">{t('driver.dashboard.missions.empty_title')}</p>
                  <p className="text-xs text-text-muted mt-2 font-medium">{t('driver.dashboard.missions.empty_body')}</p>
                </div>
            </div>
          )}
        </div>

        {/* Desktop Missions Table */}
        <div className="hidden md:block bg-surface rounded-2xl shadow-card overflow-hidden border border-border/60">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-start">
              <thead className="bg-background/50 border-b border-border">
                <tr>
                  <th className="px-8 py-4 text-start text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t('workshop.detail.labels.order')}</th>
                  <th className="px-8 py-4 text-start text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t('driver.dashboard.missions.headers.client')}</th>
                  <th className="px-8 py-4 text-start text-[11px] font-bold text-text-secondary uppercase tracking-wider">{t('driver.dashboard.missions.headers.type')}</th>
                  <th className="px-8 py-4 text-end text-[11px] font-bold text-text-secondary uppercase tracking-wider w-24">{t('admin.clients.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
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
                    <td colSpan="4" className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center mb-4">
                          <LayoutDashboard size={28} className="text-text-muted opacity-30" />
                        </div>
                        <p className="text-sm font-bold text-text-primary uppercase tracking-tight">{t('driver.dashboard.missions.empty_title')}</p>
                        <p className="text-xs text-text-muted mt-2 font-medium">{t('driver.dashboard.missions.empty_body')}</p>
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
