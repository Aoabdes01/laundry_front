import React from 'react';
import { useTranslation } from 'react-i18next';

const statusConfigs = {
  // Command Statuses
  EN_ATTENTE:    { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', text: 'text-[#D97706]', key: 'status.en_attente' },
  VALIDEE:       { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#3B82F6]', key: 'status.validee' },
  EN_TRAITEMENT: { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#3B82F6]', key: 'status.en_traitement' },
  PRETE:         { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#3B82F6]', key: 'status.prete' },
  LIVREE:        { bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', text: 'text-[#10B981]', key: 'status.livree' },
  PAYEE:         { bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', text: 'text-[#10B981]', key: 'status.payee' },
  ANNULEE:       { bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]', text: 'text-[#EF4444]', key: 'status.annulee' },
  RETOURNEE:     { bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]', text: 'text-[#EF4444]', key: 'status.retournee' },
  
  // Tapis Specific Statuses (Workshop)
  EN_NETTOYAGE:  { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#3B82F6]', key: 'status.en_traitement' },
  NETTOYE:       { bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', text: 'text-[#10B981]', key: 'status.prete' },
};

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const normalizedStatus = status?.toUpperCase();
  const cfg = statusConfigs[normalizedStatus] || {
    bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-600', key: null
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      {cfg.key ? t(cfg.key) : (status || '—')}
    </span>
  );
};

