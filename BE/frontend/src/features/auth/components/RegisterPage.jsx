import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        password: '',
        email: '',
        phone: '',
        name: '',
        address: '',
    });
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(form);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch {
            // eroarea e deja in `error`
        }
    };

    if (success) {
        return <p>Cont creat cu succes! Te redirecționăm către login...</p>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Creează cont</h2>
            <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Parolă" value={form.password} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="phone" placeholder="Telefon" value={form.phone} onChange={handleChange} required />
            <input name="name" placeholder="Nume complet" value={form.name} onChange={handleChange} required />
            <input name="address" placeholder="Adresă" value={form.address} onChange={handleChange} required />
            <button type="submit" disabled={loading}>{loading ? 'Se creează...' : 'Register'}</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}