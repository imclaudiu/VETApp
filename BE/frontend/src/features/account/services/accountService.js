import api from '../../../shared/services/api';

export const getAdminAccount = async userId => {
    const [authResponse, userResponse] = await Promise.all([
        api.get(`/auth/admin/${userId}`),
        api.get(`/user/admin/${userId}`)
    ]);

    return {
        ...authResponse.data,
        profile: userResponse.data
    };
};

export const updateAdminAccountRole = async (userId, role) => {
    await api.patch(`/auth/${userId}/role`, {
        role
    });
};

export const deleteAdminAccount = async userId => {
    await api.delete(`/auth/delete/${userId}`);
};