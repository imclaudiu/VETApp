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
    const [data, setData] = useState({
        users: [],
        pets: [],
        clinics: [],
        veterinarians: [],
        appointments: []
    });

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError(null);
                setData(await getAdminDashboardData());
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load admin dashboard.'
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

    const roleCounts = useMemo(() => {
        return {
            OWNER: data.users.filter(user => user.role === 'OWNER').length,
            VETERINARIAN: data.users.filter(user => user.role === 'VETERINARIAN').length,
            ADMIN: data.users.filter(user => user.role === 'ADMIN').length
        };
    }, [data.users]);

    const percentage = count => {
        if (!data.appointments.length) return 0;
        return Math.round((count / data.appointments.length) * 100);
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="admin-dashboard-loading">
                    Loading dashboard...
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="admin-dashboard-page">
                <div className="admin-dashboard-container">

                    <section className="admin-dashboard-header">
                        <div>
                            <p>ADMINISTRATION</p>
                            <h1>Platform overview</h1>
                            <span>
                                Monitor users, clinics, patients and appointments.
                            </span>
                        </div>

                        <Link
                            to="/admin/clinics"
                            className="admin-manage-clinics"
                        >
                            Manage clinics
                        </Link>
                    </section>

                    {error && (
                        <div className="admin-dashboard-error">
                            {error}
                        </div>
                    )}

                    <section className="admin-stats-grid">
                        <StatCard label="USERS" value={data.users.length} text="Registered accounts" />
                        <StatCard label="PETS" value={data.pets.length} text="Registered patients" />
                        <StatCard label="CLINICS" value={data.clinics.length} text="Veterinary clinics" />
                        <StatCard label="VETERINARIANS" value={data.veterinarians.length} text="Registered doctors" />
                        <StatCard label="APPOINTMENTS" value={data.appointments.length} text="Total appointments" />
                    </section>

                    <section className="admin-dashboard-grid">

                        <div className="admin-dashboard-panel">
                            <div className="admin-panel-heading">
                                <div>
                                    <p>APPOINTMENTS</p>
                                    <h2>Status overview</h2>
                                </div>
                            </div>

                            <div className="admin-status-list">
                                {STATUSES.map(status => (
                                    <div
                                        key={status}
                                        className="admin-status-row"
                                    >
                                        <div className="admin-status-info">
                                            <span className={`admin-status-dot ${status.toLowerCase()}`} />

                                            <strong>
                                                {status.replace('_', ' ')}
                                            </strong>

                                            <span>
                                                {appointmentCounts[status]}
                                            </span>
                                        </div>

                                        <div className="admin-progress-track">
                                            <div
                                                className={`admin-progress-value ${status.toLowerCase()}`}
                                                style={{
                                                    width: `${percentage(appointmentCounts[status])}%`
                                                }}
                                            />
                                        </div>

                                        <small>
                                            {percentage(appointmentCounts[status])}%
                                        </small>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="admin-dashboard-panel">
                            <div className="admin-panel-heading">
                                <div>
                                    <p>USERS</p>
                                    <h2>Accounts by role</h2>
                                </div>
                            </div>

                            <div className="admin-role-list">
                                <RoleCard label="Pet owners" value={roleCounts.OWNER} />
                                <RoleCard label="Veterinarians" value={roleCounts.VETERINARIAN} />
                                <RoleCard label="Administrators" value={roleCounts.ADMIN} />
                            </div>
                        </div>

                    </section>

                    <section className="admin-dashboard-panel admin-users-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <p>USERS</p>
                                <h2>Registered accounts</h2>
                            </div>

                            <span>{data.users.length} total</span>
                        </div>

                        <div className="admin-users-table-wrapper">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.users.map(user => (
                                        <tr
                                            key={user.id}
                                            className="admin-user-row"
                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                        >
                                            <td>
                                                <strong>{user.username}</strong>
                                            </td>

                                            <td>{user.email}</td>

                                            <td>{user.telefon || '—'}</td>

                                            <td>
                                                <span className={`admin-role-badge ${user.role?.toLowerCase()}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>
            </main>
        </>
    );
}

function StatCard({ label, value, text }) {
    return (
        <div className="admin-stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <p>{text}</p>
        </div>
    );
}

function RoleCard({ label, value }) {
    return (
        <div className="admin-role-card">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}