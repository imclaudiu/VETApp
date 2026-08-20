import axios from 'axios';
import { jwtDecode } from 'jwt-decode';


const api = axios.create({
    baseURL: 'http://localhost',
});


function isTokenExpired(token) {

    if (!token) {
        return true;
    }

    try {

        const payload = jwtDecode(token);

        if (!payload.exp) {
            return true;
        }

        return payload.exp * 1000 <= Date.now();

    } catch {

        return true;

    }
}


function forceLogout() {

    /*
     * Ștergem JWT-ul din browser.
     */
    localStorage.removeItem('token');


    /*
     * Anunțăm AuthContext că sesiunea
     * trebuie închisă.
     */
    window.dispatchEvent(
        new Event('auth:logout')
    );
}


/*
 * REQUEST INTERCEPTOR
 *
 * Înainte de ORICE request către backend:
 *
 * 1. ia tokenul
 * 2. verifică dacă este expirat
 * 3. dacă este valid → Authorization Bearer
 * 4. dacă este expirat → logout
 */
api.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem('token');


        if (!token) {
            return config;
        }


        /*
         * NU trimitem token expirat backendului.
         */
        if (isTokenExpired(token)) {

            forceLogout();

            return config;
        }


        config.headers.Authorization =
            `Bearer ${token}`;


        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


/*
 * RESPONSE INTERCEPTOR
 */
api.interceptors.response.use(

    (response) => response,

    (error) => {

        /*
         * Dacă backendul spune:
         *
         * 401 Unauthorized
         *
         * considerăm sesiunea invalidă.
         */
        if (error.response?.status === 401) {

            forceLogout();

        }


        /*
         * Păstrăm Axios error original.
         *
         * Asta este important pentru coduri precum:
         *
         * err.response?.status
         * err.response?.data
         */
        const backendMessage =
            error.response?.data?.message;


        const backendString =
            typeof error.response?.data === 'string'
                ? error.response.data
                : null;


        error.message =
            backendMessage ||
            backendString ||
            error.message ||
            'Unknown error';


        return Promise.reject(error);
    }
);


export default api;