import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(form);
            navigate('/');
        } catch { }
    };

    return (
        <div className="auth-page">

            <header className="auth-header">
                <Link to="/login" className="auth-logo">
                    <span className="auth-logo-mark">+</span>
                    <span>VETApp</span>
                </Link>

                <span className="auth-header-text">Pet care, organized.</span>
            </header>

            <main className="auth-layout">

                <section className="auth-intro">
                    <p className="auth-kicker">VETERINARY CARE PLATFORM</p>

                    <h1>Care for your pet without the paperwork.</h1>

                    <p className="auth-description">
                        Keep appointments, medical records and your pet's information together in one simple place.
                    </p>

                    <div className="auth-features">
                        <span>Appointments</span>
                        <span>Medical history</span>
                        <span>Veterinary clinics</span>
                        <span>AI assistance</span>
                    </div>
                </section>

                <section className="auth-card">
                    <div className="auth-card-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to access your VETApp account.</p>
                    </div>

                    {location.state?.registered && (
                        <div className="auth-success">
                            Account created successfully. You can now sign in.
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">Password</label>

                            <div className="auth-password">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />

                                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button className="auth-submit" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        New to VETApp? <Link to="/register">Create an account</Link>
                    </p>
                </section>

            </main>

            <footer className="auth-footer">
                VETApp · Veterinary care platform
            </footer>

        </div>
    );
}