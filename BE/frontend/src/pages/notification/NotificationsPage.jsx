import { useEffect, useMemo, useState } from 'react';

import Navbar from '../../shared/components/Navbar';

import {
    getMyNotifications,
    markAsRead,
    markAllAsRead
} from '../../features/notification/services/notificationService';

import './NotificationsPage.css';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');

    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [markingId, setMarkingId] = useState(null);

    const [error, setError] = useState('');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getMyNotifications();

            setNotifications(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'Could not load notifications.'
            );
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = useMemo(
        () => notifications.filter(notification => !notification.read).length,
        [notifications]
    );

    const sortedNotifications = useMemo(() => {
        return [...notifications].sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );
    }, [notifications]);

    const displayedNotifications = useMemo(() => {
        if (filter === 'unread') {
            return sortedNotifications.filter(
                notification => !notification.read
            );
        }

        return sortedNotifications;
    }, [filter, sortedNotifications]);

    const handleRead = async notification => {
        if (notification.read || markingId) return;

        try {
            setMarkingId(notification.id);
            setError('');

            await markAsRead(notification.id);

            setNotifications(current =>
                current.map(item =>
                    item.id === notification.id
                        ? { ...item, read: true }
                        : item
                )
            );

            window.dispatchEvent(
                new Event('vetapp-notifications-updated')
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'Could not mark notification as read.'
            );
        } finally {
            setMarkingId(null);
        }
    };

    const handleReadAll = async () => {
        if (unreadCount === 0 || markingAll) return;

        try {
            setMarkingAll(true);
            setError('');

            await markAllAsRead();

            setNotifications(current =>
                current.map(notification => ({
                    ...notification,
                    read: true
                }))
            );

            window.dispatchEvent(
                new Event('vetapp-notifications-updated')
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'Could not mark all notifications as read.'
            );
        } finally {
            setMarkingAll(false);
        }
    };

    const formatDate = value => {
        if (!value) return '—';

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return '—';

        return date.toLocaleDateString('en-GB');
    };

    const formatTime = value => {
        if (!value) return '';

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return '';

        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNotificationPresentation = type => {
        switch (type) {
            case 'APPOINTMENT_CONFIRMED':
                return {
                    icon: '✓',
                    label: 'Appointment',
                    className: 'confirmed'
                };

            case 'APPOINTMENT_CANCELED':
                return {
                    icon: '×',
                    label: 'Appointment',
                    className: 'canceled'
                };

            case 'APPOINTMENT_NO_SHOW':
                return {
                    icon: '!',
                    label: 'Appointment',
                    className: 'no-show'
                };

            case 'MEDICAL_RECORD_ADDED':
                return {
                    icon: '+',
                    label: 'Medical record',
                    className: 'medical'
                };

            default:
                return {
                    icon: '•',
                    label: 'Update',
                    className: 'default'
                };
        }
    };

    return (
        <>
            <Navbar />

            <main className="notifications-page">
                <div className="notifications-container">

                    <header className="notifications-header">
                        <div>
                            <span>NOTIFICATIONS</span>

                            <h1>Updates</h1>

                            <p>
                                Keep track of appointments, medical records and account activity.
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleReadAll}
                                disabled={markingAll}
                            >
                                {markingAll
                                    ? 'Marking...'
                                    : 'Mark all as read'}
                            </button>
                        )}
                    </header>

                    <section className="notifications-summary">

                        <div className="notifications-summary-item">
                            <span>ALL</span>

                            <strong>
                                {notifications.length}
                            </strong>

                            <p>Total notifications</p>
                        </div>

                        <div className="notifications-summary-item unread">
                            <span>UNREAD</span>

                            <strong>
                                {unreadCount}
                            </strong>

                            <p>Require your attention</p>
                        </div>

                    </section>

                    {error && (
                        <div className="notifications-error">
                            {error}
                        </div>
                    )}

                    <div className="notifications-toolbar">

                        <div className="notifications-tabs">
                            <button
                                type="button"
                                className={
                                    filter === 'all'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() => setFilter('all')}
                            >
                                All

                                <span>
                                    {notifications.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                className={
                                    filter === 'unread'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() => setFilter('unread')}
                            >
                                Unread

                                <span>
                                    {unreadCount}
                                </span>
                            </button>
                        </div>

                    </div>

                    {loading ? (
                        <div className="notifications-state">
                            <div className="notifications-spinner" />
                            <p>Loading notifications...</p>
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className="notifications-empty">
                            <div>✓</div>

                            <h2>
                                {filter === 'unread'
                                    ? 'No unread notifications'
                                    : 'You’re all caught up'}
                            </h2>

                            <p>
                                {filter === 'unread'
                                    ? 'You have read all of your current notifications.'
                                    : 'New updates will appear here when there is activity on your account.'}
                            </p>
                        </div>
                    ) : (
                        <section className="notifications-list">

                            {displayedNotifications.map(notification => {
                                const presentation =
                                    getNotificationPresentation(
                                        notification.type
                                    );

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        className={
                                            `notification-item ${!notification.read
                                                ? 'notification-unread'
                                                : ''
                                            }`
                                        }
                                        onClick={() =>
                                            handleRead(notification)
                                        }
                                        disabled={
                                            markingId === notification.id
                                        }
                                    >
                                        <div
                                            className={
                                                `notification-icon ${presentation.className}`
                                            }
                                        >
                                            {presentation.icon}
                                        </div>

                                        <div className="notification-content">

                                            <div className="notification-heading">

                                                <div className="notification-title-row">
                                                    <span>
                                                        {presentation.label}
                                                    </span>

                                                    {!notification.read && (
                                                        <span className="notification-new">
                                                            New
                                                        </span>
                                                    )}
                                                </div>

                                                <strong>
                                                    {notification.title ||
                                                        'VETApp update'}
                                                </strong>

                                            </div>

                                            <p className="notification-message">
                                                {notification.message}
                                            </p>

                                            <div className="notification-footer">
                                                <span>
                                                    {formatDate(
                                                        notification.createdAt
                                                    )}
                                                </span>

                                                <span className="notification-footer-dot">
                                                    ·
                                                </span>

                                                <span>
                                                    {formatTime(
                                                        notification.createdAt
                                                    )}
                                                </span>

                                                {!notification.read && (
                                                    <>
                                                        <span className="notification-footer-dot">
                                                            ·
                                                        </span>

                                                        <strong>
                                                            Click to mark as read
                                                        </strong>
                                                    </>
                                                )}
                                            </div>

                                        </div>

                                        {!notification.read && (
                                            <span className="notification-indicator" />
                                        )}

                                    </button>
                                );
                            })}

                        </section>
                    )}

                </div>
            </main>
        </>
    );
}