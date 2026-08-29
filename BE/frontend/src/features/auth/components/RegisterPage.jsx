
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', username: '', email: '', phone: '',
        address: '', password: '', confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) return setLocalError('Passwords do not match.');
        if (form.password.length < 8) return setLocalError('Password must contain at least 8 characters.');

        try {
            await register({
                username: form.username,
                password: form.password,
                email: form.email,
                phone: form.phone,
                name: form.name,
                address: form.address
            });

            navigate('/login', { replace: true, state: { registered: true } });
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

            <main className="auth-layout auth-layout-register">

                <section className="auth-intro">
                    <p className="auth-kicker">YOUR PET'S CARE, IN ONE PLACE</p>

                    <h1>A simpler way to manage your pet's health.</h1>

                    <p className="auth-description">
                        Create an account to book appointments, manage your pets and access their medical history whenever you need it.
                    </p>

                    <div className="auth-features">
                        <span>Manage your pets</span>
                        <span>Book appointments</span>
                        <span>Follow medical history</span>
                        <span>Find veterinary clinics</span>
                    </div>
                </section>

                <section className="auth-card auth-card-register">
                    <div className="auth-card-header">
                        <h2>Create your account</h2>
                        <p>Enter your details to get started with VETApp.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label htmlFor="name">Full name</label>
                            <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" autoComplete="name" required />
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label htmlFor="username">Username</label>
                                <input id="username" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" autoComplete="username" required />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="email">Email</label>
                                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@example.com" autoComplete="email" required />
                            </div>
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label htmlFor="phone">Phone number</label>
                                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+40 7..." autoComplete="tel" required />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="address">Address</label>
                                <input id="address" name="address" value={form.address} onChange={handleChange} placeholder="City, street..." autoComplete="street-address" required />
                            </div>
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label htmlFor="password">Password</label>

                                <div className="auth-password">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 8 characters"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />

                                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="confirmPassword">Confirm password</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repeat password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>

                        {(localError || error) && (
                            <div className="auth-error">{localError || error}</div>
                        )}

                        <button className="auth-submit" type="submit" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </section>

            </main>

            <footer className="auth-footer">
                VETApp · Veterinary care platform
            </footer>

        </div>
    );
}