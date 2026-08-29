import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { getUnreadCount } from '../../features/notification/services/notificationService';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const loadCount = async () => {
            try {
                setUnreadCount(await getUnreadCount());
            } catch { }
        };

        loadCount();

        const interval = setInterval(loadCount, 30000);

        window.addEventListener(
            'vetapp-notifications-updated',
            loadCount
        );

        return () => {
            clearInterval(interval);

            window.removeEventListener(
                'vetapp-notifications-updated',
                loadCount
            );
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const linkClass = ({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link';

    return (
        <header className="navbar">
            <div className="navbar-inner">

                <NavLink to="/dashboard" className="navbar-logo">
                    <span className="navbar-logo-mark">+</span>
                    <span>VETApp</span>
                </NavLink>

                <button className="navbar-mobile-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                    <span />
                    <span />
                    <span />
                </button>

                <div className={`navbar-content ${menuOpen ? 'navbar-content-open' : ''}`}>

                    <nav className="navbar-links">
                        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>

                        {user?.role === 'OWNER' && (
                            <>
                                <NavLink to="/pets" className={linkClass}>My pets</NavLink>
                                <NavLink to="/clinics" className={linkClass}>Clinics</NavLink>
                                <NavLink to="/appointments" className={linkClass}>Appointments</NavLink>
                                <NavLink to="/chatbot" className={linkClass}>AI Assistant</NavLink>
                            </>
                        )}

                        {user?.role === 'VETERINARIAN' && (
                            <>
                                <NavLink to="/veterinarian/appointments" className={linkClass}>Appointments</NavLink>
                                <NavLink to="/veterinarian/schedule" className={linkClass}>Schedule</NavLink>
                            </>
                        )}

                        {user?.role === 'ADMIN' && (
                            <>
                                <NavLink to="/admin" className={linkClass}>Administration</NavLink>
                                <NavLink to="/admin/clinics" className={linkClass}>Clinics</NavLink>
                            </>
                        )}
                    </nav>

                    <div className="navbar-actions">

                        <NavLink to="/notifications" className="navbar-notifications" aria-label="Notifications">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                            </svg>

                            {unreadCount > 0 && (
                                <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                        </NavLink>

                        <div className="navbar-account">
                            <button className="navbar-account-button" onClick={() => setAccountOpen(!accountOpen)}>
                                <div className="navbar-avatar">
                                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                </div>

                                <div className="navbar-account-info">
                                    <strong>{user?.username}</strong>
                                    <span>{user?.role === 'OWNER' ? 'Pet owner' : user?.role === 'ADMIN' ? 'Administrator' : 'Veterinarian'}</span>
                                </div>

                                <span className="navbar-chevron">⌄</span>
                            </button>

                            {accountOpen && (
                                <div className="navbar-dropdown">
                                    <NavLink to="/settings" onClick={() => setAccountOpen(false)}>Settings</NavLink>
                                    <NavLink to="/notifications" onClick={() => setAccountOpen(false)}>Notifications</NavLink>
                                    <button onClick={handleLogout}>Log out</button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </header>
    );
}