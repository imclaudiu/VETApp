import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await login(form);
            navigate('/');
        } catch {
            // eroarea este gestionată în AuthContext
        }
    };

    return (
        <div className="login-page">

            <section className="login-brand-section">
                <div className="login-brand">
                    <div className="login-logo">
                        <span className="login-logo-icon">+</span>
                        <span>VETApp</span>
                    </div>

                    <div className="login-brand-content">
                        <span className="login-badge">
                            Veterinary care, simplified
                        </span>

                        <h1>
                            Better care for
                            <span> every pet.</span>
                        </h1>

                        <p>
                            Manage your pets, appointments and medical history
                            from one simple platform.
                        </p>
                    </div>

                    <p className="login-brand-footer">
                        Care. Connect. Simplify.
                    </p>
                </div>
            </section>

            <section className="login-form-section">
                <div className="login-container">

                    <div className="login-mobile-logo">
                        <span>+</span>
                        VETApp
                    </div>

                    <div className="login-header">
                        <p className="login-eyebrow">WELCOME BACK</p>

                        <h2>Sign in to your account</h2>

                        <p>
                            Enter your credentials to continue to VETApp.
                        </p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Enter your username"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="password-label-row">
                                <label htmlFor="password">
                                    Password
                                </label>
                            </div>

                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <button
                            className="login-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="register-link">
                        Don't have an account?
                        <Link to="/register"> Create account</Link>
                    </p>

                </div>
            </section>

        </div>
    );
}