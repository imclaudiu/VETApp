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