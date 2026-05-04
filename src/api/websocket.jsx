import React from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { receiveNotification } from '../store/notifications/notificationSlice';
import { toast } from 'react-toastify';

let stompClient = null;

export const connectWebSocket = (userId, dispatch) => {
    if (stompClient) return;

    // Use relative path — Vite proxy handles this in dev,
    // and it will use the current origin in production.
    const socket = new SockJS(`/ws`);
    
    stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
            if (import.meta.env.DEV) console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
        if (import.meta.env.DEV) console.log('Connected to WebSocket: ' + frame);
        
        // Subscribe to user-specific notification queue
        stompClient.subscribe('/user/queue/notifications', (message) => {
            if (message.body) {
                const notification = JSON.parse(message.body);
                dispatch(receiveNotification(notification));
                
                // --- Premium Toast Mapping ---
                const getStyles = (type, title = '') => {
                    const text = (type || title || '').toUpperCase();
                    if (text.includes('ORDER_CREATED') || text.includes('CRÉÉE') || text.includes('NOUVELLE')) return { bg: 'rgba(13,115,119,0.1)', emoji: '📦', border: '#0D7377' };
                    if (text.includes('ORDER_RECEIVED') || text.includes('RÉCEPTIONNÉE')) return { bg: 'rgba(59,130,246,0.1)', emoji: '✅', border: '#3B82F6' };
                    if (text.includes('ORDER_READY') || text.includes('PRÊTE')) return { bg: 'rgba(16,185,129,0.1)', emoji: '🎉', border: '#10B981' };
                    if (text.includes('ORDER_DELIVERED') || text.includes('LIVRÉE')) return { bg: 'rgba(201,168,76,0.1)', emoji: '🚚', border: '#C9A84C' };
                    if (text.includes('ORDER_PAID') || text.includes('PAYÉE')) return { bg: 'rgba(201,168,76,0.15)', emoji: '💰', border: '#C9A84C' };
                    if (text.includes('ORDER_CANCELLED') || text.includes('ANNULÉE')) return { bg: 'rgba(239,68,68,0.1)', emoji: '❌', border: '#EF4444' };
                    if (text.includes('ORDER_RETURNED') || text.includes('RETOURNÉE')) return { bg: 'rgba(245,158,11,0.1)', emoji: '↩️', border: '#F59E0B' };
                    return { bg: 'rgba(13,115,119,0.08)', emoji: '🔔', border: '#0D7377' };
                };

                const s = getStyles(notification.type, notification.title);

                // Show instant toast alert with custom JSX
                toast.info(
                    <div className="flex gap-3 items-start text-start">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[16px]" style={{ backgroundColor: s.bg }}>
                            {s.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-['Inter'] text-[13px] font-semibold text-[#0D1B2A] m-0">{notification.title}</p>
                            <p className="font-['Inter'] text-[12px] text-[#4A5568] truncate m-0 mt-0.5">{notification.message}</p>
                            <p className="font-['Inter'] text-[11px] text-[#94A3B8] m-0 mt-1 uppercase font-bold tracking-wider">À l'instant</p>
                        </div>
                    </div>,
                    {
                        position: "top-right",
                        autoClose: 4000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        className: 'premium-notification-toast',
                        style: { 
                            borderLeft: `4px solid ${s.border}`,
                            background: 'white',
                            borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            padding: '14px 16px',
                            width: '300px'
                        }
                    }
                );
            }
        });
    };

    stompClient.onStompError = (frame) => {
        console.error('STOMP error', frame.headers['message']);
        console.error('STOMP details', frame.body);
    };

    stompClient.activate();
};

export const disconnectWebSocket = () => {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
};
