import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { useAuth } from '../../features/auth/contexts/AuthContext';

import {
    getAdminAccount,
    updateAdminAccountRole,
    deleteAdminAccount
} from '../../features/account/services/accountService';

import './AdminAccountPage.css';

export default function AdminAccountPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [account, setAccount] = useState(null);

    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingRole, setSavingRole] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        const loadAccount = async () => {
            try {
                setLoading(true);
                setError('');

                const data = await getAdminAccount(userId);

                setAccount(data);
                setSelectedRole(data.role);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load account.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadAccount();
    }, [userId]);

    const profile = account?.profile;

    const formatRole = role => {
        if (role === 'OWNER') return 'Pet owner';
        if (role === 'VETERINARIAN') return 'Veterinarian';
        if (role === 'ADMIN') return 'Administrator';

        return role || 'Unknown';
    };

    const handleRoleSave = async () => {
        if (!account || selectedRole === account.role) return;

        try {
            setSavingRole(true);
            setError('');
            setSuccess('');

            await updateAdminAccountRole(
                account.id,
                selectedRole
            );

            setAccount(current => ({
                ...current,
                role: selectedRole
            }));

            setSuccess('User role updated successfully.');
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not update user role.'
            );
        } finally {
            setSavingRole(false);
        }
    };

    const handleDelete = async () => {
        if (!account) return;

        try {
            setDeleting(true);
            setError('');

            await deleteAdminAccount(account.id);

            navigate('/admin', {
                replace: true
            });
        } catch (err) {
            setDeleteModalOpen(false);

            setError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not delete account.'
            );
        } finally {
            setDeleting(false);
        }
    };

    const isOwnAccount =
        user?.userId &&
        account?.id &&
        String(user.userId) === String(account.id);

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="admin-account-page">
                    <div className="admin-account-loading">
                        <div className="admin-account-spinner" />
                        <p>Loading account...</p>
                    </div>
                </main>
            </>
        );
    }

    if (!account) {
        return (
            <>
                <Navbar />

                <main className="admin-account-page">
                    <div className="admin-account-container">

                        <div className="admin-account-load-error">
                            <h2>Account unavailable</h2>

                            <p>
                                {error || 'This account could not be found.'}
                            </p>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => navigate('/admin')}
                            >
                                Back to users
                            </button>
                        </div>

                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="admin-account-page">
                <div className="admin-account-container">

                    <button
                        type="button"
                        className="admin-account-back"
                        onClick={() => navigate('/admin')}
                    >
                        ← Back to user management
                    </button>

                    <header className="admin-account-header">

                        <div className="admin-account-avatar">
                            {profile?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                account.username
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                'U'}
                        </div>

                        <div className="admin-account-heading">

                            <span>USER ACCOUNT</span>

                            <h1>
                                {profile?.name ||
                                    account.username}
                            </h1>

                            <p>
                                @{account.username}
                            </p>

                        </div>

                        <span
                            className={
                                `admin-account-role-badge ${account.role?.toLowerCase()}`
                            }
                        >
                            {formatRole(account.role)}
                        </span>

                    </header>

                    {error && (
                        <div className="admin-account-message error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="admin-account-message success">
                            {success}
                        </div>
                    )}

                    <div className="admin-account-layout">

                        <div className="admin-account-main">

                            <section className="admin-account-section">

                                <div className="admin-account-section-heading">
                                    <span>PROFILE</span>

                                    <h2>Personal information</h2>

                                    <p>
                                        Contact and profile details stored for this account.
                                    </p>
                                </div>

                                <div className="admin-account-info-grid">

                                    <Info
                                        label="Full name"
                                        value={profile?.name}
                                    />

                                    <Info
                                        label="Username"
                                        value={account.username}
                                    />

                                    <Info
                                        label="Email"
                                        value={
                                            profile?.email ||
                                            account.email
                                        }
                                    />

                                    <Info
                                        label="Phone"
                                        value={
                                            profile?.phone ||
                                            account.telefon
                                        }
                                    />

                                    <Info
                                        label="Address"
                                        value={profile?.address}
                                        full
                                    />

                                </div>

                            </section>

                            <section className="admin-account-section">

                                <div className="admin-account-section-heading">
                                    <span>ACCESS</span>

                                    <h2>Role management</h2>

                                    <p>
                                        Control which area of VETApp this account can access.
                                    </p>
                                </div>

                                <div className="admin-role-editor">

                                    <div className="admin-role-current">

                                        <span>CURRENT ROLE</span>

                                        <strong>
                                            {formatRole(account.role)}
                                        </strong>

                                    </div>

                                    <div className="admin-role-options">

                                        <RoleOption
                                            role="OWNER"
                                            title="Pet owner"
                                            description="Can manage pets, appointments, clinics and medical history."
                                            selected={
                                                selectedRole === 'OWNER'
                                            }
                                            onSelect={() =>
                                                setSelectedRole('OWNER')
                                            }
                                        />

                                        <RoleOption
                                            role="VETERINARIAN"
                                            title="Veterinarian"
                                            description="Can manage veterinary appointments, availability and consultations."
                                            selected={
                                                selectedRole === 'VETERINARIAN'
                                            }
                                            onSelect={() =>
                                                setSelectedRole('VETERINARIAN')
                                            }
                                        />

                                        <RoleOption
                                            role="ADMIN"
                                            title="Administrator"
                                            description="Has access to platform administration and account management."
                                            selected={
                                                selectedRole === 'ADMIN'
                                            }
                                            onSelect={() =>
                                                setSelectedRole('ADMIN')
                                            }
                                        />

                                    </div>

                                    {selectedRole === 'VETERINARIAN' &&
                                        account.role !== 'VETERINARIAN' && (
                                            <div className="admin-role-warning">

                                                <strong>
                                                    Veterinarian profile required
                                                </strong>

                                                <p>
                                                    Changing the authentication role does not automatically assign this user to a veterinary clinic. A veterinarian record must also exist for the account.
                                                </p>

                                            </div>
                                        )}

                                    <div className="admin-role-actions">

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            disabled={
                                                selectedRole === account.role ||
                                                savingRole
                                            }
                                            onClick={() =>
                                                setSelectedRole(account.role)
                                            }
                                        >
                                            Reset
                                        </button>

                                        <button
                                            type="button"
                                            className="primary-button"
                                            disabled={
                                                selectedRole === account.role ||
                                                savingRole
                                            }
                                            onClick={handleRoleSave}
                                        >
                                            {savingRole
                                                ? 'Saving...'
                                                : 'Save role'}
                                        </button>

                                    </div>

                                </div>

                            </section>

                            {!isOwnAccount && (
                                <section className="admin-account-danger">

                                    <div>
                                        <span>DANGER ZONE</span>

                                        <h2>Delete account</h2>

                                        <p>
                                            Permanently remove this user account from VETApp.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeleteModalOpen(true)
                                        }
                                    >
                                        Delete account
                                    </button>

                                </section>
                            )}

                        </div>

                        <aside className="admin-account-sidebar">

                            <section className="admin-account-summary">

                                <span>ACCOUNT SUMMARY</span>

                                <div className="admin-account-summary-avatar">
                                    {profile?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        account.username
                                            ?.charAt(0)
                                            ?.toUpperCase() ||
                                        'U'}
                                </div>

                                <h2>
                                    {profile?.name ||
                                        account.username}
                                </h2>

                                <p>
                                    @{account.username}
                                </p>

                                <div className="admin-account-summary-divider" />

                                <SummaryRow
                                    label="Role"
                                    value={formatRole(account.role)}
                                />

                                <SummaryRow
                                    label="Email"
                                    value={
                                        profile?.email ||
                                        account.email ||
                                        '—'
                                    }
                                />

                                <SummaryRow
                                    label="Phone"
                                    value={
                                        profile?.phone ||
                                        account.telefon ||
                                        '—'
                                    }
                                />

                                {isOwnAccount && (
                                    <div className="admin-own-account-notice">
                                        This is your administrator account.
                                    </div>
                                )}

                            </section>

                        </aside>

                    </div>

                </div>
            </main>

            {deleteModalOpen && (
                <div
                    className="admin-account-modal-backdrop"
                    onMouseDown={() => {
                        if (!deleting) {
                            setDeleteModalOpen(false);
                        }
                    }}
                >
                    <div
                        className="admin-account-modal"
                        onMouseDown={e =>
                            e.stopPropagation()
                        }
                    >
                        <span>DELETE ACCOUNT</span>

                        <h2>
                            Delete {profile?.name || account.username}?
                        </h2>

                        <p>
                            This action permanently removes the account and cannot be undone.
                        </p>

                        <div className="admin-account-modal-user">

                            <div>
                                {profile?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    'U'}
                            </div>

                            <div>
                                <strong>
                                    {profile?.name ||
                                        account.username}
                                </strong>

                                <span>
                                    @{account.username} · {formatRole(account.role)}
                                </span>
                            </div>

                        </div>

                        <div className="admin-account-modal-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                disabled={deleting}
                                onClick={() =>
                                    setDeleteModalOpen(false)
                                }
                            >
                                Keep account
                            </button>

                            <button
                                type="button"
                                className="admin-account-delete-confirm"
                                disabled={deleting}
                                onClick={handleDelete}
                            >
                                {deleting
                                    ? 'Deleting...'
                                    : 'Delete account'}
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </>
    );
}

function Info({ label, value, full = false }) {
    return (
        <div
            className={
                `admin-account-info${full ? ' full' : ''}`
            }
        >
            <span>{label}</span>
            <strong>{value || '—'}</strong>
        </div>
    );
}

function RoleOption({
    role,
    title,
    description,
    selected,
    onSelect
}) {
    return (
        <button
            type="button"
            className={
                `admin-role-option${selected ? ' selected' : ''}`
            }
            onClick={onSelect}
        >
            <div
                className={
                    `admin-role-option-icon ${role.toLowerCase()}`
                }
            >
                {role === 'OWNER'
                    ? 'O'
                    : role === 'VETERINARIAN'
                        ? 'V'
                        : 'A'}
            </div>

            <div>
                <strong>{title}</strong>
                <p>{description}</p>
            </div>

            <span className="admin-role-radio">
                {selected && <span />}
            </span>
        </button>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="admin-account-summary-row">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}