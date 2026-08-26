import api from '../../../shared/services/api';


export const getAvailableSlots = async (
    veterinarianId,
    vetServiceId,
    day
) => {

    const response = await api.get(
        '/appointment/available-slots',
        {
            params: {
                veterinarianId,
                vetServiceId,
                day
            }
        }
    );

    return response.data;
};


export const addAppointment = async (
    appointment
) => {

    const response = await api.post(
        '/appointment/add',
        appointment
    );

    return response.data;
};


export const getAppointmentsByOwner =
    async (ownerId) => {

        const response = await api.get(
            `/appointment/owner/${ownerId}`
        );

        return response.data;
    };

export const cancelAppointment = async (appointmentId) => {
    const response = await api.patch(`/appointment/cancel/${appointmentId}`);
    return response.data;
};

export const getAppointmentsByVeterinarian = async (veterinarianId) => {
    const response = await api.get(`/appointment/veterinarian/${veterinarianId}`);
    return response.data;
};


export const markAppointmentNoShow = async (appointmentId) => {
    const response = await api.patch(`/appointment/no-show/${appointmentId}`);
    return response.data;
};

export const confirmAppointment = async (appointmentId) => {
    const response = await api.patch(`/appointment/confirm/${appointmentId}`);
    return response.data;
};
