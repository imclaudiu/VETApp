import api from '../../../shared/services/api';


export const getMyProfile = async () => {

    const response = await api.get('/user/me');

    return response.data;
};