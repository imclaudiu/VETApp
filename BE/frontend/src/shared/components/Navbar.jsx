import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'OWNER':
                return 'Pet owner';
            case 'VETERINARIAN':
                return 'Veterinarian';
            case 'ADMIN':
                return 'Administrator';
            default:
                return '';
        }
    };

    const getInitial = () => {
        return user?.username?.charAt(0)?.toUpperCase() || 'U';
    };

    return (
        <header className="navbar">
            <div className="navbar-inner">

                {/* LOGO */}
                <NavLink
                    to="/dashboard"
                    className="navbar-logo"
                    onClick={closeMenu}
                >
                    <span className="navbar-logo-icon">+</span>
                    <span>VETApp</span>
                </NavLink>


                {/* MOBILE BUTTON */}
                <button
                    className="navbar-menu-button"
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                >
                    <span />
                    <span />
                    <span />
                </button>


                {/* NAVIGATION */}
                <div
                    className={`navbar-content ${menuOpen ? 'navbar-content-open' : ''
                        }`}
                >
                    <nav className="navbar-links">

                        <NavLink
                            to="/dashboard"
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                isActive
                                    ? 'navbar-link navbar-link-active'
                                    : 'navbar-link'
                            }
                        >
                            Dashboard
                        </NavLink>


                        {user?.role === 'OWNER' && (
                            <>
                                <NavLink
                                    to="/pets"
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        isActive
                                            ? 'navbar-link navbar-link-active'
                                            : 'navbar-link'
                                    }
                                >
                                    My pets
                                </NavLink>

                                <NavLink
                                    to="/clinics"
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        isActive
                                            ? 'navbar-link navbar-link-active'
                                            : 'navbar-link'
                                    }
                                >
                                    Clinics
                                </NavLink>
                            </>
                        )}


                        {user?.role === 'ADMIN' && (
                            <NavLink
                                to="/admin"
                                onClick={closeMenu}
                                className={({ isActive }) =>
                                    isActive
                                        ? 'navbar-link navbar-link-active'
                                        : 'navbar-link'
                                }
                            >
                                Admin panel
                            </NavLink>
                        )}

                    </nav>


                    {/* USER */}
                    <div className="navbar-user">

                        <div className="navbar-user-avatar">
                            {getInitial()}
                        </div>

                        <div className="navbar-user-info">
                            <span className="navbar-username">
                                {user?.username}
                            </span>

                            <span className="navbar-role">
                                {getRoleLabel()}
                            </span>
                        </div>

                        <button
                            className="navbar-logout"
                            type="button"
                            onClick={handleLogout}
                        >
                            Log out
                        </button>

                    </div>

                </div>

            </div>
        </header>
    );
}