import api from '../../../shared/services/api';

export const register = async ({ username, password, email, phone, name, address }) => {
    const response = await api.post('/auth/register', { username, password, email, phone, name, address });
    return response.data;
};

export const login = async ({ username, password }) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data; // { token, user }
};

export const changePassword = async (currentPassword, newPassword) => {
    await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
    });
};

export const deleteAccount = async () => {
    await api.delete('/auth/me');
};