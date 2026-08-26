import api from '../../../shared/services/api';

export const createMedicalRecord = async (medicalRecord) => {
    const response = await api.post('/medicalr/add', medicalRecord);
    return response.data;
};

export const getMedicalRecordsByPet = async (petId) => {
    const response = await api.get(`/medicalr/pet/${petId}`);
    return response.data;
};

export const getMedicalRecordsForVeterinarian = async (
    petId,
    appointmentId
) => {
    const response = await api.get(
        `/medicalr/pet/${petId}/appointment/${appointmentId}`
    );

    return response.data;
};