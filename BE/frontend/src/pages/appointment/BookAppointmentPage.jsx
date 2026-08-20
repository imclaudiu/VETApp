import {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Link,
    useNavigate,
    useSearchParams
} from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';

import {
    getMyPets
} from '../../features/pet/services/petService';

import {
    getClinicById,
    getServicesByClinic,
    getVeterinariansByClinic
} from '../../features/clinic/services/clinicService';

import './BookAppointmentPage.css';

import { useAuth } from '../../features/auth/contexts/AuthContext';

import {
    addAppointment,
    getAvailableSlots,
    getAppointmentsByOwner
} from '../../features/appointment/services/appointmentService';

export default function BookAppointmentPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();


    const clinicId =
        searchParams.get('clinicId');

    const initialVetId =
        searchParams.get('veterinarianId');


    const [clinic, setClinic] =
        useState(null);

    const [pets, setPets] =
        useState([]);

    const [ownerAppointments, setOwnerAppointments] = useState([]);

    const [veterinarians, setVeterinarians] =
        useState([]);

    const [services, setServices] =
        useState([]);

    const [slots, setSlots] =
        useState([]);


    const [form, setForm] =
        useState({

            petId: '',

            veterinarianId:
                initialVetId || '',

            vetServiceId: '',

            day: '',

            startOfAppointment: ''
        });


    const [loading, setLoading] =
        useState(true);

    const [slotsLoading, setSlotsLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState(null);


    useEffect(() => {
        if (!clinicId || !user?.userId) {
            return;
        }

        const loadData = async () => {

            if (!clinicId) {
                setError(
                    'Clinic is missing.'
                );

                setLoading(false);

                return;
            }


            try {

                const [
                    clinicData,
                    petData,
                    vetData,
                    serviceData,
                    appointmentData
                ] = await Promise.all([

                    getClinicById(clinicId),

                    getMyPets(),

                    getVeterinariansByClinic(
                        clinicId
                    ),

                    getServicesByClinic(
                        clinicId
                    ),

                    getAppointmentsByOwner(
                        user.userId
                    )

                ]);


                setClinic(clinicData);

                setPets(petData);

                setVeterinarians(vetData);

                setServices(serviceData);

                setOwnerAppointments(
                    Array.isArray(appointmentData)
                        ? appointmentData
                        : []
                );

            } catch (err) {

                setError(err.message);

            } finally {

                setLoading(false);

            }

        };


        loadData();

    }, [
        clinicId,
        user?.userId
    ]);


    useEffect(() => {

        const loadSlots = async () => {

            /*
             * Nu facem request până când
             * toate câmpurile sunt valide.
             */
            if (
                !form.veterinarianId
                ||
                !form.vetServiceId
                ||
                !isValidDate(form.day)
            ) {

                setSlots([]);

                return;
            }


            setSlotsLoading(true);

            /*
             * Nu ștergem error-ul global aici
             * pentru fiecare caracter introdus.
             */
            try {

                const data =
                    await getAvailableSlots(
                        form.veterinarianId,
                        form.vetServiceId,
                        form.day
                    );


                setSlots(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (err) {

                setSlots([]);


                /*
                 * Dacă medicul pur și simplu
                 * nu are program în ziua respectivă,
                 * nu vrem să stricăm toată pagina.
                 */
                if (err.response?.status === 404) {

                    return;
                }


                setError(
                    err.message ||
                    'Could not load available times.'
                );

            } finally {

                setSlotsLoading(false);

            }

        };


        loadSlots();

    }, [
        form.veterinarianId,
        form.vetServiceId,
        form.day
    ]);

    const isValidDate = (value) => {

        if (!value) {
            return false;
        }

        /*
         * Acceptăm strict:
         * YYYY-MM-DD
         */
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const [year, month, day] =
            value.split('-').map(Number);


        const date =
            new Date(
                year,
                month - 1,
                day
            );


        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        );
    };

    const updateField = (
        field,
        value
    ) => {

        setForm((current) => ({
            ...current,

            [field]: value,

            /*
             * Schimbăm vet/service/date
             * => ora selectată anterior
             * nu mai este sigur validă.
             */
            ...(
                field !==
                    'startOfAppointment'
                    ? {
                        startOfAppointment: ''
                    }
                    : {}
            )
        }));
    };

    const activeAppointmentsByPet =
        useMemo(() => {

            const map = new Map();

            const now = new Date();


            ownerAppointments.forEach(
                (appointment) => {

                    const isActiveStatus =
                        appointment.status === 'PENDING'
                        ||
                        appointment.status === 'CONFIRMED';


                    const endDate =
                        new Date(
                            appointment.endOfAppointment
                            ||
                            appointment.startOfAppointment
                        );


                    const isUpcoming =
                        endDate > now;


                    if (
                        isActiveStatus
                        &&
                        isUpcoming
                    ) {

                        map.set(
                            appointment.petId,
                            appointment
                        );
                    }
                }
            );


            return map;

        }, [ownerAppointments]);


    const handleSubmit = async (e) => {

        e.preventDefault();

        if (
            activeAppointmentsByPet.has(
                form.petId
            )
        ) {

            setError(
                'This pet already has an active appointment.'
            );

            return;
        }

        setSaving(true);
        setError(null);


        try {

            await addAppointment({

                petId:
                    form.petId,

                veterinarianId:
                    form.veterinarianId,

                vetServiceId:
                    Number(
                        form.vetServiceId
                    ),

                startOfAppointment:
                    form.startOfAppointment
            });


            navigate(
                '/dashboard',
                {
                    replace: true
                }
            );

        } catch (err) {

            if (err.response?.status === 409) {

                setError(
                    'This pet already has an active appointment. Cancel the existing appointment before booking another one.'
                );

                /*
                 * Reîncărcăm programările,
                 * în caz că între timp s-a creat
                 * una din alt tab/device.
                 */
                try {

                    const appointments =
                        await getAppointmentsByOwner(
                            user.userId
                        );

                    setOwnerAppointments(
                        appointments
                    );

                } catch {
                    // mesajul principal rămâne
                }


                return;
            }


            setError(
                err.message ||
                'Could not create appointment.'
            );

        } finally {

            setSaving(false);

        }
    };


    const formatSlot = (slot) => {

        return slot
            .split('T')[1]
            ?.slice(0, 5);
    };


    if (loading) {

        return (
            <>
                <Navbar />

                <div className="booking-loading">
                    Loading appointment...
                </div>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="booking-page">

                <div className="booking-container">


                    <Link
                        to={`/clinics/${clinicId}`}
                        className="booking-back"
                    >
                        ← Back to clinic
                    </Link>


                    <div className="booking-header">

                        <p>
                            BOOK APPOINTMENT
                        </p>

                        <h1>
                            {clinic?.name}
                        </h1>

                        <span>
                            Choose your pet,
                            veterinarian, service
                            and appointment time.
                        </span>

                    </div>


                    {error && (

                        <div className="booking-error">
                            {error}
                        </div>

                    )}


                    <form
                        className="booking-card"
                        onSubmit={handleSubmit}
                    >


                        <div className="booking-step">

                            <span>01</span>

                            <div>
                                <h2>
                                    Choose your pet
                                </h2>

                                <select
                                    value={form.petId}
                                    onChange={(e) =>
                                        updateField(
                                            'petId',
                                            e.target.value
                                        )
                                    }
                                    required
                                >

                                    <option value="">
                                        Select pet
                                    </option>


                                    {pets.map((pet) => {

                                        const hasAppointment =
                                            activeAppointmentsByPet.has(
                                                pet.id
                                            );


                                        return (

                                            <option
                                                key={pet.id}
                                                value={pet.id}
                                                disabled={hasAppointment}
                                            >

                                                {pet.name}
                                                {' — '}
                                                {pet.species}

                                                {hasAppointment
                                                    ? ' — Already has an appointment'
                                                    : ''}

                                            </option>

                                        );

                                    })}

                                </select>

                                {pets.length > 0 &&
                                    pets.every(
                                        (pet) =>
                                            activeAppointmentsByPet.has(
                                                pet.id
                                            )
                                    ) && (

                                        <div className="booking-pet-warning">

                                            All your pets currently have
                                            an active appointment.

                                            <span>
                                                Cancel or complete an existing
                                                appointment before booking another one.
                                            </span>

                                        </div>

                                    )}

                            </div>

                        </div>


                        <div className="booking-step">

                            <span>02</span>

                            <div>
                                <h2>
                                    Choose veterinarian
                                </h2>

                                <select
                                    value={
                                        form.veterinarianId
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'veterinarianId',
                                            e.target.value
                                        )
                                    }
                                    required
                                >

                                    <option value="">
                                        Select veterinarian
                                    </option>

                                    {veterinarians.map(
                                        (vet) => (

                                            <option
                                                key={vet.id}
                                                value={vet.id}
                                            >
                                                Dr. {vet.name}
                                                {vet.surgeon
                                                    ? ' — Surgeon'
                                                    : ''}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        </div>


                        <div className="booking-step">

                            <span>03</span>

                            <div>
                                <h2>
                                    Choose service
                                </h2>

                                <div className="booking-services">

                                    {services.map(
                                        (service) => (

                                            <button
                                                type="button"
                                                key={service.id}
                                                className={
                                                    String(
                                                        service.id
                                                    )
                                                        ===
                                                        String(
                                                            form.vetServiceId
                                                        )
                                                        ? 'booking-service selected'
                                                        : 'booking-service'
                                                }
                                                onClick={() =>
                                                    updateField(
                                                        'vetServiceId',
                                                        String(
                                                            service.id
                                                        )
                                                    )
                                                }
                                            >

                                                <strong>
                                                    {
                                                        service
                                                            .serviceName
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        service
                                                            .duration
                                                    }
                                                    {' min'}
                                                </small>

                                                <b>
                                                    {
                                                        service
                                                            .price
                                                    }
                                                    {' RON'}
                                                </b>

                                            </button>

                                        )
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="booking-step">

                            <span>04</span>

                            <div>

                                <h2>
                                    Choose date
                                </h2>

                                <input
                                    type="date"
                                    value={form.day}
                                    min={
                                        new Date()
                                            .toISOString()
                                            .split('T')[0]
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'day',
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                        </div>


                        <div className="booking-step">

                            <span>05</span>

                            <div>

                                <h2>
                                    Choose time
                                </h2>


                                {slotsLoading ? (

                                    <p className="booking-muted">
                                        Loading available times...
                                    </p>

                                ) : slots.length === 0 ? (

                                    <p className="booking-muted">
                                        Select a veterinarian,
                                        service and date to
                                        view available slots.
                                    </p>

                                ) : (

                                    <div className="booking-slots">

                                        {slots.map(
                                            (slot) => (

                                                <button
                                                    type="button"
                                                    key={slot}
                                                    className={
                                                        form.startOfAppointment
                                                            === slot
                                                            ? 'booking-slot selected'
                                                            : 'booking-slot'
                                                    }
                                                    onClick={() =>
                                                        updateField(
                                                            'startOfAppointment',
                                                            slot
                                                        )
                                                    }
                                                >
                                                    {formatSlot(
                                                        slot
                                                    )}
                                                </button>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        </div>


                        <div className="booking-actions">

                            <Link
                                to={`/clinics/${clinicId}`}
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={
                                    saving
                                    ||
                                    !form.petId
                                    ||
                                    !form.veterinarianId
                                    ||
                                    !form.vetServiceId
                                    ||
                                    !form.startOfAppointment
                                }
                            >
                                {saving
                                    ? 'Booking...'
                                    : 'Confirm appointment'}
                            </button>

                        </div>

                    </form>

                </div>

            </main>
        </>
    );
}