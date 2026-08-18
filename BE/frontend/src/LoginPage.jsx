import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(form);
            navigate('/');
        } catch {
            // eroarea e deja in `error`
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
            <input name="password" type="password" placeholder="Parolă" value={form.password} onChange={handleChange} />
            <button type="submit" disabled={loading}>{loading ? 'Se conectează...' : 'Login'}</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}