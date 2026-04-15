import { api } from "../../api/axios";


export const getMyNotifications = async () => {
    return await api.get('/api/notifications');
};

export const getUnreadCount = async () => {
    return await api.get('/api/notifications/unread-count');
};

export const markNotificationAsRead = async (id) => {
    return await api.put(`/api/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
    return await api.put('/api/notifications/mark-all-read');
};
