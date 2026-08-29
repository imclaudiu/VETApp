import api from '../../../shared/services/api';

export const getMyProfile = async () => {
    const response = await api.get('/user/me');
    return response.data;
};

export const updateMyProfile = async (userId, data) => {
    const response = await api.put(
        `/user/update/${userId}`,
        data
    );

    return response.data;
};