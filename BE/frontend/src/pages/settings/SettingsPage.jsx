import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { useAuth } from '../../features/auth/contexts/AuthContext';

import {
    changePassword,
    deleteAccount
} from '../../features/auth/services/authService';

import {
    getMyProfile,
    updateMyProfile
} from '../../features/user/services/userService';

import './SettingsPage.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    const [deleteText, setDeleteText] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setProfileLoading(true);
                setProfileError(null);

                const data = await getMyProfile();

                setProfile(data);

                setProfileForm({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || ''
                });
            } catch (err) {
                setProfileError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    err.message ||
                    'Could not load profile information.'
                );
            } finally {
                setProfileLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleProfileChange = e => {
        const { name, value } = e.target;

        setProfileForm(current => ({
            ...current,
            [name]: value
        }));

        setProfileSuccess(null);
        setProfileError(null);
    };

    const handleSaveProfile = async e => {
        e.preventDefault();

        if (!profileForm.name.trim()) {
            setProfileError('Name is required.');
            return;
        }

        if (!profileForm.email.trim()) {
            setProfileError('Email is required.');
            return;
        }

        try {
            setProfileSaving(true);
            setProfileError(null);
            setProfileSuccess(null);

            const updated = await updateMyProfile(profile.id, {
                name: profileForm.name.trim(),
                email: profileForm.email.trim(),
                phone: profileForm.phone.trim(),
                address: profileForm.address.trim()
            });

            setProfile(updated);

            setProfileForm({
                name: updated.name || '',
                email: updated.email || '',
                phone: updated.phone || '',
                address: updated.address || ''
            });

            setProfileSuccess('Profile updated successfully.');
        } catch (err) {
            setProfileError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'Could not update profile.'
            );
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = e => {
        const { name, value } = e.target;

        setPasswordForm(current => ({
            ...current,
            [name]: value
        }));

        setPasswordError(null);
        setPasswordSuccess(null);
    };

    const handleChangePassword = async e => {
        e.preventDefault();

        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must contain at least 8 characters.');
            return;
        }

        if (passwordForm.currentPassword === passwordForm.newPassword) {
            setPasswordError('New password must be different from your current password.');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('The new passwords do not match.');
            return;
        }

        try {
            setPasswordLoading(true);

            await changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );

            setPasswordSuccess('Password changed successfully.');

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            if (err.response?.status === 401) {
                setPasswordError('Your current password is incorrect.');
            } else {
                setPasswordError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    err.message ||
                    'Could not change password.'
                );
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteText !== 'DELETE') return;

        try {
            setDeleteLoading(true);
            setDeleteError(null);

            await deleteAccount();

            logout();
            navigate('/login', { replace: true });
        } catch (err) {
            setDeleteError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.message ||
                'Could not delete account.'
            );

            setDeleteModalOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <Navbar />

            <main className="settings-page">
                <div className="settings-container">

                    <header className="settings-header">
                        <span>ACCOUNT</span>
                        <h1>Settings</h1>
                        <p>Manage your personal information, password and account.</p>
                    </header>

                    <section className="settings-section">
                        <div className="settings-section-heading">
                            <div>
                                <span>PROFILE</span>
                                <h2>Personal information</h2>
                                <p>Update the information associated with your VETApp account.</p>
                            </div>

                            <div className="settings-account-badge">
                                <div className="settings-avatar">
                                    {(profile?.name || user?.username || 'U')
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <strong>{user?.username}</strong>
                                    <span>{user?.role}</span>
                                </div>
                            </div>
                        </div>

                        {profileLoading ? (
                            <div className="settings-loading">
                                Loading profile...
                            </div>
                        ) : (
                            <form
                                className="settings-profile-form"
                                onSubmit={handleSaveProfile}
                            >
                                {profileError && (
                                    <div className="settings-message error">
                                        {profileError}
                                    </div>
                                )}

                                {profileSuccess && (
                                    <div className="settings-message success">
                                        {profileSuccess}
                                    </div>
                                )}

                                <div className="settings-form-row">
                                    <div className="settings-field">
                                        <label>Username</label>

                                        <input
                                            type="text"
                                            value={user?.username || ''}
                                            disabled
                                        />

                                        <small>Username cannot be changed.</small>
                                    </div>

                                    <div className="settings-field">
                                        <label>Role</label>

                                        <input
                                            type="text"
                                            value={
                                                user?.role
                                                    ? user.role.charAt(0) +
                                                    user.role.slice(1).toLowerCase()
                                                    : ''
                                            }
                                            disabled
                                        />

                                        <small>Your account role is managed by VETApp.</small>
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <div className="settings-field">
                                        <label>Full name</label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={profileForm.name}
                                            onChange={handleProfileChange}
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>

                                    <div className="settings-field">
                                        <label>Email</label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={profileForm.email}
                                            onChange={handleProfileChange}
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <div className="settings-field">
                                        <label>Phone</label>

                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profileForm.phone}
                                            onChange={handleProfileChange}
                                            placeholder="07..."
                                        />
                                    </div>

                                    <div className="settings-field">
                                        <label>Address</label>

                                        <input
                                            type="text"
                                            name="address"
                                            value={profileForm.address}
                                            onChange={handleProfileChange}
                                            placeholder="Your address"
                                        />
                                    </div>
                                </div>

                                <div className="settings-actions">
                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={profileSaving}
                                    >
                                        {profileSaving
                                            ? 'Saving...'
                                            : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>

                    <section className="settings-section">
                        <div className="settings-section-heading">
                            <div>
                                <span>SECURITY</span>
                                <h2>Change password</h2>
                                <p>Use a password with at least 8 characters.</p>
                            </div>
                        </div>

                        <form
                            className="settings-password-form"
                            onSubmit={handleChangePassword}
                        >
                            {passwordError && (
                                <div className="settings-message error">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="settings-message success">
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="settings-field">
                                <label>Current password</label>

                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            <div className="settings-form-row">
                                <div className="settings-field">
                                    <label>New password</label>

                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </div>

                                <div className="settings-field">
                                    <label>Confirm new password</label>

                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="settings-actions">
                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading
                                        ? 'Changing...'
                                        : 'Change password'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="settings-section settings-danger-section">
                        <div className="settings-section-heading">
                            <div>
                                <span className="danger">DANGER ZONE</span>
                                <h2>Delete account</h2>
                                <p>
                                    Permanently remove your VETApp account and associated account data.
                                </p>
                            </div>
                        </div>

                        {deleteError && (
                            <div className="settings-message error">
                                {deleteError}
                            </div>
                        )}

                        <div className="settings-delete-content">
                            <div>
                                <strong>Delete your account permanently</strong>
                                <p>
                                    This action cannot be undone. Your account will no longer be accessible.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="settings-danger-button"
                                onClick={() => {
                                    setDeleteText('');
                                    setDeleteError(null);
                                    setDeleteModalOpen(true);
                                }}
                            >
                                Delete account
                            </button>
                        </div>
                    </section>

                </div>
            </main>

            {deleteModalOpen && (
                <div
                    className="settings-modal-backdrop"
                    onMouseDown={() => {
                        if (!deleteLoading) setDeleteModalOpen(false);
                    }}
                >
                    <div
                        className="settings-modal"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <span>DELETE ACCOUNT</span>

                        <h2>Are you sure?</h2>

                        <p>
                            This action is permanent. Type <strong>DELETE</strong> to confirm that you want to remove your account.
                        </p>

                        <input
                            type="text"
                            value={deleteText}
                            onChange={e => setDeleteText(e.target.value)}
                            placeholder="Type DELETE"
                            autoFocus
                        />

                        <div className="settings-modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={deleteLoading}
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="settings-confirm-delete"
                                disabled={deleteText !== 'DELETE' || deleteLoading}
                                onClick={handleDeleteAccount}
                            >
                                {deleteLoading
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