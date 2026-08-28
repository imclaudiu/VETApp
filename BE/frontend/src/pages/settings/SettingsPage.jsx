import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { changePassword, deleteAccount } from '../../features/auth/services/authService';
import { getMyProfile } from '../../features/user/services/userService';

import './SettingsPage.css';


export default function SettingsPage() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [profileLoading, setProfileLoading] =
        useState(true);

    const [profileError, setProfileError] =
        useState(null);

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

    useEffect(() => {

        const loadProfile = async () => {

            try {

                setProfileLoading(true);
                setProfileError(null);

                const data =
                    await getMyProfile();

                setProfile(data);

            } catch (err) {

                console.error(
                    'Could not load profile:',
                    err
                );

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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPasswordForm(current => ({
            ...current,
            [name]: value
        }));
    };


    const handleChangePassword = async (e) => {
        e.preventDefault();

        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must contain at least 8 characters.');
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

        if (deleteText !== 'DELETE') {
            return;
        }

        const confirmed = window.confirm(
            'Are you sure you want to permanently delete your account?'
        );

        if (!confirmed) {
            return;
        }

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

        } finally {
            setDeleteLoading(false);
        }
    };


    return (
        <>
            <Navbar />

            <main className="settings-page">

                <div className="settings-container">

                    <section className="settings-header">
                        <p className="settings-eyebrow">ACCOUNT</p>
                        <h1>Settings</h1>
                        <p>Manage your account and security settings.</p>
                    </section>

                    <section className="settings-card">

                        <div className="settings-card-heading">

                            <div>

                                <p className="settings-section-label">
                                    PROFILE
                                </p>

                                <h2>
                                    Personal information
                                </h2>

                                <span>
                                    Your VETApp account information.
                                </span>

                            </div>

                        </div>


                        {profileLoading && (

                            <div className="settings-profile-loading">
                                Loading profile...
                            </div>

                        )}


                        {profileError && (

                            <div className="settings-message error">
                                {profileError}
                            </div>

                        )}


                        {!profileLoading && profile && (

                            <div className="settings-profile-grid">


                                <div className="settings-profile-field">

                                    <span>
                                        Username
                                    </span>

                                    <strong>
                                        {user?.username || '—'}
                                    </strong>

                                </div>


                                <div className="settings-profile-field">

                                    <span>
                                        Name
                                    </span>

                                    <strong>
                                        {profile.name || '—'}
                                    </strong>

                                </div>


                                <div className="settings-profile-field">

                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {profile.email || '—'}
                                    </strong>

                                </div>


                                <div className="settings-profile-field">

                                    <span>
                                        Phone
                                    </span>

                                    <strong>
                                        {profile.phone || '—'}
                                    </strong>

                                </div>


                                <div className="settings-profile-field settings-profile-field-wide">

                                    <span>
                                        Address
                                    </span>

                                    <strong>
                                        {profile.address || '—'}
                                    </strong>

                                </div>


                                <div className="settings-profile-field">

                                    <span>
                                        Role
                                    </span>

                                    <strong className="settings-role-badge">
                                        {user?.role || '—'}
                                    </strong>

                                </div>


                                <div className="settings-profile-field settings-profile-field-wide">

                                    <span>
                                        User ID
                                    </span>

                                    <strong className="settings-user-id">
                                        {profile.id || '—'}
                                    </strong>

                                </div>


                            </div>

                        )}

                    </section>


                    <section className="settings-card">

                        <div className="settings-card-heading">
                            <div>
                                <p className="settings-section-label">SECURITY</p>
                                <h2>Change password</h2>
                                <span>
                                    Choose a strong password with at least 8 characters.
                                </span>
                            </div>
                        </div>


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


                        <form
                            className="settings-password-form"
                            onSubmit={handleChangePassword}
                        >

                            <div className="settings-field">

                                <label>
                                    Current password
                                </label>

                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />

                            </div>


                            <div className="settings-field">

                                <label>
                                    New password
                                </label>

                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    minLength={8}
                                    required
                                />

                            </div>


                            <div className="settings-field">

                                <label>
                                    Confirm new password
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    minLength={8}
                                    required
                                />

                            </div>


                            <div className="settings-form-actions">

                                <button
                                    type="submit"
                                    className="settings-save-button"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading
                                        ? 'Saving...'
                                        : 'Change password'
                                    }
                                </button>

                            </div>

                        </form>

                    </section>


                    <section className="settings-card settings-danger-card">

                        <div className="settings-card-heading">

                            <div>
                                <p className="settings-section-label danger">
                                    DANGER ZONE
                                </p>

                                <h2>
                                    Delete account
                                </h2>

                                <span>
                                    Permanently delete your VETApp account.
                                </span>
                            </div>

                        </div>


                        <div className="settings-delete-box">

                            <div>

                                <h3>
                                    Delete your account permanently
                                </h3>

                                <p>
                                    This action cannot be undone. Type
                                    <strong> DELETE </strong>
                                    below to continue.
                                </p>

                            </div>


                            {deleteError && (
                                <div className="settings-message error">
                                    {deleteError}
                                </div>
                            )}


                            <input
                                type="text"
                                value={deleteText}
                                onChange={(e) => setDeleteText(e.target.value)}
                                placeholder="Type DELETE"
                            />


                            <button
                                type="button"
                                className="settings-delete-button"
                                disabled={
                                    deleteText !== 'DELETE' ||
                                    deleteLoading
                                }
                                onClick={handleDeleteAccount}
                            >
                                {deleteLoading
                                    ? 'Deleting...'
                                    : 'Delete my account'
                                }
                            </button>

                        </div>

                    </section>


                    <div className="settings-account-info">
                        Signed in as <strong>{user?.username}</strong>
                    </div>

                </div>

            </main>
        </>
    );
}