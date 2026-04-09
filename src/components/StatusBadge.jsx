import React from 'react';
import { useTranslation } from 'react-i18next';

const statusConfigs = {
  EN_ATTENTE:    { bg: 'bg-status-en_attente',    text: 'text-status-en_attente-text',    dot: 'bg-status-en_attente-text',    key: 'status.en_attente' },
  VALIDEE:       { bg: 'bg-status-validee',       text: 'text-status-validee-text',       dot: 'bg-status-validee-text',       key: 'status.validee' },
  EN_TRAITEMENT: { bg: 'bg-status-en_traitement', text: 'text-status-en_traitement-text', dot: 'bg-status-en_traitement-text', key: 'status.en_traitement' },
  PRETE:         { bg: 'bg-status-prete',         text: 'text-status-prete-text',         dot: 'bg-status-prete-text',         key: 'status.prete' },
  LIVREE:        { bg: 'bg-status-livree',        text: 'text-status-livree-text',        dot: 'bg-status-livree-text',        key: 'status.livree' },
  PAYEE:         { bg: 'bg-status-payee',         text: 'text-status-payee-text',         dot: 'bg-status-payee-text',         key: 'status.payee' },
  ANNULEE:       { bg: 'bg-status-annulee',       text: 'text-status-annulee-text',       dot: 'bg-status-annulee-text',       key: 'status.annulee' },
  RETOURNEE:     { bg: 'bg-status-retour',        text: 'text-status-retour-text',        dot: 'bg-status-retour-text',        key: 'status.retournee' },
};

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const cfg = statusConfigs[status?.toUpperCase()] || {
    bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', key: null
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.key ? t(cfg.key) : (status || '—')}
    </span>
  );
};

