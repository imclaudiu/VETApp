import api from '../../../shared/services/api';

export const getMyNotifications = async () => (await api.get('/notification/mine')).data;
export const getUnreadCount = async () => (await api.get('/notification/unread-count')).data.count;
export const markAsRead = async (id) => api.patch(`/notification/read/${id}`);
export const markAllAsRead = async () => api.patch('/notification/read-all');