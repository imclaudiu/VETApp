import api from '../../../shared/services/api';


export const getAllClinics = async () => {
    const response = await api.get('/clinic/getAll');
    return response.data;
};


export const getClinicById = async (id) => {
    const response = await api.get(`/clinic/get/${id}`);
    return response.data;
};


export const getClinicsByCity = async (city) => {
    const response = await api.get(
        `/clinic/city/${encodeURIComponent(city)}`
    );

    return response.data;
};


export const getVeterinariansByClinic = async (clinicId) => {
    const response = await api.get(`/vet/clinic/${clinicId}`);

    const veterinarians = response.data;

    const detailedVeterinarians = await Promise.all(
        veterinarians.map(async (vet) => {
            const detailResponse = await api.get(
                `/vet/get/${vet.id}`
            );

            return detailResponse.data;
        })
    );

    return detailedVeterinarians;
};


export const getServicesByClinic = async (clinicId) => {
    const response = await api.get(
        `/vetService/clinic/${clinicId}`
    );

    return response.data;
};

export const addClinic = async (clinic) => {
    const response = await api.post('/clinic/add', clinic);
    return response.data;
};