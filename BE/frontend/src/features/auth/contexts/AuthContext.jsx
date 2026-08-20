import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';

import { jwtDecode } from 'jwt-decode';

import {
    login as loginService,
    register as registerService
} from '../services/authService';


const AuthContext = createContext(null);


/*
 * Decodează tokenul și verifică inclusiv expirarea.
 *
 * JWT exp este exprimat în secunde,
 * Date.now() este exprimat în milisecunde.
 */
function decodeToken(token) {

    if (!token) {
        return null;
    }

    try {

        const payload = jwtDecode(token);

        if (!payload.exp) {
            return null;
        }

        const expirationTime = payload.exp * 1000;

        if (expirationTime <= Date.now()) {
            return null;
        }

        return payload;

    } catch {
        return null;
    }
}


function decodeUser(token) {

    const payload = decodeToken(token);

    if (!payload) {
        return null;
    }

    return {
        userId: payload.userId,
        username: payload.sub,
        role: payload.role,
    };
}


function getInitialToken() {

    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
        return null;
    }

    /*
     * Dacă tokenul din localStorage este:
     * - expirat
     * - corupt
     * - invalid
     *
     * îl ștergem direct.
     */
    if (!decodeToken(storedToken)) {

        localStorage.removeItem('token');

        return null;
    }

    return storedToken;
}


export function AuthProvider({ children }) {

    const [token, setToken] = useState(getInitialToken);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    /*
     * User-ul este calculat direct din token.
     */
    const user = useMemo(() => {

        if (!token) {
            return null;
        }

        return decodeUser(token);

    }, [token]);


    const logout = useCallback(() => {

        /*
         * Ștergem tokenul din browser.
         */
        localStorage.removeItem('token');

        /*
         * Ștergem și tokenul din React state.
         *
         * ProtectedRoute va vedea imediat:
         *
         * isAuthenticated = false
         *
         * și va trimite userul la /login.
         */
        setToken(null);

        setError(null);

    }, []);


    /*
     * LOGOUT AUTOMAT EXACT CÂND TOKENUL EXPIRĂ
     */
    useEffect(() => {

        if (!token) {
            return;
        }

        const payload = decodeToken(token);

        /*
         * Token invalid / deja expirat.
         */
        if (!payload) {

            logout();

            return;
        }

        const expirationTime = payload.exp * 1000;

        const remainingTime =
            expirationTime - Date.now();


        if (remainingTime <= 0) {

            logout();

            return;
        }


        /*
         * Exemplu:
         *
         * token expiră peste 2 ore
         *
         * → după 2 ore logout automat.
         */
        const timeoutId = setTimeout(() => {

            logout();

        }, remainingTime);


        return () => {
            clearTimeout(timeoutId);
        };

    }, [token, logout]);


    /*
     * Ascultăm logout-ul declanșat din api.js.
     *
     * De exemplu backend:
     *
     * 401 Unauthorized
     *
     * api.js
     *    ↓
     * auth:logout
     *    ↓
     * AuthContext
     *    ↓
     * logout()
     */
    useEffect(() => {

        const handleForcedLogout = () => {
            logout();
        };


        window.addEventListener(
            'auth:logout',
            handleForcedLogout
        );


        return () => {

            window.removeEventListener(
                'auth:logout',
                handleForcedLogout
            );

        };

    }, [logout]);


    /*
     * Sincronizare între tab-uri.
     *
     * Dacă ai VETApp deschis în două tab-uri
     * și dai logout într-unul,
     * se face logout și în celălalt.
     */
    useEffect(() => {

        const handleStorageChange = (event) => {

            if (event.key !== 'token') {
                return;
            }


            const newToken = event.newValue;


            /*
             * Token șters în alt tab.
             */
            if (!newToken) {

                setToken(null);

                return;
            }


            /*
             * Dacă noul token nu este valid,
             * nu îl acceptăm.
             */
            if (!decodeToken(newToken)) {

                localStorage.removeItem('token');

                setToken(null);

                return;
            }


            setToken(newToken);
        };


        window.addEventListener(
            'storage',
            handleStorageChange
        );


        return () => {

            window.removeEventListener(
                'storage',
                handleStorageChange
            );

        };

    }, []);


    const login = async (credentials) => {

        setLoading(true);
        setError(null);

        try {

            const data = await loginService(credentials);

            /*
             * Nu acceptăm pur și simplu orice token
             * primit de la server.
             */
            const decodedUser = decodeUser(data.token);

            if (!decodedUser) {

                throw new Error(
                    'The authentication token is invalid or expired.'
                );
            }


            /*
             * Salvăm JWT-ul.
             */
            localStorage.setItem(
                'token',
                data.token
            );


            /*
             * Actualizăm React state.
             */
            setToken(data.token);


            return data;

        } catch (err) {

            const message =
                err.message ||
                'Login failed.';

            setError(message);

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

            const message =
                err.message ||
                'Registration failed.';

            setError(message);

            throw err;

        } finally {

            setLoading(false);

        }
    };


    const isAuthenticated =
        Boolean(token && user);


    return (

        <AuthContext.Provider
            value={{
                user,
                token,

                login,
                register,
                logout,

                loading,
                error,

                isAuthenticated,
            }}
        >

            {children}

        </AuthContext.Provider>
    );
}


export const useAuth = () => {

    return useContext(AuthContext);

};