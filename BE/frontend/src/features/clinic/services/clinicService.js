import api from '../../../shared/services/api';


export const getAllClinics = async () => {
    const response = await api.get('/clinic/getAll');

    return response.data;
};


export const getClinicById = async (id) => {
    const response = await api.get(
        `/clinic/get/${id}`
    );

    return response.data;
};


export const getClinicsByCity = async (city) => {
    const response = await api.get(
        `/clinic/city/${encodeURIComponent(city)}`
    );

    return response.data;
};

export const getServicesByClinic = async (clinicId) => {
    const response = await api.get(
        `/vetService/clinic/${clinicId}`
    );

    return response.data;
};

export const getVeterinariansByClinic = async (clinicId) => {
    const response = await api.get(
        `/vet/clinic/${clinicId}`
    );

    return response.data;
};

export const getVeterinarianById = async (id) => {
    const response = await api.get(
        `/vet/get/${id}`
    );

    return response.data;
};


export const getServiceById = async (id) => {
    const response = await api.get(
        `/vetService/get/${id}`
    );

    return response.data;
};