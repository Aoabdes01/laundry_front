import React from 'react';
import { useTranslation } from 'react-i18next';

const statusConfigs = {
  // Command Statuses
  EN_ATTENTE:    { bg: 'bg-status-en_attente',    text: 'text-status-en_attente-text',    dot: 'bg-status-en_attente-text',    key: 'status.en_attente' },
  VALIDEE:       { bg: 'bg-status-validee',       text: 'text-status-validee-text',       dot: 'bg-status-validee-text',       key: 'status.validee' },
  EN_TRAITEMENT: { bg: 'bg-status-en_traitement', text: 'text-status-en_traitement-text', dot: 'bg-status-en_traitement-text', key: 'status.en_traitement' },
  PRETE:         { bg: 'bg-status-prete',         text: 'text-status-prete-text',         dot: 'bg-status-prete-text',         key: 'status.prete' },
  LIVREE:        { bg: 'bg-status-livree',        text: 'text-status-livree-text',        dot: 'bg-status-livree-text',        key: 'status.livree' },
  PAYEE:         { bg: 'bg-status-payee',         text: 'text-status-payee-text',         dot: 'bg-status-payee-text',         key: 'status.payee' },
  ANNULEE:       { bg: 'bg-status-annulee',       text: 'text-status-annulee-text',       dot: 'bg-status-annulee-text',       key: 'status.annulee' },
  RETOURNEE:     { bg: 'bg-status-retour',        text: 'text-status-retour-text',        dot: 'bg-status-retour-text',        key: 'status.retournee' },
  
  // Tapis Specific Statuses (Workshop)
  EN_NETTOYAGE:  { bg: 'bg-violet-50',           text: 'text-violet-600',              dot: 'bg-violet-500',               key: 'status.en_traitement' },
  NETTOYE:       { bg: 'bg-teal-50',             text: 'text-teal-600',                dot: 'bg-teal-500',                 key: 'status.prete' },
};

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const normalizedStatus = status?.toUpperCase();
  const cfg = statusConfigs[normalizedStatus] || {
    bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', key: null
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${cfg.bg} ${cfg.text} ring-1 ring-inset ring-current/10`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.key ? t(cfg.key) : (status || '—')}
    </span>
  );
};

