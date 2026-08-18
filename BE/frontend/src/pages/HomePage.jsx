import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/contexts/AuthContext';

export default function HomePage() {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <div>
            <h1>VetApp</h1>

            {isAuthenticated ? (
                <div>
                    <p>Salut, {user?.username}! (rol: {user?.role})</p>
                    <button onClick={logout}>Logout</button>
                    {user?.role === 'ADMIN' && (
                        <p><Link to="/admin">Panou Admin</Link></p>
                    )}
                </div>
            ) : (
                <div>
                    <p><Link to="/login">Login</Link></p>
                    <p><Link to="/register">Register</Link></p>
                </div>
            )}
        </div>
    );
}