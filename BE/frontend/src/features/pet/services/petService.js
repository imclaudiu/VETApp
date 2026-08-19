// src/features/pet/services/petService.js
import api from '../../../shared/services/api';

export const getMyPets = async () => {
    const response = await api.get('/pet/mine');
    return response.data;
};

export const getPetById = async (id) => {
    const response = await api.get(`/pet/get/${id}`);
    return response.data;
};

export const addPet = async (pet) => {
    const response = await api.post('/pet/add', pet);
    return response.data;
};

export const updatePet = async (id, pet) => {
    const response = await api.put(`/pet/update/${id}`, pet);
    return response.data;
};

export const deletePet = async (id) => {
    await api.delete(`/pet/delete/${id}`);
};