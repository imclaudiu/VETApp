import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { getAdminAccount } from '../../features/account/services/accountService';

import './AccountProfilePage.css';

export default function AdminAccountPage() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAccount = async () => {
            try {
                setAccount(await getAdminAccount(userId));
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

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="account-profile-state">Loading account...</div>
            </>
        );
    }

    if (error || !account) {
        return (
            <>
                <Navbar />
                <div className="account-profile-state account-profile-error">
                    {error || 'Account not found.'}
                </div>
            </>
        );
    }

    const profile = account.profile;

    return (
        <>
            <Navbar />

            <main className="account-profile-page">
                <div className="account-profile-container">

                    <button
                        type="button"
                        className="account-profile-back"
                        onClick={() => navigate('/admin')}
                    >
                        ← Back to admin panel
                    </button>

                    <section className="account-profile-card">

                        <div className="account-profile-header">
                            <div className="account-profile-avatar">
                                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>

                            <div>
                                <p>USER ACCOUNT</p>
                                <h1>{profile?.name || account.username}</h1>
                                <span>@{account.username}</span>
                            </div>

                            <span className={`account-role-badge ${account.role?.toLowerCase()}`}>
                                {account.role}
                            </span>
                        </div>

                        <div className="account-profile-section">
                            <p className="account-profile-label">ACCOUNT INFORMATION</p>

                            <div className="account-profile-grid">
                                <Info label="Username" value={account.username} />
                                <Info label="Role" value={account.role} />
                                <Info label="Email" value={profile?.email || account.email} />
                                <Info label="Phone" value={profile?.phone || account.telefon} />
                                <Info label="Address" value={profile?.address} />
                                <Info label="User ID" value={account.id} />
                            </div>
                        </div>

                    </section>
                </div>
            </main>
        </>
    );
}

function Info({ label, value }) {
    return (
        <div className="account-profile-info">
            <span>{label}</span>
            <strong>{value || '—'}</strong>
        </div>
    );
}