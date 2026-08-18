import { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as loginService, register as registerService } from '../services/authService';

const AuthContext = createContext(null);

function decodeUser(token) {
    try {
        const payload = jwtDecode(token);
        return {
            userId: payload.userId,
            username: payload.sub,
            role: payload.role,
        };
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('token');
        return stored ? decodeUser(stored) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (credentials) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginService(credentials);
            setToken(data.token);
            setUser(decodeUser(data.token));
            localStorage.setItem('token', data.token);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            return await registerService(formData);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading, error, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);