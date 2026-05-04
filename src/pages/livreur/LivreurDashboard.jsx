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
  ChevronRight,
  MoreVertical
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

const StatCard = ({ label, count, icon: Icon, type, t, onClick }) => {
  const getAccentColor = () => {
    switch (type) {
      case 'deliveries': return '#10B981';
      case 'collections': return '#0D7377';
      case 'canceled': return '#F59E0B';
      default: return '#0D7377';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'deliveries': return 'rgba(16,185,129,0.1)';
      case 'collections': return 'rgba(13,115,119,0.1)';
      case 'canceled': return 'rgba(245,158,11,0.1)';
      default: return 'rgba(13,115,119,0.1)';
    }
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-[16px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] p-4 relative overflow-hidden text-start active:scale-[0.98] transition-all"
    >
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
        <span className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-[-0.02em]">
          {count}
        </span>
      </div>

      <div className="mt-3">
        <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">
          {label}
        </p>
      </div>
    </button>
  );
};

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

const MissionMobileCard = ({ mission, onNavigate, t }) => {
  const isDelivery = mission.status === 'livree' || mission.status === 'prete' || mission.status === 'EN_TRAITEMENT';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName, t);

  return (
    <div
      onClick={() => onNavigate(mission.id)}
      className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-5 border border-[rgba(0,0,0,0.06)] active:scale-[0.98] transition-all text-start group relative overflow-hidden mb-3"
    >
      <div className="flex justify-between items-center mb-4">
        <span className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          #{mission.numeroCommande}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] border ${
          isDelivery 
            ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#3B82F6]' 
            : 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
        }`}>
          {isDelivery ? t('driver.dashboard.missions.badges.delivery') : t('driver.dashboard.missions.badges.collect')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-[12px] bg-[var(--primary-surface)] text-[var(--primary)] font-['Plus_Jakarta_Sans'] font-bold text-lg flex items-center justify-center border border-[rgba(0,0,0,0.08)] shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] truncate leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[var(--text-secondary)]">
            <MapPin size={14} className="text-[var(--primary)] shrink-0" />
            <p className="font-['Inter'] text-[13px] font-medium truncate leading-tight">
              {mission.client?.addresses?.[0]?.fullAddress || mission.client?.address || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-[#10B981]" />
          <span className="font-['Inter'] text-[13px] font-semibold text-[var(--text)]">
            {getClientPhone(mission.client)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-bold text-[var(--primary)] uppercase tracking-wider">
          {t('common.details')} <ChevronRight size={14} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

const NextMissionSpotlight = ({ mission, onNavigate, t }) => {
  if (!mission) return null;
  const isDelivery = mission.status === 'livree' || mission.status === 'prete' || mission.status === 'EN_TRAITEMENT';
  const displayName = getClientDisplayName(mission, t);
  const initials = getInitials(displayName, t);

  return (
    <div className="bg-gradient-to-br from-[#0D7377] to-[#0A5F63] rounded-[20px] p-5 text-white shadow-[var(--shadow-teal)] relative mb-6 text-start group overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="font-['Inter'] text-[11px] font-semibold text-[rgba(255,255,255,0.7)] uppercase tracking-[0.06em]">
            {t('driver.dashboard.missions.next_mission')}
          </span>
          <MoreVertical size={18} className="text-[rgba(255,255,255,0.5)]" />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-[16px] bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] text-white font-['Plus_Jakarta_Sans'] font-bold text-2xl flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <span className="font-['Inter'] text-[11px] text-[rgba(255,255,255,0.6)] font-semibold uppercase tracking-wider">
              #{mission.numeroCommande}
            </span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold leading-tight truncate">
              {displayName}
            </h3>
            <p className="font-['Inter'] text-[13px] text-[rgba(255,255,255,0.75)] mt-1 truncate leading-tight">
              {mission.client?.addresses?.[0]?.address || '—'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate(mission.id)}
          className="w-full bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] border border-[rgba(255,255,255,0.25)] backdrop-blur-[8px] text-white font-['Inter'] font-semibold py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] text-[14px]"
        >
          <Navigation2 size={18} fill="currentColor" className="rtl:rotate-180" />
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
    <div className="animate-fade-in pb-12 text-start">
      
      {/* PAGE TITLE */}
      <div className="mb-6">
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-[-0.02em]">
          {t('nav.dashboard')}
        </h1>
        <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
          {t('admin.dashboard.overview_desc')}
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label={t('driver.dashboard.stats.ready_delivery')}
          count={stats.commandesPretesCount}
          icon={Truck}
          type="deliveries"
          t={t}
          onClick={() => setActiveTab('deliveries')}
        />
        <StatCard
          label={t('driver.dashboard.stats.collect_workshop')}
          count={stats.commandesARecupererCount}
          icon={Archive}
          type="collections"
          t={t}
          onClick={() => setActiveTab('collections')}
        />
        <div className="col-span-2">
          <StatCard
            label={t('driver.dashboard.stats.canceled')}
            count={stats.commandesAnnuleesCount}
            icon={RotateCcw}
            type="canceled"
            t={t}
            onClick={() => navigate('/livreur/canceled')}
          />
        </div>
      </div>

      {/* SPOTLIGHT HERO */}
      <NextMissionSpotlight mission={nextMission} onNavigate={handleNavigateToMission} t={t} />

      {/* MISSIONS SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">
            {t('driver.dashboard.missions.title')}
          </h2>
          
          <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1 rounded-[10px] flex shadow-[var(--shadow-sm)]">
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`px-4 py-1.5 rounded-[8px] text-[12px] font-bold transition-all duration-200 ${
                activeTab === 'deliveries' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {readyForDelivery.length}
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 py-1.5 rounded-[8px] text-[12px] font-bold transition-all duration-200 ${
                activeTab === 'collections' 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {readyOrders.length}
            </button>
          </div>
        </div>

        <div className="space-y-3">
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
            <div className="py-16 text-center opacity-40">
              <LayoutDashboard size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-semibold text-[var(--text-secondary)]">
                {t('driver.dashboard.missions.empty_title')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
