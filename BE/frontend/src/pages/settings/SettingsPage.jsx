import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import {
    useAuth
} from '../../features/auth/contexts/AuthContext';

import {
    changePassword,
    deleteAccount
} from '../../features/auth/services/authService';

import {
    getMyProfile,
    updateMyProfile
} from '../../features/user/services/userService';

import './SettingsPage.css';


const EMPTY_PROFILE = {
    name: '',
    email: '',
    phone: '',
    address: ''
};


export default function SettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [profileForm, setProfileForm] =
        useState(EMPTY_PROFILE);

    const [profileLoading, setProfileLoading] =
        useState(true);

    const [profileSaving, setProfileSaving] =
        useState(false);

    const [profileError, setProfileError] =
        useState('');

    const [profileSuccess, setProfileSuccess] =
        useState('');


    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordLoading, setPasswordLoading] =
        useState(false);

    const [passwordError, setPasswordError] =
        useState('');

    const [passwordSuccess, setPasswordSuccess] =
        useState('');


    const [deleteModalOpen, setDeleteModalOpen] =
        useState(false);

    const [deleteText, setDeleteText] =
        useState('');

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState('');


    useEffect(() => {
        const loadProfile = async () => {
            try {
                setProfileLoading(true);
                setProfileError('');

                const data =
                    await getMyProfile();

                setProfile(data);

                setProfileForm({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || ''
                });

            } catch (err) {
                setProfileError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not load profile.'
                );
            } finally {
                setProfileLoading(false);
            }
        };

        loadProfile();
    }, []);


    const handleProfileChange = event => {
        const { name, value } = event.target;

        setProfileForm(current => ({
            ...current,
            [name]: value
        }));

        setProfileSuccess('');
    };


    const resetProfile = () => {
        if (!profile) return;

        setProfileForm({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || ''
        });

        setProfileError('');
        setProfileSuccess('');
    };


    const handleProfileSave = async event => {
        event.preventDefault();

        if (!profile?.id) {
            setProfileError(
                'Could not identify your profile.'
            );

            return;
        }

        if (
            !profileForm.name.trim() ||
            !profileForm.email.trim() ||
            !profileForm.phone.trim() ||
            !profileForm.address.trim()
        ) {
            setProfileError(
                'All profile fields are required.'
            );

            return;
        }

        try {
            setProfileSaving(true);
            setProfileError('');
            setProfileSuccess('');

            const updated =
                await updateMyProfile(
                    profile.id,
                    {
                        name: profileForm.name.trim(),
                        email: profileForm.email.trim(),
                        phone: profileForm.phone.trim(),
                        address: profileForm.address.trim()
                    }
                );

            setProfile(updated);

            setProfileForm({
                name: updated.name || '',
                email: updated.email || '',
                phone: updated.phone || '',
                address: updated.address || ''
            });

            setProfileSuccess(
                'Profile updated successfully.'
            );

        } catch (err) {
            setProfileError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not update profile.'
            );
        } finally {
            setProfileSaving(false);
        }
    };


    const handlePasswordChange = event => {
        const { name, value } = event.target;

        setPasswordForm(current => ({
            ...current,
            [name]: value
        }));

        setPasswordError('');
        setPasswordSuccess('');
    };


    const handleChangePassword = async event => {
        event.preventDefault();

        setPasswordError('');
        setPasswordSuccess('');

        if (
            passwordForm.newPassword.length < 8
        ) {
            setPasswordError(
                'New password must contain at least 8 characters.'
            );

            return;
        }

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            setPasswordError(
                'The new passwords do not match.'
            );

            return;
        }

        if (
            passwordForm.currentPassword ===
            passwordForm.newPassword
        ) {
            setPasswordError(
                'The new password must be different from the current password.'
            );

            return;
        }

        try {
            setPasswordLoading(true);

            await changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setPasswordSuccess(
                'Password changed successfully.'
            );

        } catch (err) {
            if (err.response?.status === 401) {
                setPasswordError(
                    'Your current password is incorrect.'
                );
            } else {
                setPasswordError(
                    err.response?.data?.detail ||
                    err.response?.data?.message ||
                    err.message ||
                    'Could not change password.'
                );
            }
        } finally {
            setPasswordLoading(false);
        }
    };


    const openDeleteModal = () => {
        setDeleteText('');
        setDeleteError('');
        setDeleteModalOpen(true);
    };


    const closeDeleteModal = () => {
        if (deleteLoading) return;

        setDeleteModalOpen(false);
        setDeleteText('');
        setDeleteError('');
    };


    const handleDeleteAccount = async () => {
        if (deleteText !== 'DELETE') {
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError('');

            await deleteAccount();

            logout();

            navigate(
                '/login',
                { replace: true }
            );

        } catch (err) {
            setDeleteError(
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                'Could not delete account.'
            );
        } finally {
            setDeleteLoading(false);
        }
    };


    const formatRole = role => {
        if (role === 'OWNER') {
            return 'Pet owner';
        }

        if (role === 'VETERINARIAN') {
            return 'Veterinarian';
        }

        if (role === 'ADMIN') {
            return 'Administrator';
        }

        return role || '—';
    };


    const profileChanged =
        profile &&
        (
            profileForm.name !==
            (profile.name || '') ||

            profileForm.email !==
            (profile.email || '') ||

            profileForm.phone !==
            (profile.phone || '') ||

            profileForm.address !==
            (profile.address || '')
        );


    return (
        <>
            <Navbar />

            <main className="settings-page">

                <div className="settings-container">

                    {/* HEADER */}

                    <header className="settings-header">

                        <div>
                            <span>
                                ACCOUNT
                            </span>

                            <h1>
                                Settings
                            </h1>

                            <p>
                                Manage your profile, security and VETApp account.
                            </p>
                        </div>

                        <div className="settings-header-user">

                            <div className="settings-header-avatar">
                                {profile?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    user?.username
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                    'U'}
                            </div>

                            <div>
                                <strong>
                                    {profile?.name ||
                                        user?.username}
                                </strong>

                                <span>
                                    @{user?.username}
                                </span>
                            </div>

                        </div>

                    </header>


                    {/* PROFILE */}

                    <section className="settings-card">

                        <div className="settings-card-heading">

                            <div>
                                <span>
                                    PROFILE
                                </span>

                                <h2>
                                    Personal information
                                </h2>

                                <p>
                                    Update the contact information associated with your profile.
                                </p>
                            </div>

                            <span
                                className={
                                    `settings-role-badge ${user?.role?.toLowerCase()}`
                                }
                            >
                                {formatRole(user?.role)}
                            </span>

                        </div>


                        {profileLoading ? (

                            <div className="settings-loading">

                                <div className="settings-spinner" />

                                <span>
                                    Loading profile...
                                </span>

                            </div>

                        ) : (

                            <form
                                onSubmit={handleProfileSave}
                            >

                                {profileError && (
                                    <Message
                                        type="error"
                                        text={profileError}
                                    />
                                )}

                                {profileSuccess && (
                                    <Message
                                        type="success"
                                        text={profileSuccess}
                                    />
                                )}


                                <div className="settings-readonly-grid">

                                    <div className="settings-readonly-field">

                                        <span>
                                            USERNAME
                                        </span>

                                        <strong>
                                            @{user?.username || '—'}
                                        </strong>

                                    </div>


                                    <div className="settings-readonly-field">

                                        <span>
                                            ACCOUNT ROLE
                                        </span>

                                        <strong>
                                            {formatRole(
                                                user?.role
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                <div className="settings-form-grid">

                                    <Field
                                        label="Full name"
                                        name="name"
                                        value={profileForm.name}
                                        onChange={
                                            handleProfileChange
                                        }
                                        autoComplete="name"
                                    />


                                    <Field
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={
                                            handleProfileChange
                                        }
                                        autoComplete="email"
                                    />


                                    <Field
                                        label="Phone"
                                        name="phone"
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={
                                            handleProfileChange
                                        }
                                        autoComplete="tel"
                                    />


                                    <Field
                                        label="Address"
                                        name="address"
                                        value={profileForm.address}
                                        onChange={
                                            handleProfileChange
                                        }
                                        autoComplete="street-address"
                                    />

                                </div>


                                <div className="settings-form-actions">

                                    <button
                                        type="button"
                                        className="secondary-button"
                                        disabled={
                                            !profileChanged ||
                                            profileSaving
                                        }
                                        onClick={resetProfile}
                                    >
                                        Reset
                                    </button>


                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            !profileChanged ||
                                            profileSaving
                                        }
                                    >
                                        {profileSaving
                                            ? 'Saving...'
                                            : 'Save changes'}
                                    </button>

                                </div>

                            </form>

                        )}

                    </section>


                    {/* SECURITY */}

                    <section className="settings-card">

                        <div className="settings-card-heading">

                            <div>
                                <span>
                                    SECURITY
                                </span>

                                <h2>
                                    Change password
                                </h2>

                                <p>
                                    Use at least 8 characters for your new password.
                                </p>
                            </div>

                        </div>


                        <form
                            className="settings-password-form"
                            onSubmit={
                                handleChangePassword
                            }
                        >

                            {passwordError && (
                                <Message
                                    type="error"
                                    text={passwordError}
                                />
                            )}

                            {passwordSuccess && (
                                <Message
                                    type="success"
                                    text={passwordSuccess}
                                />
                            )}


                            <div className="settings-password-grid">

                                <Field
                                    label="Current password"
                                    name="currentPassword"
                                    type="password"
                                    value={
                                        passwordForm.currentPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="current-password"
                                />


                                <Field
                                    label="New password"
                                    name="newPassword"
                                    type="password"
                                    value={
                                        passwordForm.newPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                />


                                <Field
                                    label="Confirm new password"
                                    name="confirmPassword"
                                    type="password"
                                    value={
                                        passwordForm.confirmPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                />

                            </div>


                            <div className="settings-password-note">

                                <div>
                                    ✓
                                </div>

                                <p>
                                    Changing your password does not change your username or account role.
                                </p>

                            </div>


                            <div className="settings-form-actions">

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        passwordLoading ||
                                        !passwordForm.currentPassword ||
                                        !passwordForm.newPassword ||
                                        !passwordForm.confirmPassword
                                    }
                                >
                                    {passwordLoading
                                        ? 'Changing...'
                                        : 'Change password'}
                                </button>

                            </div>

                        </form>

                    </section>


                    {/* DANGER */}

                    <section className="settings-danger-card">

                        <div>

                            <span>
                                DANGER ZONE
                            </span>

                            <h2>
                                Delete account
                            </h2>

                            <p>
                                Permanently remove your VETApp account and associated access.
                                This action cannot be undone.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="settings-delete-trigger"
                            onClick={openDeleteModal}
                        >
                            Delete account
                        </button>

                    </section>


                    <p className="settings-signed-in">
                        Signed in as{' '}
                        <strong>
                            @{user?.username}
                        </strong>
                    </p>

                </div>

            </main>


            {/* DELETE MODAL */}

            {deleteModalOpen && (

                <div
                    className="settings-modal-backdrop"
                    onMouseDown={
                        closeDeleteModal
                    }
                >

                    <div
                        className="settings-delete-modal"
                        onMouseDown={event =>
                            event.stopPropagation()
                        }
                    >

                        <span className="settings-modal-label">
                            DELETE ACCOUNT
                        </span>

                        <h2>
                            Permanently delete your account?
                        </h2>

                        <p>
                            This action cannot be undone.
                            Type <strong>DELETE</strong> below
                            to confirm.
                        </p>


                        <div className="settings-delete-account">

                            <div className="settings-delete-avatar">
                                {profile?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    'U'}
                            </div>

                            <div>
                                <strong>
                                    {profile?.name ||
                                        user?.username}
                                </strong>

                                <span>
                                    @{user?.username} ·{' '}
                                    {formatRole(user?.role)}
                                </span>
                            </div>

                        </div>


                        {deleteError && (
                            <Message
                                type="error"
                                text={deleteError}
                            />
                        )}


                        <div className="settings-delete-confirm-field">

                            <label>
                                Confirmation
                            </label>

                            <input
                                type="text"
                                value={deleteText}
                                onChange={event =>
                                    setDeleteText(
                                        event.target.value
                                    )
                                }
                                placeholder="Type DELETE"
                                autoComplete="off"
                                autoFocus
                            />

                        </div>


                        <div className="settings-modal-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                disabled={deleteLoading}
                                onClick={
                                    closeDeleteModal
                                }
                            >
                                Keep account
                            </button>


                            <button
                                type="button"
                                className="settings-delete-confirm-button"
                                disabled={
                                    deleteText !== 'DELETE' ||
                                    deleteLoading
                                }
                                onClick={
                                    handleDeleteAccount
                                }
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


function Field({
    label,
    name,
    type = 'text',
    value,
    onChange,
    autoComplete,
    minLength
}) {
    return (
        <div className="settings-field">

            <label htmlFor={`settings-${name}`}>
                {label}
            </label>

            <input
                id={`settings-${name}`}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                minLength={minLength}
                required
            />

        </div>
    );
}


function Message({ type, text }) {
    return (
        <div
            className={
                `settings-message ${type}`
            }
        >
            {text}
        </div>
    );
}