import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../shared/components/Navbar';
import { getAdminDashboardData } from '../features/admin/services/adminDashboardService';

import './AdminPanel.css';

const STATUSES = [
    'PENDING',
    'CONFIRMED',
    'FINISHED',
    'CANCELED',
    'NO_SHOW'
];

export default function AdminPanel() {
    const navigate = useNavigate();

    const [data, setData] = useState({
        users: [],
        pets: [],
        clinics: [],
        veterinarians: [],
        appointments: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError(null);

                const dashboardData = await getAdminDashboardData();

                setData({
                    users: Array.isArray(dashboardData.users)
                        ? dashboardData.users
                        : [],

                    pets: Array.isArray(dashboardData.pets)
                        ? dashboardData.pets
                        : [],

                    clinics: Array.isArray(dashboardData.clinics)
                        ? dashboardData.clinics
                        : [],

                    veterinarians: Array.isArray(dashboardData.veterinarians)
                        ? dashboardData.veterinarians
                        : [],

                    appointments: Array.isArray(dashboardData.appointments)
                        ? dashboardData.appointments
                        : []
                });
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load administration data.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const appointmentCounts = useMemo(() => {
        return STATUSES.reduce((result, status) => {
            result[status] = data.appointments.filter(
                appointment => appointment.status === status
            ).length;

            return result;
        }, {});
    }, [data.appointments]);

    const roleCounts = useMemo(() => ({
        OWNER: data.users.filter(
            user => user.role === 'OWNER'
        ).length,

        VETERINARIAN: data.users.filter(
            user => user.role === 'VETERINARIAN'
        ).length,

        ADMIN: data.users.filter(
            user => user.role === 'ADMIN'
        ).length
    }), [data.users]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return data.users.filter(user => {
            const matchesRole =
                roleFilter === 'ALL' ||
                user.role === roleFilter;

            const matchesSearch =
                !query ||
                user.username?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.telefon?.toLowerCase().includes(query);

            return matchesRole && matchesSearch;
        });
    }, [data.users, search, roleFilter]);

    const percentage = count => {
        if (!data.appointments.length) return 0;

        return Math.round(
            (count / data.appointments.length) * 100
        );
    };

    const formatRole = role => {
        if (role === 'OWNER') return 'Pet owner';
        if (role === 'VETERINARIAN') return 'Veterinarian';
        if (role === 'ADMIN') return 'Administrator';

        return role || 'Unknown';
    };

    const formatStatus = status => {
        if (status === 'NO_SHOW') return 'No show';
        if (status === 'CANCELED') return 'Canceled';
        if (status === 'FINISHED') return 'Finished';
        if (status === 'CONFIRMED') return 'Confirmed';
        if (status === 'PENDING') return 'Pending';

        return status;
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="admin-panel-page">
                    <div className="admin-panel-loading">
                        <div className="admin-panel-spinner" />
                        <p>Loading administration...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="admin-panel-page">
                <div className="admin-panel-container">

                    <header className="admin-panel-header">
                        <div>
                            <span>ADMINISTRATION</span>

                            <h1>Platform overview</h1>

                            <p>
                                Monitor users, clinics, patients and appointments across VETApp.
                            </p>
                        </div>

                        <Link
                            to="/admin/clinics"
                            className="primary-button"
                        >
                            Manage clinics
                        </Link>
                    </header>

                    {error && (
                        <div className="admin-panel-error">
                            {error}
                        </div>
                    )}

                    <section className="admin-panel-stats">

                        <StatCard
                            label="USERS"
                            value={data.users.length}
                            text="Registered accounts"
                        />

                        <StatCard
                            label="PETS"
                            value={data.pets.length}
                            text="Registered patients"
                        />

                        <StatCard
                            label="CLINICS"
                            value={data.clinics.length}
                            text="Veterinary clinics"
                        />

                        <StatCard
                            label="VETERINARIANS"
                            value={data.veterinarians.length}
                            text="Registered doctors"
                        />

                        <StatCard
                            label="APPOINTMENTS"
                            value={data.appointments.length}
                            text="Total appointments"
                        />

                    </section>

                    <div className="admin-panel-overview-grid">

                        <section className="admin-panel-card">
                            <div className="admin-panel-card-heading">
                                <div>
                                    <span>APPOINTMENTS</span>
                                    <h2>Status overview</h2>
                                </div>

                                <strong>
                                    {data.appointments.length} total
                                </strong>
                            </div>

                            <div className="admin-appointment-status-list">

                                {STATUSES.map(status => {
                                    const count =
                                        appointmentCounts[status] || 0;

                                    const percent =
                                        percentage(count);

                                    return (
                                        <div
                                            className="admin-appointment-status"
                                            key={status}
                                        >
                                            <div className="admin-status-header">

                                                <div>
                                                    <span
                                                        className={
                                                            `admin-status-dot ${status.toLowerCase()}`
                                                        }
                                                    />

                                                    <strong>
                                                        {formatStatus(status)}
                                                    </strong>
                                                </div>

                                                <span>
                                                    {count}
                                                </span>

                                            </div>

                                            <div className="admin-status-progress-row">

                                                <div className="admin-status-track">
                                                    <div
                                                        className={
                                                            `admin-status-progress ${status.toLowerCase()}`
                                                        }
                                                        style={{
                                                            width: `${percent}%`
                                                        }}
                                                    />
                                                </div>

                                                <span>
                                                    {percent}%
                                                </span>

                                            </div>
                                        </div>
                                    );
                                })}

                            </div>
                        </section>

                        <section className="admin-panel-card">
                            <div className="admin-panel-card-heading">
                                <div>
                                    <span>USERS</span>
                                    <h2>Accounts by role</h2>
                                </div>
                            </div>

                            <div className="admin-role-breakdown">

                                <RoleRow
                                    label="Pet owners"
                                    role="OWNER"
                                    value={roleCounts.OWNER}
                                    total={data.users.length}
                                />

                                <RoleRow
                                    label="Veterinarians"
                                    role="VETERINARIAN"
                                    value={roleCounts.VETERINARIAN}
                                    total={data.users.length}
                                />

                                <RoleRow
                                    label="Administrators"
                                    role="ADMIN"
                                    value={roleCounts.ADMIN}
                                    total={data.users.length}
                                />

                            </div>

                            <div className="admin-role-total">
                                <span>Total accounts</span>
                                <strong>{data.users.length}</strong>
                            </div>
                        </section>

                    </div>

                    <section className="admin-users-section">

                        <div className="admin-users-heading">
                            <div>
                                <span>USER MANAGEMENT</span>
                                <h2>Registered accounts</h2>

                                <p>
                                    Search accounts and open a user to view or manage their information.
                                </p>
                            </div>

                            <strong>
                                {filteredUsers.length}
                                {' '}
                                {filteredUsers.length === 1
                                    ? 'account'
                                    : 'accounts'}
                            </strong>
                        </div>

                        <div className="admin-users-toolbar">

                            <div className="admin-users-search">
                                <span>⌕</span>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={e =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search username, email or phone..."
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            <div className="admin-role-filter">

                                <button
                                    type="button"
                                    className={
                                        roleFilter === 'ALL'
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() =>
                                        setRoleFilter('ALL')
                                    }
                                >
                                    All
                                </button>

                                <button
                                    type="button"
                                    className={
                                        roleFilter === 'OWNER'
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() =>
                                        setRoleFilter('OWNER')
                                    }
                                >
                                    Owners
                                </button>

                                <button
                                    type="button"
                                    className={
                                        roleFilter === 'VETERINARIAN'
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() =>
                                        setRoleFilter('VETERINARIAN')
                                    }
                                >
                                    Veterinarians
                                </button>

                                <button
                                    type="button"
                                    className={
                                        roleFilter === 'ADMIN'
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() =>
                                        setRoleFilter('ADMIN')
                                    }
                                >
                                    Admins
                                </button>

                            </div>

                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="admin-users-empty">
                                <div>⌕</div>

                                <h3>No accounts found</h3>

                                <p>
                                    Try changing the search term or selected role.
                                </p>
                            </div>
                        ) : (
                            <div className="admin-users-table-wrapper">

                                <table className="admin-users-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr
                                                key={user.id}
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/users/${user.id}`
                                                    )
                                                }
                                            >
                                                <td>
                                                    <div className="admin-user-cell">

                                                        <div className="admin-user-avatar">
                                                            {user.username
                                                                ?.charAt(0)
                                                                ?.toUpperCase() || 'U'}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {user.username}
                                                            </strong>

                                                            <span>
                                                                VETApp account
                                                            </span>
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    {user.email || '—'}
                                                </td>

                                                <td>
                                                    {user.telefon || '—'}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            `admin-user-role ${user.role?.toLowerCase()}`
                                                        }
                                                    >
                                                        {formatRole(
                                                            user.role
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="admin-user-arrow">
                                                        →
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </div>
                        )}

                    </section>

                </div>
            </main>
        </>
    );
}

function StatCard({ label, value, text }) {
    return (
        <div className="admin-panel-stat">
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{text}</p>
        </div>
    );
}

function RoleRow({ label, role, value, total }) {
    const percentage =
        total > 0
            ? Math.round((value / total) * 100)
            : 0;

    return (
        <div className="admin-role-row">

            <div className="admin-role-row-heading">
                <div>
                    <span
                        className={
                            `admin-role-dot ${role.toLowerCase()}`
                        }
                    />

                    <strong>{label}</strong>
                </div>

                <span>{value}</span>
            </div>

            <div className="admin-role-progress-row">

                <div className="admin-role-track">
                    <div
                        className={
                            `admin-role-progress ${role.toLowerCase()}`
                        }
                        style={{
                            width: `${percentage}%`
                        }}
                    />
                </div>

                <span>{percentage}%</span>

            </div>

        </div>
    );
}