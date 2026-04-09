import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Archive, 
  RotateCcw, 
  Navigation2, 
  MoreHorizontal,
  LayoutDashboard,
  ChevronRight,
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

const StatCard = ({ label, count, icon: Icon, colorClass, iconBgClass, iconColorClass, barColorClass, t }) => (
  <div className={`bg-white rounded-2xl shadow-card p-5 border-t-2 ${colorClass} transition-all hover:shadow-card-hover text-start`}>
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight max-w-[120px]">
        {label}
      </span>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass}`}>
        <Icon className={iconColorClass} size={24} />
      </div>
    </div>
    <div className="mt-3">
      <span className="text-4xl font-black text-text-primary">{count}</span>
    </div>
    <div className="mt-4 flex flex-col gap-2">
      <span className={`text-[10px] font-bold uppercase ${iconColorClass}`}>
        {label === t('driver.dashboard.stats.ready_delivery') ? t('driver.dashboard.stats.deliveries') : label === t('driver.dashboard.stats.collect_workshop') ? t('driver.dashboard.stats.collections') : t('driver.dashboard.stats.to_return')}
      </span>
      <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColorClass}`} style={{ width: count > 0 ? '70%' : '0%' }}></div>
      </div>
    </div>
  </div>
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
    <tr className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4 text-start">
        <span className="text-sm font-bold text-text-primary">#{mission.numeroCommande}</span>
      </td>
      <td className="px-5 py-4 text-start">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 text-text-secondary font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-primary truncate">{displayName}</span>
            <span className="text-[10px] text-text-muted truncate">{mission.client?.addresses?.[0]?.address || t('admin.clients.not_specified')}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-start">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider
          ${isDelivery 
            ? 'bg-teal-50 text-teal-700 border-teal-200' 
            : 'bg-primary-50 text-primary-600 border-primary-200'}`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.workshop_collect')}
        </span>
      </td>
      <td className="px-5 py-4 text-end">
        <button 
          onClick={() => onNavigate(mission.id)}
          className="w-10 h-10 rounded-xl bg-gray-100 text-text-muted flex items-center justify-center hover:bg-primary-50 hover:text-primary-500 transition-all border border-transparent hover:border-primary-100 ms-auto"
        >
          <Navigation2 size={18} className="rtl:rotate-180" />
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
    <div className="bg-white rounded-2xl shadow-card p-4 mb-4 border border-border/40 animate-in slide-in-from-bottom duration-300 text-start">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-0.5">{t('workshop.detail.labels.order')}</span>
          <span className="text-base font-black text-text-primary tracking-tight">#{mission.numeroCommande}</span>
        </div>
        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest
          ${isDelivery 
            ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' 
            : 'bg-primary-50 text-primary-600 border-primary-200 shadow-sm'}`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.collect')}
        </span>
      </div>

      <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-xl mb-4 border border-gray-100">
        <div className="w-12 h-12 rounded-full bg-white text-primary-600 font-black flex items-center justify-center shadow-sm border border-primary-100 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-text-primary uppercase truncate leading-tight">{displayName}</p>
          <div className="flex items-start gap-1.5 mt-1">
            <MapPin size={12} className="text-text-muted shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-text-muted truncate leading-relaxed lowercase first-letter:uppercase">{mission.client?.addresses?.[0]?.address}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onNavigate(mission.id)}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-primary-500/20 text-xs uppercase tracking-widest"
      >
        <Navigation2 size={18} strokeWidth={2.5} fill="white" className="rtl:rotate-180" />
        {t('driver.dashboard.missions.start_mission')}
      </button>
    </div>
  );
};

export default function LivreurDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const stats = useSelector(selectDashboardStats);
  const readyOrders = useSelector(selectReadyOrders); // PRETE
  const readyForDelivery = useSelector(selectReadyForDelivery); // LIVREE (Sorti)
  const loading = useSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchLivreurDashboardStats());
    dispatch(fetchReadyOrders());
    dispatch(fetchReadyForDelivery());
  }, [dispatch]);

  // Combine both types of missions for the daily list
  const missions = useMemo(() => {
    return [...readyForDelivery, ...readyOrders].sort((a, b) => b.id - a.id);
  }, [readyOrders, readyForDelivery]);

  const handleNavigateToMission = (id) => {
    navigate(`/livreur/delivery/${id}`); // Match the route in App.jsx
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      
      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard 
          label={t('driver.dashboard.stats.ready_delivery')}
          count={stats.commandesPretesCount}
          icon={Truck}
          colorClass="border-teal-500"
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-500"
          barColorClass="bg-teal-400"
          t={t}
        />
        <StatCard 
          label={t('driver.dashboard.stats.collect_workshop')}
          count={stats.commandesARecupererCount}
          icon={Archive}
          colorClass="border-primary-500"
          iconBgClass="bg-primary-50"
          iconColorClass="text-primary-500"
          barColorClass="bg-primary-400"
          t={t}
        />
        <StatCard 
          label={t('driver.dashboard.stats.canceled')}
          count={stats.commandesAnnuleesCount}
          icon={RotateCcw}
          colorClass="border-orange-500"
          iconBgClass="bg-orange-50"
          iconColorClass="text-orange-500"
          barColorClass="bg-orange-300"
          t={t}
        />
      </div>

      {/* MISSIONS DU JOUR */}
      <div className="space-y-4 text-start">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              {t('driver.dashboard.missions.title')}
              {missions.length > 0 && (
                <span className="text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-black">
                  {missions.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-text-muted">{t('driver.dashboard.missions.subtitle')}</p>
          </div>
          <button 
            onClick={() => navigate('/livreur/delivery')}
            className="text-primary-500 text-sm font-bold hover:text-primary-600 transition-colors flex items-center gap-1 group"
          >
            {t('driver.dashboard.missions.view_planning')}
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </button>
        </div>

        {/* Mobile Missions List */}
        <div className="md:hidden space-y-4">
          {missions.length > 0 ? (
            missions.map(mission => (
              <MissionMobileCard 
                key={mission.id} 
                mission={mission} 
                onNavigate={handleNavigateToMission} 
                t={t}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-10 text-center border border-border/50">
               <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <LayoutDashboard size={32} className="text-text-muted opacity-20" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">{t('driver.dashboard.missions.empty_title')}</p>
                  <p className="text-xs text-text-muted mt-1">{t('driver.dashboard.missions.empty_body')}</p>
                </div>
            </div>
          )}
        </div>

        {/* Desktop Missions Table */}
        <div className="hidden md:block bg-white rounded-3xl shadow-card overflow-hidden border border-border/50">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-start">
              <thead className="bg-gray-50/50 border-b border-border">
                <tr>
                  <th className="px-5 py-4 text-start text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('workshop.detail.labels.order')}</th>
                  <th className="px-5 py-4 text-start text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('driver.dashboard.missions.headers.client')}</th>
                  <th className="px-5 py-4 text-start text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('driver.dashboard.missions.headers.type')}</th>
                  <th className="px-5 py-4 text-end text-[10px] font-bold text-text-muted uppercase tracking-widest w-20">{t('admin.clients.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {missions.length > 0 ? (
                  missions.map(mission => (
                    <MissionTableRow 
                      key={mission.id} 
                      mission={mission} 
                      onNavigate={handleNavigateToMission} 
                      t={t}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <LayoutDashboard size={32} className="text-text-muted opacity-20" />
                        </div>
                        <p className="text-sm font-bold text-text-primary">{t('driver.dashboard.missions.empty_title')}</p>
                        <p className="text-xs text-text-muted mt-1">{t('driver.dashboard.missions.empty_body')}</p>
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

