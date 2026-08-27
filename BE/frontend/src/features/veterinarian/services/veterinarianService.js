import api from '../../../shared/services/api';

export const getMyVeterinarian = async () => {
    const response = await api.get('/vet/me');
    return response.data;
};

export const getVeterinarianSchedule = async (veterinarianId) => {
    const response = await api.get(`/availability/veterinarian/${veterinarianId}`);
    return response.data;
};

export const addAvailability = async (veterinarianId, day, startHour, endHour) => {
    const response = await api.post('/availability/add', {
        id: {
            veterinarianId,
            day
        },
        startHour,
        endHour
    });

    return response.data;
};

export const updateAvailability = async (veterinarianId, day, startHour, endHour) => {
    const response = await api.put('/availability/update', {
        startHour,
        endHour
    }, {
        params: {
            veterinarianId,
            day
        }
    });

    return response.data;
};

export const deleteAvailability = async (veterinarianId, day) => {
    await api.delete('/availability/delete', {
        params: {
            veterinarianId,
            day
        }
    });
};

export const getAppointmentsByVeterinarian = async (veterinarianId) => {
    const response = await api.get(`/appointment/veterinarian/${veterinarianId}`);
    return response.data;
};