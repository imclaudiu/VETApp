import api from '../../../shared/services/api';

export const getAdminDashboardData = async () => {
    const [
        usersResponse,
        petsResponse,
        clinicsResponse,
        veterinariansResponse,
        appointmentsResponse
    ] = await Promise.all([
        api.get('/auth/getAll'),
        api.get('/pet/getAll'),
        api.get('/clinic/getAll'),
        api.get('/vet/getAll'),
        api.get('/appointment/getAll')
    ]);

    return {
        users: usersResponse.data,
        pets: petsResponse.data,
        clinics: clinicsResponse.data,
        veterinarians: veterinariansResponse.data,
        appointments: appointmentsResponse.data
    };
};