import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPage.css';

export default function RegisterPage() {
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

        setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        if (form.password.length < 8) {
            setLocalError('Password must contain at least 8 characters.');
            return;
        }

        try {
            await register({
                username: form.username,
                password: form.password,
                email: form.email,
                phone: form.phone,
                name: form.name,
                address: form.address,
            });

            navigate('/login', {
                replace: true,
                state: {
                    registered: true,
                },
            });
        } catch {
            // eroarea din backend este gestionată de AuthContext
        }
    };

    return (
        <div className="register-page">

            {/* LEFT SIDE */}
            <section className="register-brand-section">
                <div className="register-brand">

                    <div className="register-logo">
                        <span className="register-logo-icon">+</span>
                        <span>VETApp</span>
                    </div>

                    <div className="register-brand-content">

                        <span className="register-badge">
                            Veterinary care, simplified
                        </span>

                        <h1>
                            Everything your pet needs,
                            <span> in one place.</span>
                        </h1>

                        <p>
                            Create your account and easily manage your pets,
                            appointments and medical history.
                        </p>

                        <div className="register-benefits">

                            <div className="register-benefit">
                                <span>✓</span>
                                Manage all your pets
                            </div>

                            <div className="register-benefit">
                                <span>✓</span>
                                Book veterinary appointments
                            </div>

                            <div className="register-benefit">
                                <span>✓</span>
                                Access medical history
                            </div>

                        </div>

                    </div>

                    <p className="register-brand-footer">
                        Care. Connect. Simplify.
                    </p>

                </div>
            </section>


            {/* RIGHT SIDE */}
            <section className="register-form-section">

                <div className="register-container">

                    <div className="register-mobile-logo">
                        <span>+</span>
                        VETApp
                    </div>

                    <div className="register-header">

                        <p className="register-eyebrow">
                            GET STARTED
                        </p>

                        <h2>Create your account</h2>

                        <p>
                            Enter your details to start using VETApp.
                        </p>

                    </div>


                    <form
                        className="register-form"
                        onSubmit={handleSubmit}
                    >

                        {/* FULL NAME */}
                        <div className="register-form-group">

                            <label htmlFor="name">
                                Full name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={handleChange}
                                autoComplete="name"
                                required
                            />

                        </div>


                        {/* USERNAME + EMAIL */}
                        <div className="register-form-row">

                            <div className="register-form-group">

                                <label htmlFor="username">
                                    Username
                                </label>

                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />

                            </div>


                            <div className="register-form-group">

                                <label htmlFor="email">
                                    Email
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />

                            </div>

                        </div>


                        {/* PHONE */}
                        <div className="register-form-group">

                            <label htmlFor="phone">
                                Phone number
                            </label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+40 7..."
                                value={form.phone}
                                onChange={handleChange}
                                autoComplete="tel"
                                required
                            />

                        </div>


                        {/* ADDRESS */}
                        <div className="register-form-group">

                            <label htmlFor="address">
                                Address
                            </label>

                            <input
                                id="address"
                                name="address"
                                type="text"
                                placeholder="Enter your address"
                                value={form.address}
                                onChange={handleChange}
                                autoComplete="street-address"
                                required
                            />

                        </div>


                        {/* PASSWORD */}
                        <div className="register-form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="register-password-wrapper">

                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 8 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                                <button
                                    type="button"
                                    className="register-password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>

                            </div>

                        </div>


                        {/* CONFIRM PASSWORD */}
                        <div className="register-form-group">

                            <label htmlFor="confirmPassword">
                                Confirm password
                            </label>

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                        </div>


                        {(localError || error) && (
                            <div className="register-error">
                                {localError || error}
                            </div>
                        )}


                        <button
                            className="register-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? 'Creating account...'
                                : 'Create account'}
                        </button>

                    </form>


                    <p className="login-link">
                        Already have an account?

                        <Link to="/login">
                            Sign in
                        </Link>
                    </p>

                </div>

            </section>

        </div>
    );
}