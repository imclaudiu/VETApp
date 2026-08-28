import { useEffect, useState } from 'react';
import Navbar from '../../shared/components/Navbar';
import { getMyNotifications, markAsRead, markAllAsRead } from '../../features/notification/services/notificationService';
import './NotificationsPage.css';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setNotifications(await getMyNotifications());
        } catch (err) {
            setError(err.message || 'Could not load notifications.');
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (notification) => {
        if (notification.read) return;
        await markAsRead(notification.id);
        setNotifications(current => current.map(n => n.id === notification.id ? { ...n, read: true } : n));
    };

    const handleReadAll = async () => {
        await markAllAsRead();
        setNotifications(current => current.map(n => ({ ...n, read: true })));
    };

    const formatDate = (date) => new Date(date).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const getIcon = (type) => {
        if (type === 'APPOINTMENT_CONFIRMED') return '✓';
        if (type === 'APPOINTMENT_CANCELED') return '×';
        if (type === 'APPOINTMENT_NO_SHOW') return '!';
        if (type === 'MEDICAL_RECORD_ADDED') return '+';
        return '•';
    };

    const unread = notifications.filter(n => !n.read).length;

    return (
        <>
            <Navbar />

            <main className="notifications-page">
                <div className="notifications-container">

                    <div className="notifications-header">
                        <div>
                            <p>NOTIFICATIONS</p>
                            <h1>Your notifications</h1>
                            <span>Updates about appointments and your pets.</span>
                        </div>

                        {unread > 0 && <button onClick={handleReadAll}>Mark all as read</button>}
                    </div>

                    {loading && <div className="notifications-state">Loading notifications...</div>}
                    {error && <div className="notifications-error">{error}</div>}

                    {!loading && !error && notifications.length === 0 && (
                        <div className="notifications-empty">
                            <div>✓</div>
                            <h2>You're all caught up</h2>
                            <p>You don't have any notifications yet.</p>
                        </div>
                    )}

                    {!loading && notifications.length > 0 && (
                        <div className="notifications-list">
                            {notifications.map(notification => (
                                <button
                                    key={notification.id}
                                    className={`notification-item ${!notification.read ? 'notification-unread' : ''}`}
                                    onClick={() => handleRead(notification)}
                                >
                                    <div className={`notification-icon notification-${notification.type?.toLowerCase()}`}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="notification-content">
                                        <div className="notification-top">
                                            <strong>{notification.title}</strong>
                                            <span>{formatDate(notification.createdAt)}</span>
                                        </div>

                                        <p>{notification.message}</p>
                                    </div>

                                    {!notification.read && <span className="notification-dot" />}
                                </button>
                            ))}
                        </div>
                    )}

                </div>
            </main>
        </>
    );
}