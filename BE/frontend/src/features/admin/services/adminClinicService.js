import api from '../../../shared/services/api';


/* =========================================
   CLINICS
========================================= */

export const getAllClinics = async () => {
    const response = await api.get('/clinic/getAll');
    return response.data;
};


export const getClinicById = async (id) => {
    const response = await api.get(`/clinic/get/${id}`);
    return response.data;
};


export const addClinic = async (clinic) => {
    const response = await api.post('/clinic/add', clinic);
    return response.data;
};


export const updateClinic = async (id, clinic) => {
    const response = await api.put(
        `/clinic/update/${id}`,
        clinic
    );

    return response.data;
};


export const deleteClinic = async (id) => {
    const response = await api.delete(
        `/clinic/delete/${id}`
    );

    return response.data;
};


/*
 * Nu permitem din frontend ștergerea unei clinici
 * care încă are veterinari sau servicii.
 *
 * Altfel ai rămâne cu date orfane în DB.
 */
export const deleteClinicSafely = async (clinicId) => {

    const [veterinarians, services] =
        await Promise.all([
            getVeterinariansByClinic(clinicId),
            getServicesByClinic(clinicId)
        ]);


    if (
        veterinarians.length > 0 ||
        services.length > 0
    ) {
        throw new Error(
            'Delete the clinic veterinarians and services first.'
        );
    }


    return deleteClinic(clinicId);
};


/* =========================================
   USERS
========================================= */

export const getAllUsers = async () => {
    const response = await api.get('/user/getAll');
    return response.data;
};

export const searchUsersByUsername = async username => {
    const response = await api.get(
        '/auth/admin/search',
        {
            params: {
                username
            }
        }
    );

    return response.data;
};


/* =========================================
   VETERINARIANS
========================================= */

export const getAllVeterinarians = async () => {
    const response = await api.get('/vet/getAll');
    return response.data;
};


export const getVeterinariansByClinic =
    async (clinicId) => {

        const response = await api.get(
            `/vet/clinic/${clinicId}`
        );

        return response.data;
    };


export const addVeterinarian =
    async (veterinarian) => {

        const response = await api.post(
            '/vet/add',
            veterinarian
        );

        return response.data;
    };


export const updateVeterinarian =
    async (id, veterinarian) => {

        const response = await api.put(
            `/vet/update/${id}`,
            veterinarian
        );

        return response.data;
    };


export const deleteVeterinarian =
    async (id) => {

        /*
         * Ștergem întâi programul medicului.
         */
        const availability =
            await getAllAvailability();


        const veterinarianAvailability =
            availability.filter(
                (item) =>
                    item.id?.veterinarianId === id
            );


        for (
            const item
            of veterinarianAvailability
        ) {

            await deleteAvailability(
                id,
                item.id.day
            );
        }


        const response = await api.delete(
            `/vet/delete/${id}`
        );

        return response.data;
    };


/* =========================================
   SERVICES
========================================= */

export const getServicesByClinic =
    async (clinicId) => {

        const response = await api.get(
            `/vetService/clinic/${clinicId}`
        );

        return response.data;
    };


export const addVetService =
    async (service) => {

        const response = await api.post(
            '/vetService/add',
            service
        );

        return response.data;
    };


export const updateVetService =
    async (id, service) => {

        const response = await api.put(
            `/vetService/update/${id}`,
            service
        );

        return response.data;
    };


export const deleteVetService =
    async (id) => {

        const response = await api.delete(
            `/vetService/delete/${id}`
        );

        return response.data;
    };


/* =========================================
   AVAILABILITY / WORK SCHEDULE
========================================= */

export const getAllAvailability = async () => {
    const response = await api.get(
        '/availability/getAll'
    );

    return response.data;
};


export const addAvailability =
    async ({
        veterinarianId,
        day,
        startHour,
        endHour
    }) => {

        const response = await api.post(
            '/availability/add',
            {
                id: {
                    veterinarianId,
                    day
                },

                startHour,
                endHour
            }
        );

        return response.data;
    };


export const updateAvailability =
    async (
        veterinarianId,
        day,
        data
    ) => {

        const response = await api.put(
            '/availability/update',
            data,
            {
                params: {
                    veterinarianId,
                    day
                }
            }
        );

        return response.data;
    };


export const deleteAvailability =
    async (
        veterinarianId,
        day
    ) => {

        const response = await api.delete(
            '/availability/delete',
            {
                params: {
                    veterinarianId,
                    day
                }
            }
        );

        return response.data;
    };