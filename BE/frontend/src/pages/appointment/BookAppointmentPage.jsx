import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '../../shared/components/Navbar';
import { useAuth } from '../../features/auth/contexts/AuthContext';

import { getMyPets } from '../../features/pet/services/petService';
import {
    getClinicById,
    getServicesByClinic,
    getVeterinariansByClinic
} from '../../features/clinic/services/clinicService';

import {
    addAppointment,
    getAvailableSlots,
    getAppointmentsByOwner
} from '../../features/appointment/services/appointmentService';

import './BookAppointmentPage.css';

export default function BookAppointmentPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const clinicId = searchParams.get('clinicId');
    const initialVetId = searchParams.get('veterinarianId');

    const [clinic, setClinic] = useState(null);
    const [pets, setPets] = useState([]);
    const [veterinarians, setVeterinarians] = useState([]);
    const [services, setServices] = useState([]);
    const [slots, setSlots] = useState([]);
    const [ownerAppointments, setOwnerAppointments] = useState([]);

    const [form, setForm] = useState({
        petId: '',
        veterinarianId: initialVetId || '',
        vetServiceId: '',
        day: '',
        startOfAppointment: ''
    });

    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const isValidDate = value => parseDate(value) !== null;

    useEffect(() => {
        if (!clinicId) {
            setError('Clinic is missing.');
            setLoading(false);
            return;
        }

        if (!user?.userId) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);

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
                    getVeterinariansByClinic(clinicId),
                    getServicesByClinic(clinicId),
                    getAppointmentsByOwner(user.userId)
                ]);

                setClinic(clinicData);
                setPets(Array.isArray(petData) ? petData : []);
                setVeterinarians(Array.isArray(vetData) ? vetData : []);
                setServices(Array.isArray(serviceData) ? serviceData : []);
                setOwnerAppointments(Array.isArray(appointmentData) ? appointmentData : []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Could not load booking information.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [clinicId, user?.userId]);

    const parseDate = value => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;

        const [day, month, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day ||
            date < today
        ) return null;

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const handleDateChange = e => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 8);

        if (value.length > 4) {
            value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
        } else if (value.length > 2) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }

        updateField('day', value);
    };

    useEffect(() => {
        const loadSlots = async () => {
            if (
                !form.veterinarianId ||
                !form.vetServiceId ||
                !isValidDate(form.day)
            ) {
                setSlots([]);
                return;
            }

            setSlotsLoading(true);

            try {
                const backendDay = parseDate(form.day);

                const data = await getAvailableSlots(
                    form.veterinarianId,
                    form.vetServiceId,
                    backendDay
                );
                setSlots(Array.isArray(data) ? data : []);
            } catch (err) {
                setSlots([]);

                if (err.response?.status !== 404) {
                    setError(err.response?.data?.message || err.message || 'Could not load available times.');
                }
            } finally {
                setSlotsLoading(false);
            }
        };

        loadSlots();
    }, [form.veterinarianId, form.vetServiceId, form.day]);

    const activeAppointmentsByPet = useMemo(() => {
        const map = new Map();
        const now = new Date();

        ownerAppointments.forEach(appointment => {
            const active =
                appointment.status === 'PENDING' ||
                appointment.status === 'CONFIRMED';

            const end = new Date(
                appointment.endOfAppointment ||
                appointment.startOfAppointment
            );

            if (active && end > now) {
                map.set(appointment.petId, appointment);
            }
        });

        return map;
    }, [ownerAppointments]);

    const selectedPet = useMemo(
        () => pets.find(pet => String(pet.id) === String(form.petId)),
        [pets, form.petId]
    );

    const selectedVet = useMemo(
        () => veterinarians.find(vet => String(vet.id) === String(form.veterinarianId)),
        [veterinarians, form.veterinarianId]
    );

    const selectedService = useMemo(
        () => services.find(service => String(service.id) === String(form.vetServiceId)),
        [services, form.vetServiceId]
    );

    const updateField = (field, value) => {
        setError(null);

        setForm(current => {
            const next = { ...current, [field]: value };

            if (field === 'veterinarianId') {
                next.day = '';
                next.startOfAppointment = '';
            }

            if (field === 'vetServiceId' || field === 'day') {
                next.startOfAppointment = '';
            }

            return next;
        });
    };

    const formatSlot = slot => slot?.split('T')[1]?.slice(0, 5) || slot;

    const formatDate = value => {
        if (!value) return 'Not selected';
        if (!isValidDate(value)) return 'Invalid date';

        return value;
    };
    {
        form.day && form.day.length === 10 && !isValidDate(form.day) && (
            <p className="booking-date-error">
                Please enter a valid future date in DD/MM/YYYY format.
            </p>
        )
    }


    const currentStep = !form.petId
        ? 1
        : !form.veterinarianId
            ? 2
            : !form.vetServiceId
                ? 3
                : !form.day || !form.startOfAppointment
                    ? 4
                    : 5;

    const handleSubmit = async e => {
        e.preventDefault();

        if (activeAppointmentsByPet.has(form.petId)) {
            setError('This pet already has an active appointment.');
            return;
        }

        if (
            !form.petId ||
            !form.veterinarianId ||
            !form.vetServiceId ||
            !form.startOfAppointment
        ) {
            setError('Please complete all booking steps.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await addAppointment({
                petId: form.petId,
                veterinarianId: form.veterinarianId,
                vetServiceId: Number(form.vetServiceId),
                startOfAppointment: form.startOfAppointment
            });

            navigate('/dashboard', { replace: true });
        } catch (err) {
            if (err.response?.status === 409) {
                setError(
                    'This pet already has an active appointment. Cancel the existing appointment before booking another one.'
                );

                try {
                    const appointments = await getAppointmentsByOwner(user.userId);
                    setOwnerAppointments(Array.isArray(appointments) ? appointments : []);
                } catch {
                    // keep main error
                }

                return;
            }

            setError(err.response?.data?.message || err.message || 'Could not create appointment.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <main className="booking-page">
                    <div className="booking-loading">
                        <div className="booking-spinner" />
                        <p>Loading appointment...</p>
                    </div>
                </main>
            </>
        );
    }

    if (!clinic) {
        return (
            <>
                <Navbar />

                <main className="booking-page">
                    <div className="booking-container">
                        <div className="booking-load-error">
                            <h2>Booking unavailable</h2>
                            <p>{error || 'Clinic could not be loaded.'}</p>
                            <Link to="/clinics" className="primary-button">Back to clinics</Link>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="booking-page">
                <div className="booking-container">

                    <Link to={`/clinics/${clinicId}`} className="booking-back">
                        ← Back to clinic
                    </Link>

                    <header className="booking-header">
                        <span>BOOK APPOINTMENT</span>
                        <h1>Schedule a visit</h1>
                        <p>
                            Book an appointment at <strong>{clinic.name}</strong>.
                        </p>
                    </header>

                    <div className="booking-progress">
                        {['Pet', 'Veterinarian', 'Service', 'Date & time', 'Confirm'].map((label, index) => {
                            const step = index + 1;

                            return (
                                <div
                                    key={label}
                                    className={`booking-progress-step ${step < currentStep
                                        ? 'completed'
                                        : step === currentStep
                                            ? 'active'
                                            : ''
                                        }`}
                                >
                                    <span>{step < currentStep ? '✓' : step}</span>
                                    <p>{label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {error && <div className="booking-error">{error}</div>}

                    <form className="booking-layout" onSubmit={handleSubmit}>

                        <div className="booking-main">

                            <section className="booking-section">
                                <div className="booking-section-heading">
                                    <span>1</span>

                                    <div>
                                        <h2>Choose your pet</h2>
                                        <p>Select the pet that needs veterinary care.</p>
                                    </div>
                                </div>

                                {pets.length === 0 ? (
                                    <div className="booking-empty">
                                        <h3>You don't have any pets yet</h3>
                                        <p>Add a pet before creating an appointment.</p>
                                        <Link to="/pets/new">Add pet</Link>
                                    </div>
                                ) : (
                                    <div className="booking-choice-grid">
                                        {pets.map(pet => {
                                            const unavailable = activeAppointmentsByPet.has(pet.id);
                                            const selected = String(form.petId) === String(pet.id);

                                            return (
                                                <button
                                                    type="button"
                                                    key={pet.id}
                                                    className={`booking-choice-card${selected ? ' selected' : ''}`}
                                                    disabled={unavailable}
                                                    onClick={() => updateField('petId', pet.id)}
                                                >
                                                    <div className="booking-pet-avatar">
                                                        {pet.name?.charAt(0)?.toUpperCase() || 'P'}
                                                    </div>

                                                    <div>
                                                        <strong>{pet.name}</strong>
                                                        <p>{pet.species}{pet.race ? ` · ${pet.race}` : ''}</p>

                                                        {unavailable && (
                                                            <small>Already has an active appointment</small>
                                                        )}
                                                    </div>

                                                    <span className="booking-choice-check">
                                                        {selected ? '✓' : ''}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section className={`booking-section${!form.petId ? ' disabled' : ''}`}>
                                <div className="booking-section-heading">
                                    <span>2</span>

                                    <div>
                                        <h2>Choose a veterinarian</h2>
                                        <p>Select a veterinarian from {clinic.name}.</p>
                                    </div>
                                </div>

                                {!form.petId ? (
                                    <p className="booking-disabled-text">
                                        Choose your pet first.
                                    </p>
                                ) : veterinarians.length === 0 ? (
                                    <div className="booking-empty">
                                        <h3>No veterinarians available</h3>
                                        <p>This clinic currently has no registered veterinarians.</p>
                                    </div>
                                ) : (
                                    <div className="booking-choice-grid">
                                        {veterinarians.map(vet => {
                                            const selected =
                                                String(form.veterinarianId) === String(vet.id);

                                            return (
                                                <button
                                                    type="button"
                                                    key={vet.id}
                                                    className={`booking-choice-card${selected ? ' selected' : ''}`}
                                                    onClick={() => updateField('veterinarianId', vet.id)}
                                                >
                                                    <div className="booking-vet-avatar">
                                                        {vet.name?.charAt(0)?.toUpperCase() || 'V'}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {vet.name ? `Dr. ${vet.name}` : 'Veterinarian'}
                                                        </strong>

                                                        <p>
                                                            {vet.surgeon ? 'Veterinary surgeon' : 'Veterinarian'}
                                                        </p>
                                                    </div>

                                                    <span className="booking-choice-check">
                                                        {selected ? '✓' : ''}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section className={`booking-section${!form.veterinarianId ? ' disabled' : ''}`}>
                                <div className="booking-section-heading">
                                    <span>3</span>

                                    <div>
                                        <h2>Choose a service</h2>
                                        <p>Select the veterinary service you need.</p>
                                    </div>
                                </div>

                                {!form.veterinarianId ? (
                                    <p className="booking-disabled-text">
                                        Choose a veterinarian first.
                                    </p>
                                ) : services.length === 0 ? (
                                    <div className="booking-empty">
                                        <h3>No services available</h3>
                                        <p>This clinic currently has no registered services.</p>
                                    </div>
                                ) : (
                                    <div className="booking-services">
                                        {services.map(service => {
                                            const selected =
                                                String(form.vetServiceId) === String(service.id);

                                            return (
                                                <button
                                                    type="button"
                                                    key={service.id}
                                                    className={`booking-service${selected ? ' selected' : ''}`}
                                                    onClick={() => updateField('vetServiceId', String(service.id))}
                                                >
                                                    <div>
                                                        <strong>{service.serviceName}</strong>
                                                        <p>{service.description || 'Veterinary service'}</p>
                                                    </div>

                                                    <div className="booking-service-meta">
                                                        <span>{service.duration} min</span>
                                                        <b>{Number(service.price || 0).toFixed(2)} RON</b>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section className={`booking-section${!form.vetServiceId ? ' disabled' : ''}`}>
                                <div className="booking-section-heading">
                                    <span>4</span>

                                    <div>
                                        <h2>Choose date and time</h2>
                                        <p>Available times are based on the veterinarian's schedule.</p>
                                    </div>
                                </div>

                                {!form.vetServiceId ? (
                                    <p className="booking-disabled-text">
                                        Choose a service first.
                                    </p>
                                ) : (
                                    <>
                                        <div className="booking-date-field">
                                            <label>Date</label>

                                            <input
                                                type="text"
                                                value={form.day}
                                                onChange={handleDateChange}
                                                placeholder="DD/MM/YYYY"
                                                maxLength={10}
                                            />
                                        </div>

                                        {form.day && (
                                            <div className="booking-times">
                                                <label>Available times</label>

                                                {slotsLoading ? (
                                                    <p className="booking-muted">
                                                        Loading available times...
                                                    </p>
                                                ) : slots.length === 0 ? (
                                                    <div className="booking-no-slots">
                                                        <strong>No available times</strong>
                                                        <p>Try another date or veterinarian.</p>
                                                    </div>
                                                ) : (
                                                    <div className="booking-slots">
                                                        {slots.map(slot => (
                                                            <button
                                                                type="button"
                                                                key={slot}
                                                                className={`booking-slot${form.startOfAppointment === slot
                                                                    ? ' selected'
                                                                    : ''
                                                                    }`}
                                                                onClick={() =>
                                                                    updateField('startOfAppointment', slot)
                                                                }
                                                            >
                                                                {formatSlot(slot)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>

                        </div>

                        <aside className="booking-summary">
                            <div className="booking-summary-card">
                                <span className="booking-summary-label">APPOINTMENT SUMMARY</span>
                                <h2>Your appointment</h2>

                                <div className="booking-summary-clinic">
                                    <strong>{clinic.name}</strong>
                                    <p>{clinic.address || clinic.city}</p>
                                </div>

                                <div className="booking-summary-list">
                                    <div>
                                        <span>Pet</span>
                                        <strong>{selectedPet?.name || 'Not selected'}</strong>
                                    </div>

                                    <div>
                                        <span>Veterinarian</span>
                                        <strong>
                                            {selectedVet
                                                ? selectedVet.name
                                                    ? `Dr. ${selectedVet.name}`
                                                    : 'Veterinarian'
                                                : 'Not selected'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Service</span>
                                        <strong>
                                            {selectedService?.serviceName || 'Not selected'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Date</span>
                                        <strong>{formatDate(form.day)}</strong>
                                    </div>

                                    <div>
                                        <span>Time</span>
                                        <strong>
                                            {form.startOfAppointment
                                                ? formatSlot(form.startOfAppointment)
                                                : 'Not selected'}
                                        </strong>
                                    </div>
                                </div>

                                {selectedService && (
                                    <div className="booking-summary-price">
                                        <span>Estimated price</span>
                                        <strong>
                                            {Number(selectedService.price || 0).toFixed(2)} RON
                                        </strong>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="primary-button booking-confirm-button"
                                    disabled={
                                        saving ||
                                        !form.petId ||
                                        !form.veterinarianId ||
                                        !form.vetServiceId ||
                                        !form.startOfAppointment
                                    }
                                >
                                    {saving ? 'Booking...' : 'Confirm appointment'}
                                </button>

                                <Link
                                    to={`/clinics/${clinicId}`}
                                    className="booking-cancel-link"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </aside>

                    </form>

                </div>
            </main>
        </>
    );
}